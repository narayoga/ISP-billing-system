package config

import "os"

// Config menampung seluruh env var yang dipakai service.
type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string // dibagi dengan isp-api-service untuk verifikasi JWT admin
	CORSOrigins string
	RedisURL    string

	SMTPHost   string
	SMTPPort   string
	SMTPUser   string
	SMTPPass   string
	EmailFrom  string
	AlertEmail string // tujuan alert operasional (mis. Mikrotik unreachable)

	WebhookSecret  string // untuk endpoint /webhook/network-status (Fase 7)
	InternalSecret string // untuk endpoint internal dipanggil isp-api-service (Fase 6)

	MikrotikHost string
	MikrotikPort string
	MikrotikUser string
	MikrotikPass string
	MikrotikMock bool // paksa pakai provider mock walau host terisi
}

func Load() Config {
	return Config{
		Port:        env("PORT", "8081"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		CORSOrigins: env("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"),
		RedisURL:    os.Getenv("REDIS_URL"),

		SMTPHost:  os.Getenv("SMTP_HOST"),
		SMTPPort:  env("SMTP_PORT", "2525"),
		SMTPUser:  os.Getenv("SMTP_USER"),
		SMTPPass:  os.Getenv("SMTP_PASS"),
		EmailFrom:  env("EMAIL_FROM", "ISP <no-reply@isp.local>"),
		AlertEmail: os.Getenv("ALERT_EMAIL"),

		WebhookSecret:  os.Getenv("WEBHOOK_SECRET"),
		InternalSecret: os.Getenv("INTERNAL_SECRET"),

		MikrotikHost: os.Getenv("MIKROTIK_HOST"),
		MikrotikPort: env("MIKROTIK_PORT", "8728"),
		MikrotikUser: os.Getenv("MIKROTIK_USER"),
		MikrotikPass: os.Getenv("MIKROTIK_PASSWORD"),
		MikrotikMock: os.Getenv("MIKROTIK_MOCK") == "true",
	}
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
