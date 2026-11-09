# Kontrak API MVP

Rancangan REST `/api/v1`, JSON UTF-8. **Implementasi sampai D0-03:** GET `/health`, GET `/ready` internal, POST `/auth/login`, GET `/auth/me`, POST `/auth/logout`, GET `/divisions`, GET `/admin/accounts`, serta GET `/dashboard` ringkas tersedia. Path pada tabel di bawah berawalan `/api/v1` kecuali health/ready. Endpoint daftar/detail/mutasi temuan, ekspor, mutasi admin serta tren/grafik/daftar tindak lanjut dashboard masih rencana. Path belum tersedia mengembalikan 401 tanpa login, 403 untuk divisi pada namespace admin, atau 404 setelah pemeriksaan akses lolos. Galat minimal saat ini berisi code, message, requestId; fields ditambahkan saat validasi bisnis diimplementasikan. Aturan produk pada [PRD](PRD.md), field/validasi pada [model data](DATA_MODEL.md). API menerima dan mengembalikan kode status IN_PROGRESS, ON_HOLD, COMPLETED; terjemahan dilakukan UI.

## Konvensi

- Semua endpoint data memerlukan sesi aktif; ADMIN diperiksa server pada `/admin/*`. Tidak ada pembatasan edit berdasarkan divisi pemilik.
- Mutasi memakai cookie sesi, X-CSRF-Token, pemeriksaan Origin, allowlist field, validasi ID/tanggal/referensi.
- Mutasi finding menyertakan `version` terkini dan `mutationId` UUID unik per operasi. Create hanya `mutationId`. Aktor/waktu/audit/version baru dibuat server.
- Berhasil: `{ "data": ... }`; list: `{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 35 } }`.
- Gagal: `{ "error": { "code": "...", "message": "...", "fields": {}, "requestId": "..." } }`. Jangan mengembalikan stack trace, hash sandi, session ID atau detail internal database.
- 400 kueri/JSON salah, 401 sesi tidak ada/kedaluwarsa, 403 akses/CSRF ditolak, 404 data tidak ditemukan, 409 konflik/duplikat/kapasitas histori, 413 unggahan terlalu besar, 415 jenis tidak didukung, 422 validasi bisnis, 429 rate limit, 500 gangguan internal.
- Setelah konflik, backend mengembalikan currentVersion; klien memuat ulang tanpa menghilangkan draf dan meminta pengguna meninjau perubahan sebelum simpan ulang.

## Endpoint

| Method/path | Input inti | Hasil/hak |
| --- | --- | --- |
| POST /auth/login | username, password | Sesi baru, identitas akun, csrfToken; validasi Origin dan rate limit; tidak ada registrasi |
| GET /auth/me | Cookie | Akun/divisi/peran dan csrfToken; 401 bila tidak aktif |
| POST /auth/logout | CSRF | Cabut sesi saat ini, 204 |
| GET /divisions | activeOnly default true | Master divisi; pengguna login |
| GET /findings | Filter + pagination | List proyeksi tanpa audit/progres lengkap/foto biner |
| POST /findings | Data awal + mutationId | 201, status IN_PROGRESS dan version=1 |
| GET /findings/:id | ID | Detail, progres terbatas, metadata foto; 404 jika hilang |
| PATCH /findings/:id | Field bisnis yang berubah, version, mutationId, correctionReason jika diwajibkan | 200 detail terbaru; audit atomik |
| GET /findings/:id/progress | page/pageSize | Catatan progres paginasi; urut terbaru, akun divisi dan waktu |
| POST /findings/:id/progress | text opsional, status/targetDate/priority opsional, holdReason/correctionReason bila perlu, version, mutationId | Setidaknya satu perubahan/catatan; versi baru dan audit dalam satu write |
| GET /findings/:id/history | page/pageSize | Audit paginasi, urut waktu terbaru |
| POST /findings/:id/cancel | reason, version, mutationId | Tandai batal; 422 tanpa alasan |
| POST /findings/:id/restore | reason, version, mutationId | ADMIN saja; pulihkan batal, audit |
| POST /findings/:id/attachments | Multipart file, kind, version, mutationId | 201 metadata; tidak menerima storageKey dari klien |
| GET /findings/:id/attachments/:attachmentId | ID | File yang direferensikan temuan, setelah login; private/no-store |
| GET /findings/summary | Filter tanpa pagination | totalMatched, totalValid, counts per status, open, overdue, cancelled; satu aggregate untuk counts |
| GET /dashboard | responsibleDivisionIds, month | D0-03: snapshot/status + indikator bulan. Tren 6 bulan, per-divisi dan 5 tindak lanjut masih M-04. |
| GET /exports/findings.pdf | Filter list tanpa page/pageSize | application/pdf, attachment, private/no-store; semua hasil filter, batas eksplisit |
| GET /admin/accounts | pagination | ADMIN; tanpa passwordHash |
| POST /admin/accounts | username, displayName, divisionId, role, initialPassword | ADMIN; 201; audit akun |
| PATCH /admin/accounts/:id | active/displayName, version, mutationId | ADMIN; tidak boleh menonaktifkan admin terakhir/dirinya secara tidak sengaja |
| POST /admin/accounts/:id/reset-password | newPassword, version, mutationId | ADMIN; sessionVersion naik, audit, jangan log password |
| POST /admin/divisions | code, name | ADMIN; unik, aktif |
| PATCH /admin/divisions/:id | name/active, version, mutationId | ADMIN; tidak hard delete; nama lama dipertahankan pada audit |
| GET /health | Tidak ada | Publik hanya status proses; tanpa konfigurasi internal |
| GET /ready | Tidak ada | Internal/proxy ops saja, koneksi DB; bukan endpoint data publik |

