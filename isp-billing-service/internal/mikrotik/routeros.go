package mikrotik

import (
	"context"
	"fmt"
	"time"

	"github.com/go-routeros/routeros/v3"
)

// RouterOS provider nyata via RouterOS API (port 8728 default).
//
// CATATAN: jalur ini hanya terverifikasi sampai kompilasi (tidak ada router di
// environment build). Uji terhadap perangkat sungguhan sebelum produksi.
type RouterOS struct {
	address  string // host:port
	username string
	password string
	timeout  time.Duration
}

func NewRouterOS(host, port, username, password string) *RouterOS {
	return &RouterOS{
		address:  host + ":" + port,
		username: username,
		password: password,
		timeout:  10 * time.Second,
	}
}

func (r *RouterOS) Name() string { return "routeros" }

func (r *RouterOS) DisablePPPoE(ctx context.Context, username string) error {
	return r.setDisabled(ctx, username, true)
}

func (r *RouterOS) EnablePPPoE(ctx context.Context, username string) error {
	return r.setDisabled(ctx, username, false)
}

func (r *RouterOS) setDisabled(ctx context.Context, username string, disabled bool) error {
	dctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	client, err := routeros.DialContext(dctx, r.address, r.username, r.password)
	if err != nil {
		return fmt.Errorf("dial routeros: %w", err)
	}
	defer client.Close()

	id, err := secretID(client, username)
	if err != nil {
		return err
	}
	val := "no"
	if disabled {
		val = "yes"
	}
	if _, err := client.RunArgs([]string{"/ppp/secret/set", "=.id=" + id, "=disabled=" + val}); err != nil {
		return fmt.Errorf("set disabled=%s: %w", val, err)
	}
	// Saat isolir, putus sesi aktif agar efeknya langsung (best-effort).
	if disabled {
		removeActive(client, username)
	}
	return nil
}

func secretID(client *routeros.Client, username string) (string, error) {
	reply, err := client.RunArgs([]string{"/ppp/secret/print", "?name=" + username})
	if err != nil {
		return "", fmt.Errorf("print secret: %w", err)
	}
	if len(reply.Re) == 0 {
		return "", fmt.Errorf("pppoe secret %q tidak ditemukan", username)
	}
	id := reply.Re[0].Map[".id"]
	if id == "" {
		return "", fmt.Errorf("id kosong untuk secret %q", username)
	}
	return id, nil
}

func removeActive(client *routeros.Client, username string) {
	reply, err := client.RunArgs([]string{"/ppp/active/print", "?name=" + username})
	if err != nil {
		return
	}
	for _, re := range reply.Re {
		if id := re.Map[".id"]; id != "" {
			_, _ = client.RunArgs([]string{"/ppp/active/remove", "=.id=" + id})
		}
	}
}
