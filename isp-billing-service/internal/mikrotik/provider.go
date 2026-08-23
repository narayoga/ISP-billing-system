package mikrotik

import (
	"context"
	"log"
	"time"

	"github.com/all-over/isp-billing-service/internal/config"
)

// Provider abstraksi operasi jaringan (enable/disable PPPoE secret).
// Ada dua implementasi: Mock (dev) dan RouterOS (produksi).
type Provider interface {
	DisablePPPoE(ctx context.Context, username string) error
	EnablePPPoE(ctx context.Context, username string) error
	Name() string
}

// New memilih provider berdasarkan config. Mock dipakai bila MIKROTIK_MOCK=true
// atau MIKROTIK_HOST kosong (dev tanpa router).
func New(cfg config.Config) Provider {
	if cfg.MikrotikMock || cfg.MikrotikHost == "" {
		log.Printf("[mikrotik] provider = mock (dev)")
		return Mock{}
	}
	log.Printf("[mikrotik] provider = routeros @ %s:%s", cfg.MikrotikHost, cfg.MikrotikPort)
	return NewRouterOS(cfg.MikrotikHost, cfg.MikrotikPort, cfg.MikrotikUser, cfg.MikrotikPass)
}

// WithRetry menjalankan op dengan retry maksimal 3x + exponential backoff (US-03 AC4).
func WithRetry(ctx context.Context, op func() error) error {
	const maxAttempts = 3
	backoff := 500 * time.Millisecond
	var err error
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		if err = op(); err == nil {
			return nil
		}
		if attempt < maxAttempts {
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
			}
			backoff *= 2
		}
	}
	return err
}
