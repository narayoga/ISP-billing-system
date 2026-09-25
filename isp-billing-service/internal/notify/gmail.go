package notify

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"sync"
	"time"
)

const (
	gmailTokenURL = "https://oauth2.googleapis.com/token"
	gmailSendURL  = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
)

// GmailNotifier mengirim email lewat Gmail API (HTTPS 443) dengan OAuth2
// refresh token. Dipakai karena VPS memblokir port SMTP keluar (25/465/587).
type GmailNotifier struct {
	clientID, clientSecret, refreshToken string
	from                                 string
	client                               *http.Client

	mu        sync.Mutex
	token     string
	expiresAt time.Time
}

// NewGmail — sender adalah alamat akun Gmail pemilik token; nama tampilan
// diambil dari emailFrom ("Nama <alamat>").
func NewGmail(clientID, clientSecret, refreshToken, sender, emailFrom string) *GmailNotifier {
	name, addr := "", sender
	if a, err := mail.ParseAddress(emailFrom); err == nil {
		name = a.Name
		if addr == "" {
			addr = a.Address
		}
	}
	return &GmailNotifier{
		clientID:     clientID,
		clientSecret: clientSecret,
		refreshToken: refreshToken,
		from:         (&mail.Address{Name: name, Address: addr}).String(),
		client:       &http.Client{Timeout: 15 * time.Second},
	}
}

func (g *GmailNotifier) Notify(to Recipient, subject, body string) {
	if to.Email == "" {
		return
	}
	if err := g.send(to.Email, subject, body); err != nil {
		log.Printf("[gmail] gagal kirim ke %s: %v", to.Email, err)
		return
	}
	log.Printf("[gmail] email terkirim ke %s (%q)", to.Email, subject)
}

func (g *GmailNotifier) send(to, subject, body string) error {
	token, err := g.accessToken()
	if err != nil {
		return err
	}
	raw := base64.URLEncoding.EncodeToString(buildMessage(g.from, to, subject, body))
	payload, _ := json.Marshal(map[string]string{"raw": raw})

	req, err := http.NewRequest(http.MethodPost, gmailSendURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		// Token ditolak: buang cache agar kiriman berikutnya minta token baru.
		if resp.StatusCode == http.StatusUnauthorized {
			g.mu.Lock()
			g.token = ""
			g.mu.Unlock()
		}
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 300))
		return fmt.Errorf("Gmail API HTTP %d: %s", resp.StatusCode, bytes.TrimSpace(b))
	}
	return nil
}

// accessToken menukar refresh token dengan access token (~1 jam) dan
// menyimpannya sampai hampir kedaluwarsa.
func (g *GmailNotifier) accessToken() (string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	// Sisakan 1 menit agar token tidak kedaluwarsa di tengah request.
	if g.token != "" && time.Now().Before(g.expiresAt.Add(-time.Minute)) {
		return g.token, nil
	}

	resp, err := g.client.PostForm(gmailTokenURL, url.Values{
		"client_id":     {g.clientID},
		"client_secret": {g.clientSecret},
		"refresh_token": {g.refreshToken},
		"grant_type":    {"refresh_token"},
	})
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out struct {
		AccessToken      string `json:"access_token"`
		ExpiresIn        int    `json:"expires_in"`
		Error            string `json:"error"`
		ErrorDescription string `json:"error_description"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("refresh token Gmail: respons tak terbaca (HTTP %d): %w", resp.StatusCode, err)
	}
	if resp.StatusCode != http.StatusOK || out.AccessToken == "" {
		// OAuth app masih mode Testing: refresh token mati tiap 7 hari.
		if out.Error == "invalid_grant" {
			return "", errors.New("GMAIL_REFRESH_TOKEN kedaluwarsa/dicabut (invalid_grant) — ambil token baru di OAuth Playground, perbarui .env.prod, lalu restart api & billing")
		}
		return "", fmt.Errorf("refresh token Gmail gagal: HTTP %d %s %s", resp.StatusCode, out.Error, out.ErrorDescription)
	}

	g.token = out.AccessToken
	g.expiresAt = time.Now().Add(time.Duration(out.ExpiresIn) * time.Second)
	return g.token, nil
}
