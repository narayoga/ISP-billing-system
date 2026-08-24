package billing

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TokenTTLDays — masa berlaku tautan tagihan (PRD v3.0 US-09 AC3).
const TokenTTLDays = 90

// IssueToken menerbitkan — atau memperpanjang — token akses untuk sebuah invoice.
//
// Keputusan desain: satu invoice = satu token seumur hidupnya. Bila token sudah
// ada, masa berlakunya diperpanjang dan status cabut dibatalkan, sehingga tautan
// yang sudah terkirim di pesan WhatsApp/email lama TETAP berfungsi.
//
// Idempoten: aman dipanggil berulang (saat generate, tiap reminder, isolir,
// maupun kirim ulang manual oleh admin).
func IssueToken(ctx context.Context, pool *pgxpool.Pool, invoiceID int64) (string, error) {
	var token string
	err := pool.QueryRow(ctx, `
		INSERT INTO invoice_access_tokens (token, invoice_id, expires_at)
		VALUES (gen_random_uuid(), $1, NOW() + ($2 * INTERVAL '1 day'))
		ON CONFLICT (invoice_id) DO UPDATE
		SET expires_at = EXCLUDED.expires_at,
		    revoked_at = NULL,
		    updated_at = NOW()
		RETURNING token::text`,
		invoiceID, TokenTTLDays).Scan(&token)
	return token, err
}

// InvoiceURL menyusun tautan publik ke halaman tagihan.
func InvoiceURL(baseURL, token string) string {
	return strings.TrimRight(baseURL, "/") + "/tagihan/" + token
}

// invoiceLink menerbitkan token lalu mengembalikan tautan siap kirim.
// Mengembalikan string kosong bila gagal — pemanggil tetap mengirim pesan
// tanpa tautan daripada membatalkan notifikasi sepenuhnya.
func invoiceLink(ctx context.Context, pool *pgxpool.Pool, baseURL string, invoiceID int64) string {
	token, err := IssueToken(ctx, pool, invoiceID)
	if err != nil {
		return ""
	}
	return InvoiceURL(baseURL, token)
}

// latestOutstandingInvoice mencari invoice belum lunas terbaru milik pelanggan.
// Dipakai saat isolir, yang berbasis pelanggan (bukan invoice tertentu).
func latestOutstandingInvoice(ctx context.Context, pool *pgxpool.Pool, customerID int64) (int64, bool) {
	var id int64
	err := pool.QueryRow(ctx, `
		SELECT id FROM invoices
		WHERE customer_id = $1 AND status IN ('unpaid','overdue')
		ORDER BY period DESC, id DESC
		LIMIT 1`, customerID).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) || err != nil {
		return 0, false
	}
	return id, true
}

// ajakanBayar menyusun kalimat penutup pesan: sertakan tautan bila tersedia.
func ajakanBayar(link string) string {
	if link == "" {
		return " Silakan lakukan pembayaran dan unggah bukti transfer melalui tautan yang kami kirimkan sebelumnya."
	}
	return " Lihat tagihan dan unggah bukti transfer di: " + link
}

// formatRupiah memformat nominal menjadi gaya Indonesia: 150000 → "Rp150.000".
func formatRupiah(amount int64) string {
	s := strconv.FormatInt(amount, 10)
	neg := ""
	if strings.HasPrefix(s, "-") {
		neg, s = "-", s[1:]
	}
	var b strings.Builder
	for i, d := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte('.')
		}
		b.WriteRune(d)
	}
	return neg + "Rp" + b.String()
}
