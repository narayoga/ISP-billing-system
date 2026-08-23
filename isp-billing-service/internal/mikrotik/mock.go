package mikrotik

import (
	"context"
	"log"
)

// Mock provider untuk dev/demo: tidak menyentuh perangkat, hanya mencatat aksi.
type Mock struct{}

func (Mock) Name() string { return "mock" }

func (Mock) DisablePPPoE(_ context.Context, username string) error {
	log.Printf("[mikrotik-mock] DISABLE pppoe secret %q", username)
	return nil
}

func (Mock) EnablePPPoE(_ context.Context, username string) error {
	log.Printf("[mikrotik-mock] ENABLE pppoe secret %q", username)
	return nil
}
