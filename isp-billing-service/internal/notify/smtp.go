package notify

import (
	"log"
	"mime"
	"net/smtp"
	"strings"
)

// SMTPNotifier mengirim email via SMTP relay (mis. Elastic Email). Pakai STARTTLS
// (port 2525/587); net/smtp otomatis STARTTLS bila server mengiklankannya.
type SMTPNotifier struct {
	host, port, username, password, from string
}

func NewSMTP(host, port, username, password, from string) SMTPNotifier {
	return SMTPNotifier{host: host, port: port, username: username, password: password, from: from}
}

func (s SMTPNotifier) Notify(to Recipient, subject, body string) {
	if to.Email == "" {
		return
	}
	addr := s.host + ":" + s.port
	var auth smtp.Auth
	if s.username != "" {
		auth = smtp.PlainAuth("", s.username, s.password, s.host)
	}
	msg := buildMessage(s.from, to.Email, subject, body)
	if err := smtp.SendMail(addr, auth, extractAddr(s.from), []string{to.Email}, msg); err != nil {
		log.Printf("[smtp] gagal kirim ke %s: %v", to.Email, err)
		return
	}
	log.Printf("[smtp] email terkirim ke %s (%q)", to.Email, subject)
}

// buildMessage dipakai bersama SMTPNotifier dan GmailNotifier. Subject non-ASCII
// di-encode RFC 2047 agar tidak rusak di klien email.
func buildMessage(from, to, subject, body string) []byte {
	var b strings.Builder
	b.WriteString("From: " + from + "\r\n")
	b.WriteString("To: " + to + "\r\n")
	b.WriteString("Subject: " + mime.QEncoding.Encode("utf-8", subject) + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("\r\n")
	b.WriteString(body)
	return []byte(b.String())
}

// extractAddr mengambil alamat email dari "Nama <email>" untuk envelope MAIL FROM.
func extractAddr(from string) string {
	if i := strings.LastIndex(from, "<"); i >= 0 {
		if j := strings.Index(from[i:], ">"); j > 0 {
			return from[i+1 : i+j]
		}
	}
	return from
}
