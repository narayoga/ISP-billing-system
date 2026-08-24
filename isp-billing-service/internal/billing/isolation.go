package billing

import (
	"context"
	"log"

	"github.com/all-over/isp-billing-service/internal/audit"
	"github.com/all-over/isp-billing-service/internal/mikrotik"
	"github.com/all-over/isp-billing-service/internal/notify"
	"github.com/jackc/pgx/v5/pgxpool"
)

type isolTarget struct {
	id    int64
	pppoe string
	email string
	name  string
}

// isolateCustomer: disable PPPoE (retry) → status isolated → audit → notifikasi.
func isolateCustomer(
	ctx context.Context,
	pool *pgxpool.Pool,
	net mikrotik.Provider,
	n notify.Notifier,
	t isolTarget,
	adminID *int64,
	trigger string,
	publicBaseURL string,
) error {
	if err := mikrotik.WithRetry(ctx, func() error { return net.DisablePPPoE(ctx, t.pppoe) }); err != nil {
		return err
	}
	if _, err := pool.Exec(ctx,
		`UPDATE customers SET status = 'isolated', updated_at = NOW() WHERE id = $1`, t.id); err != nil {
		return err
	}
	_ = audit.Write(ctx, pool, adminID, "isolate_customer", "customer", &t.id,
		map[string]any{"pppoe": t.pppoe, "trigger": trigger})

	// Notifikasi isolir (PRD §8: "Mulai terisolir → Email Ya").
	// Isolir berbasis pelanggan, bukan invoice tertentu — jadi tautan diambil
	// dari tagihan belum lunas terbaru miliknya.
	if n != nil && t.email != "" {
		link := ""
		if invoiceID, ok := latestOutstandingInvoice(ctx, pool, t.id); ok {
			link = invoiceLink(ctx, pool, publicBaseURL, invoiceID)
		}
		n.Email(t.email, "Layanan internet Anda dinonaktifkan sementara",
			"Halo "+t.name+", layanan internet Anda kami nonaktifkan sementara karena "+
				"tagihan belum dibayar. Layanan akan aktif kembali setelah pembayaran "+
				"diverifikasi."+ajakanBayar(link))
	}
	return nil
}

// IsolateOverdue men-disable PPPoE untuk semua pelanggan yang masih punya invoice
// unpaid/overdue dan belum terisolir. Dipanggil cron tanggal 24 (US-03 AC1).
func IsolateOverdue(
	ctx context.Context,
	pool *pgxpool.Pool,
	net mikrotik.Provider,
	n notify.Notifier,
	publicBaseURL string,
) (int, error) {
	rows, err := pool.Query(ctx, `
		SELECT DISTINCT c.id, c.pppoe_username, COALESCE(c.email, ''), c.name
		FROM customers c
		JOIN invoices i ON i.customer_id = c.id
		WHERE i.status IN ('unpaid','overdue')
		  AND c.status IN ('active','overdue')`)
	if err != nil {
		return 0, err
	}
	var targets []isolTarget
	for rows.Next() {
		var t isolTarget
		if err := rows.Scan(&t.id, &t.pppoe, &t.email, &t.name); err != nil {
			rows.Close()
			return 0, err
		}
		targets = append(targets, t)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}

	isolated := 0
	for _, t := range targets {
		if err := isolateCustomer(ctx, pool, net, n, t, nil, "cron", publicBaseURL); err != nil {
			log.Printf("[isolir] gagal isolir customer %d (%s): %v", t.id, t.pppoe, err)
			// Antrikan untuk dicoba ulang + alert admin (PRD §10).
			if qErr := EnqueueJob(ctx, pool, t.id, "isolate", err.Error()); qErr != nil {
				log.Printf("[isolir] gagal enqueue job customer %d: %v", t.id, qErr)
			}
			continue
		}
		isolated++
	}
	return isolated, nil
}

// IsolateOne isolir manual oleh admin. Idempoten: no-op bila sudah terisolir/non-aktif.
func IsolateOne(
	ctx context.Context,
	pool *pgxpool.Pool,
	net mikrotik.Provider,
	n notify.Notifier,
	customerID, adminID int64,
	publicBaseURL string,
) (bool, error) {
	t := isolTarget{id: customerID}
	var status string
	if err := pool.QueryRow(ctx,
		`SELECT pppoe_username, status, COALESCE(email, ''), name FROM customers WHERE id = $1`, customerID).
		Scan(&t.pppoe, &status, &t.email, &t.name); err != nil {
		return false, err
	}
	if status == "isolated" || status == "inactive" {
		return false, nil
	}
	if err := isolateCustomer(ctx, pool, net, n, t, &adminID, "manual", publicBaseURL); err != nil {
		if qErr := EnqueueJob(ctx, pool, customerID, "isolate", err.Error()); qErr != nil {
			log.Printf("[isolir] gagal enqueue job customer %d: %v", customerID, qErr)
		}
		return false, err
	}
	return true, nil
}

// Reactivate enable PPPoE + status active. Idempoten: no-op bila tidak terisolir.
// adminID nil + trigger "auto_payment" untuk panggilan dari isp-api-service (approve);
// adminID terisi + trigger "manual" untuk buka isolir manual.
func Reactivate(
	ctx context.Context,
	pool *pgxpool.Pool,
	net mikrotik.Provider,
	customerID int64,
	adminID *int64,
	trigger string,
) (bool, error) {
	var pppoe, status string
	if err := pool.QueryRow(ctx,
		`SELECT pppoe_username, status FROM customers WHERE id = $1`, customerID).
		Scan(&pppoe, &status); err != nil {
		return false, err
	}
	if status != "isolated" {
		return false, nil
	}
	if err := mikrotik.WithRetry(ctx, func() error { return net.EnablePPPoE(ctx, pppoe) }); err != nil {
		// Pelanggan sudah membayar tapi router tak bisa dihubungi → wajib diantrikan
		// agar layanan tetap dibuka begitu router pulih (PRD §10).
		if qErr := EnqueueJob(ctx, pool, customerID, "reactivate", err.Error()); qErr != nil {
			log.Printf("[reaktivasi] gagal enqueue job customer %d: %v", customerID, qErr)
		}
		return false, err
	}
	if _, err := pool.Exec(ctx,
		`UPDATE customers SET status = 'active', updated_at = NOW() WHERE id = $1`, customerID); err != nil {
		return false, err
	}
	_ = audit.Write(ctx, pool, adminID, "reactivate_customer", "customer", &customerID,
		map[string]any{"pppoe": pppoe, "trigger": trigger})
	return true, nil
}