Daftarkan route statis `/findings/summary` sebelum `/:id` untuk menghindari tertangkap sebagai ID. Tidak ada DELETE finding/audit, approve, reject, register publik, atau reopen kejadian lama.

## Rincian autentikasi D0-02

- Login menerima hanya `{ username, password }`; username dinormalisasi trim/lowercase, format 3–64 karakter `a-z0-9._-`; sandi string 1–128 karakter. Seed membuat sandi acak 24 karakter; batas login bukan aturan pembuatan sandi admin M-06.
- Login/me: `{ data: { account: { id, username, displayName, role, active, division: { id, code, name } | null }, csrfToken, expiresAt } }`. Tidak mengirim hash sandi, sessionVersion, atau token cookie dalam JSON.
- Cookie lokal `she_session_dev`; demo HTTPS `__Host-she_session`, host-only, HttpOnly, Path=/, SameSite=Lax, Secure saat demo. Masa absolut 12 jam, tanpa sliding renewal. Login ulang dengan cookie lama mencabut sesi lama; perangkat lain tetap aktif.
- Logout mewajibkan Origin allowlist dan `X-CSRF-Token` sesi tersebut, menghapus sesi dan cookie lalu 204. Semua mutasi setelah login melalui guard yang sama. Login memerlukan Origin allowlist, tanpa CSRF pra-login.
- Batas login fixed window 15 menit: 10 percobaan/username dan 30/IP (termasuk sukses/input tidak valid); 429 `LOGIN_RATE_LIMITED` + `Retry-After`. Counter MongoDB tetap berlaku setelah API restart; batas dapat mencapai dua kali kuota di sekitar pergantian window. Tidak mempercayai X-Forwarded-For; proxy hosting belum dikonfigurasi.
- GET divisions hanya menerima `activeOnly=true|false`; default true. GET admin/accounts hanya `page`/`pageSize` (default 1/20, maksimal 100), tanpa rahasia. Query lain 400.
- Akun nonaktif/sessionVersion tidak cocok/expired selalu 401 meskipun TTL belum membersihkan record. Endpoint reset/nonaktif/ubah peran beserta auditnya masih M-06.

## Dashboard ringkas D0-03

Endpoint GET `/api/v1/dashboard` memerlukan sesi aktif divisi atau admin, tanpa pembatasan data berdasarkan divisi akun. Filter `responsibleDivisionIds` adalah OR penanggung jawab, maksimal 50 ID ObjectId heksadesimal dipisah koma; duplikat dihapus, tanpa parameter berarti semua divisi. ID valid yang tidak ditemukan memberi hasil nol. String kosong, array/parameter berulang, format ID salah dan query di luar allowlist ditolak 400 INVALID_QUERY. `month` memakai YYYY-MM (tahun 1000–9999), default bulan kalender server pada APP_TIMEZONE; bulan mendatang sah dan dapat nol.

Respons saat ini (contoh struktur, angka bukan konstanta):

```json
{
  "data": {
    "dataMode": "DEMO",
    "asOf": "2026-11-09T10:00:00.000Z",
    "today": "2026-11-09",
    "timeZone": "Asia/Jakarta",
    "scope": { "responsibleDivisionIds": [] },
    "snapshot": {
      "totalValid": 16,
      "counts": { "IN_PROGRESS": 6, "ON_HOLD": 5, "COMPLETED": 5 },
      "open": 11, "overdue": 5
    },
    "period": { "month": "2026-11", "reported": 9, "completed": 5 }
  }
}
```

