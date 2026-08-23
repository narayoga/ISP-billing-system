package audit

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Write mencatat satu entri audit_log. payload bebas (di-marshal ke jsonb oleh
// pgx); kirim nil untuk NULL. entityType "" dan entityID nil → NULL.
func Write(
	ctx context.Context,
	pool *pgxpool.Pool,
	adminID *int64,
	action, entityType string,
	entityID *int64,
	payload any,
) error {
	var et any
	if entityType != "" {
		et = entityType
	}
	_, err := pool.Exec(ctx,
		`INSERT INTO audit_log (admin_id, action, entity_type, entity_id, payload)
		 VALUES ($1, $2, $3, $4, $5)`,
		adminID, action, et, entityID, payload,
	)
	return err
}
