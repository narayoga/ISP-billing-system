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
) (int, error) {
	rows, err := pool.Query(ctx, `
		SELECT c.email, c.name, i.amount, i.due_date::text
		FROM invoices i
		JOIN customers c ON c.id = i.customer_id
		WHERE i.period = $1 AND i.status IN ('unpaid','overdue')`, period)
	if err != nil {
		return 0, err
	}
	type target struct {
		email, name, due string
		amount           int64
	}
	var targets []target
	for rows.Next() {
		var t target
		if err := rows.Scan(&t.email, &t.name, &t.amount, &t.due); err != nil {
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
		n.Email(t.email, subject,
			fmt.Sprintf("%s Halo %s, tagihan periode %s sebesar Rp%d jatuh tempo %s.",
				prefix, t.name, period, t.amount, t.due))
	}
	return len(targets), nil
}
