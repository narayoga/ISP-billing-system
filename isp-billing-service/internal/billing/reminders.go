package billing

import (
	"context"
	"fmt"

	"github.com/all-over/isp-billing-service/internal/notify"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RemindDue mengirim email pengingat ke semua pelanggan yang invoice period ini
// masih unpaid/overdue. Dipakai cron H-3 (tgl 17) dan jatuh tempo (tgl 20).
func RemindDue(
	ctx context.Context,
	pool *pgxpool.Pool,
	n notify.Notifier,
	period, subject, prefix string,
	publicBaseURL string,
) (int, error) {
	// i.id diperlukan untuk menerbitkan/memperpanjang token tautan tagihan.
	// COALESCE email: sejak PRD v3.0 kolom itu boleh NULL.
	rows, err := pool.Query(ctx, `
		SELECT i.id, COALESCE(c.email, ''), c.phone, c.name, i.amount, i.due_date::text
		FROM invoices i
		JOIN customers c ON c.id = i.customer_id
		WHERE i.period = $1 AND i.status IN ('unpaid','overdue')`, period)
	if err != nil {
		return 0, err
	}
	type target struct {
		invoiceID               int64
		email, phone, name, due string
		amount                  int64
	}
	var targets []target
	for rows.Next() {
		var t target
		if err := rows.Scan(&t.invoiceID, &t.email, &t.phone, &t.name, &t.amount, &t.due); err != nil {
			rows.Close()
			return 0, err
		}
		targets = append(targets, t)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}

	for _, t := range targets {
		link := invoiceLink(ctx, pool, publicBaseURL, t.invoiceID)
		n.Notify(notify.Recipient{Email: t.email, Phone: t.phone}, subject,
			fmt.Sprintf("%s Halo %s, tagihan periode %s sebesar %s jatuh tempo %s.%s",
				prefix, t.name, period, formatRupiah(t.amount), t.due, ajakanBayar(link)))
	}
	return len(targets), nil
}
