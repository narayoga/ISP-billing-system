package netstatus

import (
	"context"
	"log"

	"github.com/all-over/isp-billing-service/internal/config"
)

// TTLSeconds — masa berlaku status koneksi (PRD: Redis TTL 60s).
const TTLSeconds = 60

// Store menyimpan status koneksi terakhir per customer dengan TTL.
type Store interface {
	Set(ctx context.Context, customerID int64, state string) error
	GetAll(ctx context.Context) (map[int64]string, error)
}

// New memilih store: Redis bila REDIS_URL terisi & terjangkau, selain itu in-memory.
func New(cfg config.Config) Store {
	if cfg.RedisURL == "" {
		log.Printf("[netstatus] store = in-memory (TTL %ds)", TTLSeconds)
		return NewMemory()
	}
	s, err := NewRedis(cfg.RedisURL)
	if err != nil {
		log.Printf("[netstatus] redis gagal (%v) — fallback in-memory", err)
		return NewMemory()
	}
	log.Printf("[netstatus] store = redis")
	return s
}
