package network

import (
	"context"
	"errors"

	"github.com/all-over/isp-billing-service/internal/netstatus"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrCustomerNotFound = errors.New("customer not found")

// Resolve mencari customer_id dari identifier (cocokkan pppoe_username / ip / mac).
func Resolve(ctx context.Context, pool *pgxpool.Pool, identifier string) (int64, error) {
	var id int64
	err := pool.QueryRow(ctx,
		`SELECT id FROM customers
		 WHERE pppoe_username = $1 OR ip_address = $1 OR mac_address = $1
		 LIMIT 1`, identifier).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrCustomerNotFound
	}
	return id, err
}

// MapState memetakan status webhook → state internal: alive→online, rto→offline.
func MapState(status string) (string, bool) {
	switch status {
	case "alive":
		return "online", true
	case "rto":
		return "offline", true
	default:
		return "", false
	}
}

// Record menulis status ke cache (TTL) lalu mirror ke tabel network_status (historis).
func Record(
	ctx context.Context,
	pool *pgxpool.Pool,
	store netstatus.Store,
	customerID int64,
	state string,
) error {
	if err := store.Set(ctx, customerID, state); err != nil {
		return err
	}
	if _, err := pool.Exec(ctx,
		`INSERT INTO network_status (customer_id, state, observed_at)
		 VALUES ($1, $2, NOW())
		 ON CONFLICT (customer_id) DO UPDATE SET state = EXCLUDED.state, observed_at = NOW()`,
		customerID, state); err != nil {
		return err
	}
	// Webhook pertama (online) memprovisioning pelanggan: pending_provisioning → active
	// (PRD US-08 AC3).
	if state == "online" {
		_, err := pool.Exec(ctx,
			`UPDATE customers SET status = 'active', updated_at = NOW()
			 WHERE id = $1 AND status = 'pending_provisioning'`, customerID)
		return err
	}
	return nil
}
