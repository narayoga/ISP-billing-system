# Menyiapkan VPS

Panduan memasang ISP Billing System di server. Dikerjakan lewat SSH.

**Target:** Debian 13 (trixie), IP publik `103.134.154.151`.

Jalankan **satu bagian dalam satu waktu**, lalu periksa hasilnya sebelum
melanjutkan. Bila ada langkah yang gagal, berhenti — jangan diteruskan.

---

## Bagian 0 — Periksa kesiapan server

```bash
free -h                 # RAM tersedia
df -h /                 # ruang disk
cat /etc/os-release      # versi OS
curl -s ifconfig.me      # pastikan IP publik = 103.134.154.151
```

Kebutuhan minimum: **RAM 2 GB**, disk kosong **10 GB**.

Bila RAM kurang dari 2 GB, Postgres dan kedua aplikasi masih bisa jalan tetapi
rawan kehabisan memori saat beban naik. Pertimbangkan menambah swap atau
menaikkan paket VPS.

---

## Bagian 1 — Pasang Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git

# Kunci resmi Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Repositori Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verifikasi:
```bash
sudo docker run --rm hello-world
sudo docker compose version
```

Agar tidak perlu `sudo` setiap kali (opsional):
```bash
sudo usermod -aG docker $USER
# keluar lalu masuk SSH lagi agar berlaku
```

---

## Bagian 2 — Ambil kode aplikasi

```bash
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/narayoga/ISP-billing-system.git billing-system
sudo chown -R $USER:$USER /opt/billing-system
cd /opt/billing-system
```

Bila repositori bersifat privat, GitHub akan meminta kredensial — gunakan
*personal access token*, bukan kata sandi akun.

---

## Bagian 3 — Siapkan konfigurasi produksi

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Isi seluruh nilai. Yang berupa rahasia dibuat dengan:
```bash
bash docs/deploy/generate-secrets.sh
```

Nilai domain untuk pemasangan ini:
```
CORS_ORIGINS=https://billdesk.actcomp.online
PUBLIC_BASE_URL=https://billdesk.actcomp.online
VITE_API_BASE_URL=https://billdesk-api.actcomp.online
VITE_BILLING_BASE_URL=https://billdesk-net.actcomp.online
TRUST_PROXY=1
MIKROTIK_MOCK=true
```

> `MIKROTIK_MOCK=true` sampai router benar-benar tersambung — supaya cron
> tanggal 24 tidak mencoba mengisolir lewat perangkat yang belum ada.

Periksa tidak ada nilai contoh yang tertinggal:
```bash
grep -nE "GANTI|domain-anda|change-me" .env.prod
```
Harus kosong.

---

## Bagian 4 — Jalankan aplikasi

```bash
cd /opt/billing-system
C="docker compose --env-file .env.prod -f docker-compose.prod.yml"

$C build                          # 5-10 menit pada percobaan pertama
$C run --rm billing migrate up    # buat tabel
$C run --rm billing seed-admin    # buat akun admin pertama
$C up -d                          # jalankan semuanya
$C ps                             # semua harus "running"/"healthy"
```

Uji dari dalam server:
```bash
curl -s localhost:8080/healthz    # api
curl -s localhost:8081/healthz    # billing
```
Keduanya harus menjawab `{"status":"ok",...}`.

Bila gagal, lihat sebabnya:
```bash
$C logs api --tail 50
$C logs billing --tail 50
```

---

## Bagian 5 — nginx + HTTPS

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

sudo cp docs/deploy/nginx-billdesk.conf.example /etc/nginx/sites-available/billdesk
sudo nano /etc/nginx/sites-available/billdesk    # ganti placeholder <...>

sudo ln -s /etc/nginx/sites-available/billdesk /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default      # matikan halaman bawaan
sudo nginx -t                                     # WAJIB lolos
sudo systemctl reload nginx
```

Terbitkan sertifikat (DNS sudah mengarah ke server ini, jadi siap):
```bash
sudo certbot --nginx -d billdesk-api.actcomp.online -d billdesk-net.actcomp.online
```

Certbot menambahkan konfigurasi HTTPS secara otomatis dan memasang pembaruan
berkala. Uji:
```bash
curl -s https://billdesk-api.actcomp.online/healthz
curl -s https://billdesk-net.actcomp.online/healthz
```

---

## Bagian 6 — Firewall

Lakukan **setelah** semuanya berjalan, agar tidak mengunci diri sendiri.

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH        # JANGAN dilewati — ini akses SSH Anda
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Port 8080, 8081, 5432, dan 6379 sengaja **tidak** dibuka. Backend sudah terikat
ke `127.0.0.1` sehingga hanya nginx yang bisa menjangkaunya, dan Postgres serta
Redis hanya hidup di jaringan privat Docker.

---

## Bagian 7 — Backup terjadwal

```bash
sudo cp docs/deploy/backup-db.sh /usr/local/bin/isp-backup
sudo chmod +x /usr/local/bin/isp-backup
sudo /usr/local/bin/isp-backup          # uji sekali, harus menghasilkan berkas

sudo crontab -e
# tambahkan:
0 2 * * * /usr/local/bin/isp-backup >> /var/log/isp-backup.log 2>&1
```

> Backup yang tersimpan di server yang sama tidak melindungi dari kehilangan
> server. Salin berkasnya secara berkala ke tempat lain.

---

## Bagian 8 — Uji menyeluruh

1. Buka `https://billdesk-api.actcomp.online/healthz` dari browser
2. Login admin lewat frontend (setelah Cloudflare siap)
3. Buat paket dan satu pelanggan uji
4. Generate tagihan → periksa WhatsApp masuk
5. Buka tautan tagihan → unggah bukti → approve

---

## Bila terjadi masalah

| Gejala | Periksa |
|---|---|
| `$C ps` menampilkan `restarting` | `$C logs <service> --tail 50` |
| Postgres gagal start | Ruang disk penuh: `df -h` |
| `nginx -t` gagal | Placeholder `<...>` belum diganti |
| Certbot gagal | DNS belum mengarah, atau port 80 tertutup |
| Aplikasi jalan tapi tak bisa diakses | Firewall, atau nginx belum di-reload |
| Tautan tagihan menunjuk localhost | `PUBLIC_BASE_URL` belum diisi di `.env.prod` |

## Perintah harian

```bash
cd /opt/billing-system
C="docker compose --env-file .env.prod -f docker-compose.prod.yml"

$C ps                    # status
$C logs -f billing       # pantau log
$C restart api           # mulai ulang satu service
git pull && $C up -d --build   # pasang pembaruan kode
```
