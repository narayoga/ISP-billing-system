package billing

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/all-over/isp-billing-service/internal/audit"
	"github.com/all-over/isp-billing-service/internal/mikrotik"
	"github.com/all-over/isp-billing-service/internal/notify"
	"github.com/jackc/pgx/v5/pgxpool"
)

// MaxJobAttempts — setelah sekian kali gagal, job ditandai 'failed' dan admin di-alert.
const MaxJobAttempts = 8

// EnqueueJob mengantrikan operasi jaringan yang gagal agar dicoba ulang nanti
// (PRD §10: "queue tertunda untuk dieksekusi ulang"). Idempoten: bila sudah ada
// job pending untuk (customer, action) yang sama, hanya pesan errornya diperbarui.
func EnqueueJob(ctx context.Context, pool *pgxpool.Pool, customerID int64, action, lastErr string) error {
	_, err := pool.Exec(ctx, `
		INSERT INTO network_jobs (customer_id, action, last_error, next_retry_at)
		VALUES ($1, $2, $3, NOW() + INTERVAL '1 minute')
		ON CONFLICT (customer_id, action) WHERE status = 'pending'
		DO UPDATE SET last_error = EXCLUDED.last_error, updated_at = NOW()`,
		customerID, action, lastErr)
	return err
}

type pendingJob struct {
	id         int64
	customerID int64
	action     string
	attempts   int
	pppoe      string
	email      string
	name       string
}

// ProcessJobs menjalankan job yang sudah jatuh tempo. Dipanggil berkala oleh
// scheduler. Backoff eksponensial: 2^attempts menit (dibatasi 60 menit).
func ProcessJobs(
	ctx context.Context,
	pool *pgxpool.Pool,
	net mikrotik.Provider,
	n notify.Notifier,
	adminEmail string,
) (done int, failed int, err error) {
	rows, qErr := pool.Query(ctx, `
		SELECT j.id, j.customer_id, j.action, j.attempts,
		       c.pppoe_username, c.email, c.name
		FROM network_jobs j
		JOIN customers c ON c.id = j.customer_id
		WHERE j.status = 'pending' AND j.next_retry_at <= NOW()
		ORDER BY j.next_retry_at
		LIMIT 50`)
	if qErr != nil {
		return 0, 0, qErr
	}
	var jobs []pendingJob
	for rows.Next() {
		var j pendingJob
		if scanErr := rows.Scan(&j.id, &j.customerID, &j.action, &j.attempts,
			&j.pppoe, &j.email, &j.name); scanErr != nil {
			rows.Close()
			return 0, 0, scanErr
		}
		jobs = append(jobs, j)
	}
	rows.Close()
	if rErr := rows.Err(); rErr != nil {
		return 0, 0, rErr
	}

	for _, j := range jobs {
		opErr := runJob(ctx, net, j)
		if opErr == nil {
			if applyErr := applyJobSuccess(ctx, pool, j); applyErr != nil {
				log.Printf("[jobs] job %d sukses di router tapi gagal update DB: %v", j.id, applyErr)
				continue
			}
			done++
			log.Printf("[jobs] job %d (%s customer %d) berhasil setelah %d percobaan",
				j.id, j.action, j.customerID, j.attempts+1)
			continue
		}

		attempts := j.attempts + 1
		if attempts >= MaxJobAttempts {
			_, _ = pool.Exec(ctx, `
				UPDATE network_jobs SET status = 'failed', attempts = $2,
				       last_error = $3, updated_at = NOW()
				WHERE id = $1`, j.id, attempts, opErr.Error())
			failed++
			alertAdmin(ctx, pool, n, adminEmail, j, attempts, opErr)
			continue
		}
		backoff := time.Duration(1<<uint(attempts)) * time.Minute
		if backoff > time.Hour {
			backoff = time.Hour
		}
		_, _ = pool.Exec(ctx, `
			UPDATE network_jobs
			SET attempts = $2, last_error = $3, next_retry_at = NOW() + $4::interval,
			    updated_at = NOW()
			WHERE id = $1`,
			j.id, attempts, opErr.Error(), fmt.Sprintf("%d seconds", int(backoff.Seconds())))
	}
	return done, failed, nil
}

func runJob(ctx context.Context, net mikrotik.Provider, j pendingJob) error {
	if j.action == "isolate" {
		return net.DisablePPPoE(ctx, j.pppoe)
	}
	return net.EnablePPPoE(ctx, j.pppoe)
}

// applyJobSuccess menandai job selesai dan menyelaraskan status pelanggan.
func applyJobSuccess(ctx context.Context, pool *pgxpool.Pool, j pendingJob) error {
	newStatus := "isolated"
	if j.action == "reactivate" {
		newStatus = "active"
	}
	if _, err := pool.Exec(ctx,
		`UPDATE customers SET status = $2, updated_at = NOW() WHERE id = $1`,
		j.customerID, newStatus); err != nil {
		return err
	}
	if _, err := pool.Exec(ctx,
		`UPDATE network_jobs SET status = 'done', attempts = attempts + 1, updated_at = NOW()
		 WHERE id = $1`, j.id); err != nil {
		return err
	}
	action := "isolate_customer"
	if j.action == "reactivate" {
		action = "reactivate_customer"
	}
	_ = audit.Write(ctx, pool, nil, action, "customer", &j.customerID,
		map[string]any{"pppoe": j.pppoe, "trigger": "retry_queue"})
	return nil
}

// alertAdmin mengirim peringatan ke admin saat job menyerah (PRD §10 "alert ke admin").
func alertAdmin(
	ctx context.Context,
	pool *pgxpool.Pool,
	n notify.Notifier,
	adminEmail string,
	j pendingJob,
	attempts int,
	opErr error,
) {
	msg := fmt.Sprintf(
		"Operasi '%s' untuk pelanggan %s (id=%d, pppoe=%s) GAGAL setelah %d percobaan. "+
			"Error terakhir: %v. Mohon periksa koneksi ke Mikrotik lalu jalankan aksi manual dari dashboard.",
		j.action, j.name, j.customerID, j.pppoe, attempts, opErr)

	log.Printf("[ALERT] %s", msg)
	_ = audit.Write(ctx, pool, nil, "network_job_failed", "customer", &j.customerID,
		map[string]any{"action": j.action, "attempts": attempts, "error": opErr.Error()})
	if n != nil && adminEmail != "" {
		n.Email(adminEmail, "[ALERT] Operasi jaringan gagal — perlu tindakan manual", msg)
	}
}
