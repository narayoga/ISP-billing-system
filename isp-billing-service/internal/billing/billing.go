package billing

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/all-over/isp-billing-service/internal/notify"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GenerateResult ringkasan hasil generate tagihan massal.
type GenerateResult struct {
	Period  string `json:"period"`
	Created int    `json:"created"`
	Skipped int    `json:"skipped"`
}

type billableCustomer struct {
	id     int64
	email  string
	phone  string
	name   string
	amount int64
}

// CurrentPeriod mengembalikan period YYYY-MM dari waktu now.
func CurrentPeriod(now time.Time) string { return now.Format("2006-01") }

// GenerateMonthly membuat invoice 'unpaid' untuk semua pelanggan billable
// (status active/overdue/isolated) pada period (YYYY-MM). due_date = tanggal 20.
// Idempoten lewat UNIQUE(customer_id, period): yang sudah ada di-skip (US-04 AC6).
func GenerateMonthly(
	ctx context.Context,
	pool *pgxpool.Pool,
	period string,
	n notify.Notifier,
	publicBaseURL string,
) (GenerateResult, error) {
	due, err := dueDate(period)
	if err != nil {
		return GenerateResult{}, err
	}
	dueStr := due.Format("2006-01-02")

	// COALESCE: sejak PRD v3.0 kolom email boleh NULL (kanal pendamping,
	// bukan identitas login lagi) — tanpa ini Scan akan gagal.
	rows, err := pool.Query(ctx, `
		SELECT c.id, COALESCE(c.email, ''), c.phone, c.name, p.price
		FROM customers c
		JOIN packages p ON p.id = c.package_id
		WHERE c.status IN ('active','overdue','isolated')
		ORDER BY c.id`)
	if err != nil {
		return GenerateResult{}, err
	}
	var custs []billableCustomer
	for rows.Next() {
		var bc billableCustomer
		if err := rows.Scan(&bc.id, &bc.email, &bc.phone, &bc.name, &bc.amount); err != nil {
			rows.Close()
			return GenerateResult{}, err
		}
		custs = append(custs, bc)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return GenerateResult{}, err
	}

	res := GenerateResult{Period: period}
	for _, bc := range custs {
		// RETURNING id diperlukan untuk menerbitkan token akses (PRD v3.0 US-04 AC5).
		// Saat konflik (invoice periode ini sudah ada), ON CONFLICT DO NOTHING tidak
		// mengembalikan baris → pgx.ErrNoRows. Itulah penanda "dilewati", menggantikan
		// pengecekan RowsAffected sebelumnya.
		var invoiceID int64
		err := pool.QueryRow(ctx, `
			INSERT INTO invoices (customer_id, period, amount, due_date, status)
			VALUES ($1, $2, $3, $4, 'unpaid')
			ON CONFLICT (customer_id, period) DO NOTHING
			RETURNING id`,
			bc.id, period, bc.amount, dueStr).Scan(&invoiceID)
		if errors.Is(err, pgx.ErrNoRows) {
			res.Skipped++
			continue
		}
		if err != nil {
			return res, err
		}
		res.Created++

		link := invoiceLink(ctx, pool, publicBaseURL, invoiceID)
		n.Notify(notify.Recipient{Email: bc.email, Phone: bc.phone},
			"Tagihan bulan ini telah terbit",
			fmt.Sprintf("Halo %s, tagihan periode %s sebesar %s telah terbit. Jatuh tempo %s.%s",
				bc.name, period, formatRupiah(bc.amount), dueStr, ajakanBayar(link)))
	}
	return res, nil
}

// MarkOverdue mengubah invoice 'unpaid' yang sudah lewat due_date menjadi
// 'overdue' (PRD §6: mulai tanggal 21), lalu menandai pelanggannya 'Menunggak'
// (customers.status = 'overdue') selama belum terisolir. Mengembalikan jumlah
// invoice yang berubah.
func MarkOverdue(ctx context.Context, pool *pgxpool.Pool, today time.Time) (int, error) {
	tag, err := pool.Exec(ctx, `
		UPDATE invoices SET status = 'overdue', updated_at = NOW()
		WHERE status = 'unpaid' AND due_date < $1`,
		today.Format("2006-01-02"))
	if err != nil {
		return 0, err
	}
	if err := SyncArrearsStatus(ctx, pool); err != nil {
		return int(tag.RowsAffected()), err
	}
	return int(tag.RowsAffected()), nil
}

// SyncArrearsStatus menyelaraskan status pelanggan dengan kondisi tagihannya
// (PRD §6 & Lampiran A):
//   - punya invoice overdue & masih 'active'  → 'overdue' (Menunggak)
//   - tidak punya tunggakan & masih 'overdue' → 'active'  (Aktif)
//
// Pelanggan 'isolated' / 'inactive' / 'pending_provisioning' tidak disentuh.
func SyncArrearsStatus(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, `
		UPDATE customers c SET status = 'overdue', updated_at = NOW()
		WHERE c.status = 'active'
		  AND EXISTS (SELECT 1 FROM invoices i
		              WHERE i.customer_id = c.id AND i.status = 'overdue')`); err != nil {
		return err
	}
	_, err := pool.Exec(ctx, `
		UPDATE customers c SET status = 'active', updated_at = NOW()
		WHERE c.status = 'overdue'
		  AND NOT EXISTS (SELECT 1 FROM invoices i
		                  WHERE i.customer_id = c.id
		                    AND i.status IN ('unpaid','overdue','awaiting_verification'))`)
	return err
}

func dueDate(period string) (time.Time, error) {
	t, err := time.Parse("2006-01", period)
	if err != nil {
		return time.Time{}, fmt.Errorf("period tidak valid %q (harus YYYY-MM)", period)
	}
	return time.Date(t.Year(), t.Month(), 20, 0, 0, 0, 0, time.UTC), nil
}
