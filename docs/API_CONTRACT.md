# Kontrak API MVP

Rancangan REST `/api/v1`, JSON UTF-8. **Implementasi tahap 01 hanya GET `/health`, GET `/ready` internal, dan respons 401 penutup namespace `/api/v1/*`.** Endpoint autentikasi/data/admin pada tabel masih rencana; jangan menganggap placeholder 401 sebagai login yang berfungsi. Galat minimal saat ini berisi code, message, requestId; fields ditambahkan saat validasi bisnis diimplementasikan. Aturan produk pada [PRD](PRD.md), field/validasi pada [model data](DATA_MODEL.md). API menerima dan mengembalikan kode status IN_PROGRESS, ON_HOLD, COMPLETED; terjemahan dilakukan UI.

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
| GET /dashboard | responsibleDivisionIds, month | Snapshot/status, indikator bulan, tren 6 bulan, per-divisi, maksimal 5 tindak lanjut |
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
