# 🎮 EduGame Track

**Platform belajar berbasis gamifikasi** — mengubah evaluasi belajar (tugas & ujian) menjadi
petualangan berisi poin XP, lencana, dan papan peringkat.

> **Purwarupa (Blueprint) untuk Lomba Web Development Ngoding'X 2026**
> Universitas Darussalam Gontor · Program Studi Teknik Informatika
>
> Seluruh data bersifat **simulasi statis**. Repo ini adalah purwarupa antarmuka (museum/demo)
> untuk memamerkan alur dan desain — belum ada backend, basis data, atau autentikasi nyata.

🔗 **Live demo:** <https://fahriputra-999.github.io/NgodinX/>

---

## 📑 Daftar Isi

| Halaman | Deskripsi |
|---|---|
| [`index.html`](index.html) | Landing page + simulasi kuis game interaktif |
| [`login.html`](login.html) | Masuk dengan pilih peran (Siswa / Guru) |
| [`dashboard-siswa.html`](dashboard-siswa.html) | Portal siswa: quest, XP, lencana, rapor |
| [`dashboard-guru.html`](dashboard-guru.html) | Panel guru: grafik nilai, rekap, peringatan |

Struktur aset:

```
assets/
├── css/style.css   → design system (token-based, light/dark)
└── js/app.js       → utilitas bersama (theme, toast, grafik, konfeti, animasi)
```

---

## ✨ Fitur Unggulan

### Gamifikasi
- Sistem **XP & Level** dengan progress bar per level
- **Lencana** (achievement) otomatis terbuka saat syarat tercapai
- **Combo streak** (x1 / x1.5 / x2) untuk jawaban beruntun
- **Papan peringkat** harian, mingguan, dan bulanan
- Konfeti + animasi celebratory saat quest selesai

### Kuis Berbasis Waktu
- Timer 30 detik per soal dengan bar waktu yang menyusut
- 3 nyawa percobaan; jawaban salah mengurangi nyawa
- Bonus waktu + multiplier combo untuk skor
- Penjelasan edukatif otomatis di setiap soal
- Rincian jawaban & akurasi di layar hasil
- Pintasan keyboard: tekan <kbd>A</kbd> <kbd>B</kbd> <kbd>C</kbd> <kbd>D</kbd>

### Monitoring Guru
- Grafik perkembangan nilai kelas (SVG, digambar sendiri tanpa library)
- Bar chart tingkat penyelesaian per jenis tugas
- Tabel rekap nilai **dengan pencarian langsung**
- Panel peringatan otomatis (tugas terlambat, nilai di bawah KKM)

### Pengalaman Pengguna
- **Mode terang / gelap** (tersimpan di localStorage, anti-FOUC)
- Scroll reveal, counter angka beranimasi, hover lift
- Toast notification & modal (tanpa `alert()` bawaan browser)
- Sidebar off-canvas di layar kecil
- Mendukung `prefers-reduced-motion` dan gaya cetak

---

## 🛠️ Teknologi

| | |
|---|---|
| HTML5 | Struktur semantik, meta SEO & Open Graph |
| CSS3 | Design system custom properties, grid & flexbox, animasi, dark mode |
| Bootstrap 5.3 | Grid, komponen, utility (via CDN) |
| JavaScript | Vanilla JS — tanpa framework & tanpa build step |
| Google Fonts | Inter |
| SVG | Grafik & ilustrasi digambar manual |

**Tanpa dependensi build.** Cukup buka `index.html` di browser, atau jalankan server statis:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

---

## 🎯 Peran Pengguna

**👨‍🎓 Siswa** → masuk → `dashboard-siswa.html`
Melihat quest aktif, progress level, lencana, papan peringkat, aktivitas, dan rapor nilai.

**👩‍🏫 Guru / Admin** → masuk → `dashboard-guru.html`
Memantau statistik kelas, grafik perkembangan nilai, rekap nilai siswa, dan peringatan kelas.

---

## 📌 Catatan untuk Juri

- Tidak ada backend. Semua form interaktif sengaja dibuat menampilkan umpan balik Toast
  ("fitur sedang disiapkan") alih-alih menipu pengguna.
- Logika kuis sepenuhnya berjalan di sisi klien dan bisa dicoba langsung di
  bagian *Simulasi Quest Kuis* pada halaman utama.
- Struktur data, komponen, dan alur sudah disiapkan agar mudah dikembangkan
  ke tahap produksi (penambahan API, database, dan autentikasi).

---

## 📄 Lisensi

Dibuat untuk keperluan lomba Web Development Ngoding'X 2026.
