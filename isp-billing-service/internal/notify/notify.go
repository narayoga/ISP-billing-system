package notify

import (
	"log"

	"github.com/all-over/isp-billing-service/internal/config"
)

// Recipient — tujuan notifikasi. Kanal yang kosong otomatis dilewati, sehingga
// pelanggan tanpa email (email opsional sejak PRD v3.0) tetap dapat dihubungi
// lewat WhatsApp, dan alert internal ke admin cukup lewat email.
type Recipient struct {
	Email string
	Phone string
}

// Notifier mengirim notifikasi ke seluruh kanal yang tersedia (PRD v3.0 US-12).
type Notifier interface {
	Notify(to Recipient, subject, body string)
}

// New menyusun notifier sesuai konfigurasi:
// WhatsApp (Wablas) sebagai kanal utama, email sebagai pendamping.
// Bila tidak ada yang dikonfigurasi, jatuh ke LogNotifier (dev).
func New(cfg config.Config) Notifier {
	var chans []Notifier

	if cfg.WablasToken != "" {
		log.Printf("[notify] WhatsApp aktif (%s)", cfg.WablasBaseURL)
		chans = append(chans, NewWablas(cfg.WablasBaseURL, cfg.WablasToken, cfg.WablasSecret))
	}
	if cfg.SMTPHost != "" {
		log.Printf("[notify] SMTP aktif (%s)", cfg.SMTPHost)
		chans = append(chans, NewSMTP(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.EmailFrom))
	}
	if len(chans) == 0 {
		log.Printf("[notify] tidak ada kanal dikonfigurasi — log ke console")
		return LogNotifier{}
	}
	return Multi(chans)
}

// Multi menyebar notifikasi ke banyak kanal.
//
// Kegagalan satu kanal TIDAK menghentikan kanal lain maupun proses bisnis yang
// memicunya (US-12 AC2) — tiap implementasi menangani errornya sendiri dan
// hanya mencatat ke log.
type Multi []Notifier

func (m Multi) Notify(to Recipient, subject, body string) {
	for _, n := range m {
		n.Notify(to, subject, body)
	}
}

// LogNotifier mencetak notifikasi ke console (dev, tanpa kredensial apa pun).
type LogNotifier struct{}

func (LogNotifier) Notify(to Recipient, subject, body string) {
	log.Printf("[DEV-NOTIF] email=%q wa=%q subject=%q | %s", to.Email, to.Phone, subject, body)
}
