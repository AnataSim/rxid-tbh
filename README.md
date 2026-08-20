# 🏆 rxid.tbh — osu! Beatmap Bounty Platform

> **rxid.tbh** adalah platform tantangan beatmap **osu!** modern di mana Bounty Giver (BG) dapat memposting quest beatmap dengan imbalan Bounty Points (BP), dan Bounty Hunter (TBH) dapat menyelesaikan tantangan serta mengajukan bukti (*screenshot* / `.osr` replay) untuk mengklaim poin.

---

## ✨ Fitur & Keunggulan Utama

### 🇮🇩 1. Merah Putih Neon Theme
- Desain antarmuka berstandar tinggi dengan aksen **Gradient Merah Putih** (`linear-gradient(180deg, #dc2626 0%, #ffffff 100%)`) pada logo piala utama, header, dan favicon.
- Kombinasi efek pendaran *neon glow* dual-tone (Merah di atas, Putih di bawah).

### 👥 2. Real-Time Friends System
- Sliding drawer panel pertemanan di sisi kanan layar (diadaptasi dari arsitektur `AnataSim/wast`).
- **Live Search Autocomplete**: Pencarian username & UID pengguna terdaftar secara *real-time*.
- **Undangan & Notifikasi**: Lencana notifikasi merah pada tombol *Invitation* untuk setiap undangan masuk.
- Struktur sub-koleksi Firestore aman: `/users/{userId}/friends/{friendId}` & `/users/{userId}/friendRequests/{requestId}`.

### 🛡️ 3. Keamanan Enkripsi Enterprise (AES-256-GCM & HMAC-SHA256)
- **AES-256-GCM Payload Encryption**: Mengamankan transmisi data sensitif dengan Web Crypto API bawaan browser (96-bit IV).
- **HMAC-SHA256 Request Authentication**: Verifikasi tanda tangan digital untuk mencegah manipulasi data.
- **Security Audit Modal**: Modal uji diagnostik keamanan 0ms yang dapat diakses langsung pada footer.

### 🏆 4. Real-Time Leaderboard & Tie-Breaker Sistem Waktu
- **Automatic Duplicate Wipe**: Sistem secara otomatis mendeteksi dan menghapus dokumen ganda dengan username sama di Firestore.
- **Tie-Breaker Waktu Tercepat**: Pemain dengan jumlah BP yang sama persis (misal: Si A 360 BP jam 09:00 & Si B 360 BP jam 10:00) akan mendahulukan pemain yang **paling cepat mendapatkan poin tersebut (#2 vs #3)**.

### 📱 5. Tampilan Responsif HP (Mobile-First Polish)
- **Mobile Bottom-Sheet Modals**: Seluruh modal (Post Bounty, Submit Proof, Detail Bounty, Tambah Teman) pada HP (`<= 768px`) meluncur mulus sebagai *bottom sheet* modern.
- **Floating Mobile Bottom Nav**: Navigasi melayang berbentuk kapsul neon Merah Putih di bagian bawah HP.
- **Satu Kolom Kartu Bounty**: Pengaturan grid kartu otomatis menjadi 1 kolom penuh di layar HP.

---

## 🛠️ Aturan Main Platform (Rules & Conduct)

### 📌 Bounty Giver (BG):
- Wajib menyertakan link resmi beatmap osu! (`osu.ppy.sh/beatmapsets/...`).
- Menentukan requirement mods (e.g. HDDT, RX, HR) dan target akurasi / rank.
- Meninjau bukti submission hunter secara adil.

### 🎯 Bounty Hunter (TBH):
- **Relax Mods Allowed**: Modus Relax (RX) diperbolehkan untuk tantangan bounty. Cheating / hack pihak ketiga tetap dilarang keras.
- **Strict Mod & Requirement Match**: Wajib memenuhi seluruh mods dan target requirement yang ditentukan oleh BG.
- **Bukti Media**: Mengunggah tangkapan layar (*screenshot*) hasil pertandingan atau link file replay `.osr` yang valid.

---

## 🚀 Panduan Memulai (Local Setup)

```bash
# 1. Clone repository
git clone https://github.com/AnataSim/rxid-tbh.git

# 2. Masuk ke direktori project
cd rxid-tbh

# 3. Install dependencies
npm install

# 4. Jalankan dev server
npm run dev
```

---

## 🌐 Panduan Deploy ke Vercel

Project ini siap di-deploy ke **Vercel** secara gratis dalam 1 menit:

1. Push perubahan ke GitHub repository `AnataSim/rxid-tbh`.
2. Buka [Vercel Dashboard](https://vercel.com/new) dan login dengan akun GitHub Anda.
3. Import repository **`AnataSim/rxid-tbh`**.
4. Konfigurasi Project:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. File `vercel.json` sudah dikonfigurasi di root project untuk penanganan *Single Page Application (SPA) routing rewrite* secara otomatis (bebas error 404 saat refresh).
6. Klik **Deploy**! Web akan langsung tayang secara publik.

---

## 📜 Lisensi & Hak Cipta

Dikelola & Dikembangkan oleh **AnataSim** — Dirancang untuk Komunitas Beatmap Challenge **osu!**.
