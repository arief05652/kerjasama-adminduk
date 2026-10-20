# Kerjasama - Adminduk

Aplikasi web untuk mengelola dokumen kerjasama (PKS) Adminduk dalam jaringan lokal.
Berisi sistem login, manajemen pengguna, penyimpanan file nyata di disk, pratinjau
dokumen, log aktivitas, dan sinkronisasi realtime antar perangkat.

Dibuat dengan **React + Vite** di sisi klien dan plugin middleware Node di sisi server
(tanpa framework backend terpisah). Database memakai **SQLite** bawaan Node (`node:sqlite`).

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Struktur Proyek](#struktur-proyek)
- [Penyimpanan Data](#penyimpanan-data)
- [API](#api)
- [Penamaan File dengan Tanggal](#penamaan-file-dengan-tanggal)
- [Catatan Keamanan](#catatan-keamanan)
- [Panduan Install & Menjalankan](#panduan-install--menjalankan)

---

## Fitur

### Autentikasi
- Halaman **login** di root path (`/`). Belum login → form login; sudah login → dashboard.
- Password di-hash dengan **scrypt + salt**.
- Sesi memakai **token** (disimpan di server, dikirim via header `Authorization: Bearer`).
- Logout normal dan **logout paksa** oleh admin (token dicabut → sesi langsung invalid).
- Akun nonaktif tidak bisa login.

### Beranda (File Explorer)
- Menjelajah folder `storage/` seperti file manager: buka folder, breadcrumb, kembali.
- Dua tampilan: **kisi (grid)** ala Google Drive dan **daftar (list)**.
- Operasi file: buat folder, buat file, **upload**, salin, potong, tempel, ubah nama, hapus.
- **Drag & drop** file ke area explorer untuk upload.
- **Pencarian** nama file, **filter periode** (bulan–tahun), dan **sortir** (tanggal, nama, ukuran).
- **Pratinjau file** (panel viewer): PDF, gambar, video, audio, dan teks. Tipe lain → buka di tab baru.
- Indikator **pemakaian storage** device + ukuran folder `storage/` di sidebar.

### Manajemen Pengguna (Active User)
- Daftar pengguna dari database: nama, username, peran, status, status sesi (Online/Offline).
- **Tambah user** (username, nama, email, password, peran admin/user).
- **Aktifkan / nonaktifkan** akun.
- **Logout paksa** user yang sedang online.

### Log Aktivitas
- Riwayat semua tindakan: login/logout, operasi file, upload, dan aksi manajemen user.
- Mencatat **siapa** yang melakukan, **apa**, **detail**, dan **waktu**.

### Notifikasi
- Halaman notifikasi (masa berlaku kerjasama & aktivitas akses). Saat ini data contoh statis.

### Realtime
- Perubahan (upload/operasi file, perubahan user, log baru) langsung tersinkron ke semua
  perangkat memakai **Server-Sent Events (SSE)** — tanpa refresh.

### Lain-lain
- **Dark mode / light mode** (disimpan di `localStorage`).
- **Responsive** (sidebar jadi drawer, topbar 2 baris, tabel & toolbar menyesuaikan layar).

---

## Teknologi

| Bagian | Teknologi |
| --- | --- |
| UI | React 19 |
| Build tool | Vite 8 |
| Lint | oxlint |
| Backend dev | Vite middleware plugin (Node) |
| Database | SQLite via `node:sqlite` (bawaan Node) |
| Realtime | Server-Sent Events (SSE) |
| Auth | Token sesi + scrypt |

Tanpa framework backend tambahan — endpoint API disediakan oleh plugin Vite
(`configureServer` dan `configurePreviewServer`), jadi `npm run dev` dan `npm run preview`
sudah membawa API-nya.

---

## Arsitektur

```
Browser (React)
  │  fetch /api/...          EventSource /api/fs/events (SSE)
  ▼
Vite dev/preview server
  ├─ storagePlugin  → /api/fs/*      (tree, raw, usage, upload, events, operasi file)
  ├─ adminPlugin    → /api/admin/*   (users, logs)
  └─ authPlugin     → /api/auth/*    (login, me, logout)
        │
        ├─ storage/            → file & folder pengguna (nyata di disk)
        ├─ database/app.sqlite → users + logs
        └─ events.js           → broadcast perubahan ke semua klien (SSE)
```

Alur data explorer: `GET /api/fs` mengembalikan seluruh pohon `storage/`; setiap operasi
mengirim request lalu memuat ulang tree. Event SSE `fs` / `users` / `logs` memicu reload
di klien lain.

---

## Struktur Proyek

```
kerjasama_adminduk/
├─ index.html
├─ vite.config.js            # mendaftarkan 3 plugin server
├─ package.json
├─ server/
│  ├─ storagePlugin.js       # API /api/fs (file, upload, raw, usage, SSE)
│  ├─ adminPlugin.js         # API /api/admin (users, logs)
│  ├─ authPlugin.js          # API /api/auth (login, me, logout)
│  ├─ db.js                  # SQLite: skema, seed admin, query user & log
│  └─ events.js              # bus SSE (broadcast ke klien)
├─ storage/                  # FILE PENGGUNA disimpan di sini (nyata)
├─ database/
│  └─ app.sqlite             # database SQLite (auto dibuat)
└─ src/
   ├─ main.jsx
   ├─ App.jsx                # gerbang auth (login / dashboard)
   ├─ Dashboard.jsx          # shell dashboard + routing antar halaman
   ├─ index.css              # CSS variables tema (light/dark)
   ├─ styles/layout.css
   ├─ lib/
   │  ├─ api.js              # fetch file + SSE subscribe
   │  ├─ adminApi.js         # fetch user & log
   │  ├─ auth.js             # token & login/logout
   │  ├─ fileSystem.js       # helper pohon file (find, path)
   │  ├─ format.js           # format ukuran/tanggal
   │  └─ sort.js             # sortir & filter periode
   ├─ hooks/
   │  ├─ useAuth.js
   │  ├─ useFileSystem.js    # state explorer + operasi + realtime
   │  ├─ useStorageUsage.js
   │  ├─ useTheme.js
   │  └─ useLocalStorage.js
   └─ components/
      ├─ common/             # Button, Modal, ConfirmDialog, InputDialog
      ├─ layout/             # Sidebar, Navbar, StorageUsage
      ├─ navbar/             # Breadcrumb, SearchBar, UserMenu
      ├─ explorer/           # FileExplorer, Toolbar, List, Grid, Viewer
      └─ pages/              # LoginPage, ActiveUserPage, LogAktivitasPage, NotifikasiPage
```

---

## Penyimpanan Data

- **`storage/`** — semua file & folder yang dikelola lewat Beranda. Semua path divalidasi
  agar tidak keluar dari folder ini (anti path traversal).
- **`database/app.sqlite`** — dibuat otomatis saat server pertama jalan.
  - Tabel `users`: id, username (unik), name, email, password (hash), role, active,
    session_token, last_login, created_at.
  - Tabel `logs`: user_id, username, action, detail, created_at.
- **Seed otomatis**: kalau belum ada admin, dibuat akun `admin` / `admin123`.

---

## API

Semua di bawah `/api`. Endpoint ber-tanda 🔒 butuh header `Authorization: Bearer <token>`
milik user **admin**.

### Auth — `/api/auth`
| Method | Path | Keterangan |
| --- | --- | --- |
| POST | `/login` | Body `{ username, password }` → `{ token, user }` |
| GET | `/me` | Data user dari token |
| POST | `/logout` | Cabut sesi |

### File — `/api/fs`
| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/` | Pohon folder `storage/` |
| GET | `/raw?path=` | Isi file mentah (inline,Content-Type sesuai ekstensi) |
| GET | `/usage` | Pemakaian device + ukuran folder storage |
| GET | `/events` | Stream SSE (`fs`, `users`, `logs`) |
| POST | `/upload?dir=&name=` | Upload file (body = isi file) |
| POST | `/` | Body `{ action, ... }`: `create`/`rename`/`delete`/`move`/`copy` |

### Admin — `/api/admin` (🔒)
| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/users` | Daftar user |
| POST | `/users` | Tambah user |
| POST | `/users/:id/force-logout` | Logout paksa |
| POST | `/users/:id/active` | Body `{ active }` → aktif/nonaktif |
| GET | `/logs?limit=` | Riwayat log |

---

## Penamaan File dengan Tanggal

Sortir dan filter periode memakai tanggal yang **dideteksi dari nama file** dengan pola
`tanggal_bulan_tahun` (pemisah `_` atau `-`). Pola boleh berada di mana saja pada nama.

- `12_10_2026.pdf` → 12 Oktober 2026
- `laporan_12-10-2026_final.pdf` → 12 Oktober 2026

Kalau nama tidak mengandung pola tersebut, sistem memakai tanggal diubah file (`modified`).
Folder selalu ditampilkan di atas.

---

## Catatan Keamanan

- Semua akses file dibatasi di dalam `storage/`; path traversal ditolak.
- Operasi file dan endpoint admin memakai token sesi; aktor log diambil dari token (bukan hardcode).
- Token disimpan di `localStorage` browser (rentan XSS). Untuk produksi, pertimbangkan cookie
  `httpOnly` + proteksi CSRF.
- Endpoint `GET /api/fs/raw` saat ini belum dicek token (siapa pun yang tahu path bisa
  mengakses file). Kunci bila diperlukan.

---

## Panduan Install & Menjalankan

### Prasyarat

- **Node.js versi 22.5 atau lebih baru** (disarankan **24**), karena memakai modul bawaan
  `node:sqlite`. Cek dengan:
  ```bash
  node -v
  ```
- npm (bawaan Node).

### 1. Install dependency

```bash
npm install
```

### 2. Jalankan mode development

```bash
npm run dev
```

Buka alamat yang muncul di terminal (biasanya `http://localhost:5173`).

### 3. Login

Gunakan akun admin default (dibuat otomatis saat pertama kali server jalan):

| Username | Password |
| --- | --- |
| `admin` | `admin123` |

> Disarankan segera mengganti password default.

### 4. Build untuk produksi

```bash
npm run build      # hasil ada di folder dist/
npm run preview    # menjalankan hasil build (API tetap aktif via preview server)
```

### 5. Lint (opsional)

```bash
npm run lint
```

### Catatan menjalankan

- Folder `storage/` dan `database/app.sqlite` dibuat otomatis jika belum ada.
- API berjalan lewat plugin Vite pada `dev` dan `preview`. Kalau di-deploy sebagai file
  statis murni (`dist/`) ke web server biasa, API **tidak** ikut — perlu host Node yang
  memuat `storagePlugin`, `adminPlugin`, dan `authPlugin` (mis. dibungkus ke server Express).

### Uji cepat antar-perangkat (realtime)

1. Jalankan `npm run dev` dengan `--host` agar bisa diakses dari perangkat lain:
   ```bash
   npm run dev -- --host
   ```
2. Buka aplikasi di dua perangkat/browser dalam jaringan yang sama.
3. Upload atau ubah file di satu perangkat → explorer, usage, daftar user, dan log di
   perangkat lain ikut berubah otomatis.
