package notify

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Wablas mengirim pesan WhatsApp lewat gateway Wablas (kanal utama PRD v3.0).
//
// Kontrak API (terverifikasi terhadap smg.wablas.com):
//
//	POST {base}/api/send-message
//	Header  : Authorization: {token}.{secret}
//	Body    : application/x-www-form-urlencoded — phone, message
//
// CATATAN: Wablas adalah gateway tidak resmi. Struktur ini sengaja dipisah di
// balik interface Notifier agar perpindahan ke WhatsApp Business API resmi
// tidak mengubah logika bisnis (US-12 AC4).
type Wablas struct {
	baseURL string
	token   string
	secret  string
	client  *http.Client
}

func NewWablas(baseURL, token, secret string) *Wablas {
	return &Wablas{
		baseURL: strings.TrimRight(baseURL, "/"),
		token:   token,
		secret:  secret,
		client:  &http.Client{Timeout: 20 * time.Second},
	}
}

func (w *Wablas) Notify(to Recipient, _ string, body string) {
	if to.Phone == "" {
		return
	}
	form := url.Values{}
	form.Set("phone", to.Phone)
	// WhatsApp tidak mengenal "subject" — judul digabung ke isi pesan oleh pemanggil.
	form.Set("message", body)

	req, err := http.NewRequest(http.MethodPost,
		w.baseURL+"/api/send-message", strings.NewReader(form.Encode()))
	if err != nil {
		log.Printf("[wablas] gagal menyusun request untuk %s: %v", to.Phone, err)
		return
	}
	req.Header.Set("Authorization", w.token+"."+w.secret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := w.client.Do(req)
	if err != nil {
		log.Printf("[wablas] gagal kirim ke %s: %v", to.Phone, err)
		return
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))

	// Wablas selalu membalas HTTP 200; diterima/ditolak ditentukan field "status".
	//
	// PENTING: status=true hanya berarti pesan MASUK ANTRIAN gateway, bukan sudah
	// sampai ke penerima. Wablas memproses antrian dengan jeda (lihat setelan
	// delay_message pada perangkat), jadi pengiriman nyata tertunda beberapa
	// detik. Jangan perlakukan log ini sebagai bukti pesan diterima pelanggan.
	var out struct {
		Status  bool   `json:"status"`
		Message string `json:"message"`
		Data    struct {
			Messages []struct {
				ID     string `json:"id"`
				Status string `json:"status"`
			} `json:"messages"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		log.Printf("[wablas] respons tak terbaca untuk %s: %s", to.Phone, strings.TrimSpace(string(raw)))
		return
	}
	if !out.Status {
		log.Printf("[wablas] DITOLAK untuk %s: %s", to.Phone, out.Message)
		return
	}

	// id pesan berguna untuk menelusuri status pengiriman di dashboard Wablas.
	id, state := "-", "-"
	if len(out.Data.Messages) > 0 {
		id, state = out.Data.Messages[0].ID, out.Data.Messages[0].Status
	}
	log.Printf("[wablas] diterima antrian gateway untuk %s (id=%s status=%s)", to.Phone, id, state)
}
