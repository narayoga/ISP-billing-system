package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// Bikin / update superadmin pertama dari env vars:
//   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME (opsional)
//
// Jalankan: go run ./cmd/seed-admin
func main() {
	_ = godotenv.Load()
	email := mustEnv("SEED_ADMIN_EMAIL")
	password := mustEnv("SEED_ADMIN_PASSWORD")
	name := os.Getenv("SEED_ADMIN_NAME")
	if name == "" {
		name = "Super Admin"
	}

	dbURL := mustEnv("DATABASE_URL")
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatalf("hash: %v", err)
	}

	// Upsert berdasar email — kalau sudah ada, update password & nama, set is_active=true.
	const q = `
		INSERT INTO admin_users (email, password_hash, name, role, is_active)
		VALUES ($1, $2, $3, 'superadmin', TRUE)
		ON CONFLICT (email) DO UPDATE
		SET password_hash = EXCLUDED.password_hash,
		    name          = EXCLUDED.name,
		    is_active     = TRUE,
		    updated_at    = NOW()
		RETURNING id
	`
	var id int64
	if err := db.QueryRowContext(ctx, q, email, string(hash), name).Scan(&id); err != nil {
		log.Fatalf("upsert: %v", err)
	}
	log.Printf("seed-admin: superadmin id=%d email=%s OK", id, email)
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatal(errors.New(k + " belum di-set"))
	}
	return v
}
