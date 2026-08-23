package notify

import (
	"log"

	"github.com/all-over/isp-billing-service/internal/config"
)

// Notifier abstraksi pengirim notifikasi. SMTPNotifier bila SMTP dikonfigurasi,
// selain itu LogNotifier (cetak ke console).
type Notifier interface {
	Email(to, subject, body string)
}

// New memilih notifier berdasarkan config.
func New(cfg config.Config) Notifier {
	if cfg.SMTPHost != "" {
		log.Printf("[notify] SMTP aktif (%s)", cfg.SMTPHost)
		return NewSMTP(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.EmailFrom)
	}
	log.Printf("[notify] SMTP tidak dikonfigurasi — log ke console")
	return LogNotifier{}
}

type LogNotifier struct{}

func (LogNotifier) Email(to, subject, body string) {
	log.Printf("[DEV-MAIL] to=%s subject=%q | %s", to, subject, body)
}