Semua angka memakai satu aggregate MongoDB: data batal dikecualikan, tanpa unwind penanggung jawab agar temuan bersama tetap unik. Snapshot semua tanggal; `month` hanya memengaruhi period.reported (reportedDate) dan period.completed (status kini COMPLETED + completedAt pada zona aplikasi). Target kosong/hari ini dan status Selesai tidak terlambat. Respons tidak mengirim pelapor, uraian, audit atau dokumen akun. Database kosong memberi nol; kegagalan pembacaan memberi 500 tanpa data/angka nol palsu. `asOf` adalah waktu request, bukan jaminan snapshot historis resmi.

## Filter bersama

| Parameter | Arti |
| --- | --- |
| responsibleDivisionIds | String ID dipisah koma; OR antar divisi; jangan $unwind lalu menggandakan jumlah |
| reporterDivisionId | Satu divisi asal pelapor |
| status | Salah satu enum status; tidak ada NEW |
| priority | LOW/MEDIUM/HIGH/UNASSESSED |
| q | Teks maksimal 100; cari referensi, uraian, lokasi/nama pelapor; regex input harus di-escape |
| from, to | YYYY-MM-DD inklusif, from ≤ to |
| dateBasis | reported (default) atau completed; completed hanya yang status kini COMPLETED dengan completedAt terisi |
| cancellation | active (default), cancelled, all |
| page, pageSize | Awal 1; default 20, maksimal 100; tidak berlaku untuk summary/PDF |
| sort | Allowlist reportedDate atau updatedAt dengan asc/desc; default reportedDate desc, _id desc |

List, summary, dan PDF memakai parser/filter builder yang sama. Filter unknown ditolak, bukan disisipkan langsung ke MongoDB. PDF dan ringkasan tidak mengikutkan page/pageSize. Setiap respons memberikan asOf server. Respons bisa berubah bila ada edit di antara request; UI refresh list+summary setelah mutasi dan saat kembali ke daftar, tampilkan timestamp, jangan menjanjikan live snapshot.

Dashboard berbeda dari filter tanggal daftar: division scope berlaku untuk seluruh dashboard; month hanya angka periodik/tren. Kartu status adalah snapshot semua tanggal. Definisi pada [UI](UI_SPEC.md).

## Contoh create (semua nilai contoh)

```json
{
  "reportedDate": "2026-11-09",
  "description": "Pintu panel contoh berkarat; perlu tindak lanjut.",
  "location": "Area Demo A",
  "reporterName": "Pelapor Contoh 01",
  "reporterDivisionId": "000000000000000000000001",
  "responsibleDivisionIds": ["000000000000000000000002", "000000000000000000000003"],
  "targetDate": null,
  "priority": null,
  "mutationId": "ea9e431d-c2be-4f2b-b13a-6ee9d5f884f3"
}
```

Server mengisi status, reference, createdBy, waktu dan audit. Tanggal contoh bukan default permanen. Detail mengembalikan isNew/isOverdue/today/timeZone dari perhitungan server.

## Konsistensi mutasi

Hitung perubahan dan audit berdasarkan versi dokumen yang dibaca. Write kondisional `_id+version` mengubah field, append audit, dan increment version bersama. Jika version berbeda, 409 VERSION_CONFLICT tanpa menyimpan sebagian. Retry mutationId yang sudah berhasil mengembalikan hasil operasi sebelumnya, bukan menggandakan catatan. Mutasi akun/divisi mengikuti pola version+audit tertanam yang sama. Progres append-only; koreksi dijelaskan melalui catatan baru, tidak mengubah histori diam-diam.

Koreksi COMPLETED menjadi aktif memerlukan correctionReason dan dicatat sebagai koreksi, bukan kejadian berulang. Pembaruan record batal ditolak kecuali pemulihan admin. Unggah memeriksa version setelah file diverifikasi dan membersihkan file orphan bila gagal.

## Batas PDF usulan

Maksimal 1.000 hasil per ekspor dan satu proses PDF aktif per instance backend; jika lebih, 422 EXPORT_TOO_LARGE meminta filter lebih sempit, bukan memotong diam-diam. Jika proses penuh, 429 EXPORT_BUSY. Tidak menyertakan pagination klien. Batas merupakan asumsi teknis; skala awal jauh di bawahnya tetapi tetap diuji.
