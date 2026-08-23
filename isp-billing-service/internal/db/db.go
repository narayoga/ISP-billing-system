package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect membuka pool koneksi Postgres (pgx).
func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	return pgxpool.New(ctx, url)
}
