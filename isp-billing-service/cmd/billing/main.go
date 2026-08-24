package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/all-over/isp-billing-service/internal/audit"
	"github.com/all-over/isp-billing-service/internal/auth"
	"github.com/all-over/isp-billing-service/internal/billing"
	"github.com/all-over/isp-billing-service/internal/config"
	"github.com/all-over/isp-billing-service/internal/db"
	"github.com/all-over/isp-billing-service/internal/httpx"
	"github.com/all-over/isp-billing-service/internal/mikrotik"
	"github.com/all-over/isp-billing-service/internal/netstatus"
	"github.com/all-over/isp-billing-service/internal/network"
	"github.com/all-over/isp-billing-service/internal/notify"
	"github.com/all-over/isp-billing-service/internal/scheduler"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL belum di-set")
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	notifier := notify.New(cfg)
	net := mikrotik.New(cfg)
	statusStore := netstatus.New(cfg)
	loc := time.Local

	// --- Scheduler: generate (tgl 1), overdue (harian), isolir (tgl 24) ---
	sched := scheduler.New(loc,
		scheduler.Job{Name: "generate-monthly", DayOfMonth: 1, Hour: 0, Minute: 0, Run: func() {
			period := billing.CurrentPeriod(time.Now().In(loc))
			res, err := billing.GenerateMonthly(context.Background(), pool, period, notifier, cfg.PublicBaseURL)
			if err != nil {
				log.Printf("[cron] generate %s: %v", period, err)
				return
			}
			_ = audit.Write(context.Background(), pool, nil, "generate_invoices", "invoice", nil,
				map[string]any{"period": res.Period, "created": res.Created, "trigger": "cron"})
			log.Printf("[cron] generate %s: created=%d skipped=%d", res.Period, res.Created, res.Skipped)
		}},
		scheduler.Job{Name: "mark-overdue", DayOfMonth: 0, Hour: 0, Minute: 5, Run: func() {
			n, err := billing.MarkOverdue(context.Background(), pool, time.Now().In(loc))
			if err != nil {
				log.Printf("[cron] mark-overdue: %v", err)
				return
			}
			if n > 0 {
				log.Printf("[cron] mark-overdue: %d invoice → overdue", n)
			}
		}},
		scheduler.Job{Name: "isolate-overdue", DayOfMonth: 24, Hour: 0, Minute: 1, Run: func() {
			n, err := billing.IsolateOverdue(context.Background(), pool, net, notifier, cfg.PublicBaseURL)
			if err != nil {
				log.Printf("[cron] isolir: %v", err)
				return
			}
			log.Printf("[cron] isolir: %d pelanggan terisolir", n)
		}},
		scheduler.Job{Name: "reminder-h3", DayOfMonth: 17, Hour: 8, Minute: 0, Run: func() {
			period := billing.CurrentPeriod(time.Now().In(loc))
			n, err := billing.RemindDue(context.Background(), pool, notifier, period,
				"Tagihan jatuh tempo dalam 3 hari", "Pengingat:", cfg.PublicBaseURL)
			if err != nil {
				log.Printf("[cron] reminder-h3: %v", err)
				return
			}
			log.Printf("[cron] reminder-h3: %d email", n)
		}},
		scheduler.Job{Name: "reminder-due", DayOfMonth: 20, Hour: 8, Minute: 0, Run: func() {
			period := billing.CurrentPeriod(time.Now().In(loc))
			n, err := billing.RemindDue(context.Background(), pool, notifier, period,
				"Tagihan jatuh tempo hari ini", "Pengingat final:", cfg.PublicBaseURL)
			if err != nil {
				log.Printf("[cron] reminder-due: %v", err)
				return
			}
			log.Printf("[cron] reminder-due: %d email", n)
		}},
	)
	sched.Start()

	// --- Worker antrian operasi jaringan yang tertunda (PRD §10) ---
	// Berjalan tiap menit; masing-masing job punya backoff sendiri di DB.
	go func() {
		t := time.NewTicker(time.Minute)
		defer t.Stop()
		for range t.C {
			done, failed, err := billing.ProcessJobs(
				context.Background(), pool, net, notifier, cfg.AlertEmail)
			if err != nil {
				log.Printf("[jobs] worker: %v", err)
				continue
			}
			if done > 0 || failed > 0 {
				log.Printf("[jobs] worker: %d selesai, %d menyerah", done, failed)
			}
		}
	}()

	// --- Routes ---
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		if err := pool.Ping(r.Context()); err != nil {
			httpx.JSON(w, http.StatusServiceUnavailable,
				map[string]any{"status": "degraded", "service": "isp-billing-service", "db": "down"})
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]any{"status": "ok", "service": "isp-billing-service"})
	})

	// POST /billing/generate — trigger manual (superadmin). Body opsional { "period": "YYYY-MM" }.
	mux.HandleFunc("POST /billing/generate", auth.RequireSuperadmin(cfg.JWTSecret,
		func(w http.ResponseWriter, r *http.Request) {
			var body struct {
				Period string `json:"period"`
			}
			_ = json.NewDecoder(r.Body).Decode(&body)
			period := strings.TrimSpace(body.Period)
			if period == "" {
				period = billing.CurrentPeriod(time.Now().In(loc))
			}
			res, err := billing.GenerateMonthly(r.Context(), pool, period, notifier, cfg.PublicBaseURL)
			if err != nil {
				httpx.Error(w, http.StatusBadRequest, err.Error())
				return
			}
			claims := auth.FromContext(r.Context())
			adminID := claims.Sub
			_ = audit.Write(r.Context(), pool, &adminID, "generate_invoices", "invoice", nil,
				map[string]any{"period": res.Period, "created": res.Created, "trigger": "manual"})
			httpx.JSON(w, http.StatusOK, res)
		}))

	// POST /internal/customers/{id}/reactivate — dipanggil isp-api-service saat approve (shared secret).
	mux.HandleFunc("POST /internal/customers/{id}/reactivate", func(w http.ResponseWriter, r *http.Request) {
		if cfg.InternalSecret == "" || r.Header.Get("X-Internal-Secret") != cfg.InternalSecret {
			httpx.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
		if err != nil || id <= 0 {
			httpx.Error(w, http.StatusBadRequest, "invalid_id")
			return
		}
		changed, err := billing.Reactivate(r.Context(), pool, net, id, nil, "auto_payment")
		if err != nil {
			log.Printf("[reactivate] customer %d: %v", id, err)
			httpx.Error(w, http.StatusInternalServerError, "reactivate_failed")
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]any{"ok": true, "reactivated": changed})
	})

	// Isolir / buka isolir manual oleh superadmin.
	mux.HandleFunc("POST /billing/customers/{id}/isolate", auth.RequireSuperadmin(cfg.JWTSecret,
		func(w http.ResponseWriter, r *http.Request) {
			id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
			if err != nil || id <= 0 {
				httpx.Error(w, http.StatusBadRequest, "invalid_id")
				return
			}
			changed, err := billing.IsolateOne(r.Context(), pool, net, notifier, id,
				auth.FromContext(r.Context()).Sub, cfg.PublicBaseURL)
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "isolate_failed")
				return
			}
			httpx.JSON(w, http.StatusOK, map[string]any{"ok": true, "isolated": changed})
		}))

	mux.HandleFunc("POST /billing/customers/{id}/reactivate", auth.RequireSuperadmin(cfg.JWTSecret,
		func(w http.ResponseWriter, r *http.Request) {
			id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
			if err != nil || id <= 0 {
				httpx.Error(w, http.StatusBadRequest, "invalid_id")
				return
			}
			adminID := auth.FromContext(r.Context()).Sub
			changed, err := billing.Reactivate(r.Context(), pool, net, id, &adminID, "manual")
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "reactivate_failed")
				return
			}
			httpx.JSON(w, http.StatusOK, map[string]any{"ok": true, "reactivated": changed})
		}))

	// POST /webhook/network-status — diterima dari Mikrotik (X-Webhook-Secret).
	mux.HandleFunc("POST /webhook/network-status", func(w http.ResponseWriter, r *http.Request) {
		if cfg.WebhookSecret == "" || r.Header.Get("X-Webhook-Secret") != cfg.WebhookSecret {
			httpx.Error(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		var body struct {
			Identifier string `json:"identifier"`
			IP         string `json:"ip"`
			MAC        string `json:"mac"`
			PPPoE      string `json:"pppoe_username"`
			Status     string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			httpx.Error(w, http.StatusBadRequest, "invalid_body")
			return
		}
		identifier := firstNonEmpty(body.Identifier, body.PPPoE, body.IP, body.MAC)
		if identifier == "" {
			httpx.Error(w, http.StatusBadRequest, "missing_identifier")
			return
		}
		state, ok := network.MapState(body.Status)
		if !ok {
			httpx.Error(w, http.StatusBadRequest, "invalid_status")
			return
		}
		id, err := network.Resolve(r.Context(), pool, identifier)
		if err != nil {
			if errors.Is(err, network.ErrCustomerNotFound) {
				httpx.Error(w, http.StatusNotFound, "customer_not_found")
				return
			}
			httpx.Error(w, http.StatusInternalServerError, "resolve_failed")
			return
		}
		if err := network.Record(r.Context(), pool, statusStore, id, state); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "record_failed")
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]any{"ok": true, "customer_id": id, "state": state})
	})

	// GET /customers/status — snapshot status koneksi (admin polling 5s).
	mux.HandleFunc("GET /customers/status", auth.RequireAdmin(cfg.JWTSecret,
		func(w http.ResponseWriter, r *http.Request) {
			m, err := statusStore.GetAll(r.Context())
			if err != nil {
				httpx.Error(w, http.StatusInternalServerError, "status_failed")
				return
			}
			out := make(map[string]string, len(m))
			for id, st := range m {
				out[strconv.FormatInt(id, 10)] = st
			}
			httpx.JSON(w, http.StatusOK, out)
		}))

	addr := ":" + cfg.Port
	log.Printf("isp-billing-service listening on %s", addr)
	if err := http.ListenAndServe(addr, withCORS(cfg.CORSOrigins, mux)); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

// withCORS membungkus handler dengan header CORS sederhana (dev: FE di :5173).
func withCORS(origins string, h http.Handler) http.Handler {
	allowed := strings.Split(origins, ",")
	for i := range allowed {
		allowed[i] = strings.TrimSpace(allowed[i])
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && originAllowed(allowed, origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Webhook-Secret")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func originAllowed(allowed []string, origin string) bool {
	for _, a := range allowed {
		if a == "*" || a == origin {
			return true
		}
	}
	return false
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
