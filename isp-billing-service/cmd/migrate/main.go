package main

import (
	"errors"
	"flag"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

// Runner sederhana golang-migrate.
//
// Usage:
//   go run ./cmd/migrate up         # apply semua migrasi pending
//   go run ./cmd/migrate down       # rollback semua migrasi
//   go run ./cmd/migrate -n=-1 steps  # rollback 1 step (flag WAJIB sebelum perintah)
//   go run ./cmd/migrate version    # tampilkan versi saat ini
func main() {
	dir := flag.String("dir", "migrations", "folder migrasi")
	n := flag.Int("n", 0, "jumlah step (untuk perintah steps)")
	flag.Usage = func() {
		log.Println("usage: migrate [-dir=...] [-n=...] <up|down|steps|version|force>  (flag harus mendahului perintah)")
		flag.PrintDefaults()
	}
	flag.Parse()
	_ = godotenv.Load()

	args := flag.Args()
	if len(args) < 1 {
		flag.Usage()
		os.Exit(2)
	}
	cmd := args[0]

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL belum di-set")
	}

	m, err := migrate.New("file://"+*dir, dbURL)
	if err != nil {
		log.Fatalf("init migrate: %v", err)
	}
	defer func() { _, _ = m.Close() }()

	switch cmd {
	case "up":
		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("up: %v", err)
		}
		log.Println("migrate: up complete")
	case "down":
		if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("down: %v", err)
		}
		log.Println("migrate: down complete")
	case "steps":
		if *n == 0 {
			log.Fatal("steps butuh -n=<jumlah> (positif = up, negatif = down)")
		}
		if err := m.Steps(*n); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("steps: %v", err)
		}
		log.Printf("migrate: steps %d complete", *n)
	case "version":
		v, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("version: %v", err)
		}
		log.Printf("migrate: version=%d dirty=%v", v, dirty)
	case "force":
		if *n == 0 {
			log.Fatal("force butuh -n=<versi>")
		}
		if err := m.Force(*n); err != nil {
			log.Fatalf("force: %v", err)
		}
		log.Printf("migrate: forced to version %d", *n)
	default:
		flag.Usage()
		os.Exit(2)
	}
}
