# Arsitektur Karang Taruna Digital Ecosystem (M0–M1 Foundation)

## 1. Batasan Domain (FINAL)
- Ekosistem ini dibangun khusus untuk **Karang Taruna Kelurahan Jaticempaka beserta Unit dan Sub Unit** dalam lingkup organisasinya.
- **Tidak ada modul administrasi pemerintahan RT, RW, atau Kelurahan**, pengelolaan pengurus RT/RW, pelayanan warga, ataupun struktur birokrasi pemerintahan.
- Informasi wilayah/alamat hanya disimpan sebagai konteks domisili apabila diperlukan.

## 2. Prinsip Multi-Organisasi & Keanggotaan
- **Isolasi Organisasi**: Setiap organisasi (Kelurahan, Unit, Sub Unit) memiliki profil, konfigurasi visual, konten CMS, pengurus, anggota, dan dashboard terpisah dengan pembatasan `organization_id` dan RLS.
- **Identitas Tunggal, Multi-Membership**: Satu orang (`people`) dapat memiliki beberapa `organization_memberships` di organisasi berbeda.
- **Tanpa Pewarisan Otomatis**: Relasi `parent_organization_id` hanya merepresentasikan struktur organisasi Karang Taruna, bukan pewarisan otomatis keanggotaan maupun hak akses admin.
- **Penambahan vs Transfer**:
  - Penambahan mempertahankan membership lama tetap aktif.
  - Perpindahan (transfer) diproses oleh organisasi tujuan dan baru mengubah membership lama setelah disetujui sesuai kebijakan yang dikonfigurasi.

## 3. Keputusan Kanal Konfirmasi Keanggotaan (WhatsApp Langsung)
Sesuai arahan produk:
- **Tidak ada modul notifikasi in-app / email / push** (`notifications` tidak digunakan).
- Konfirmasi permohonan keanggotaan diarahkan langsung melalui tautan **WhatsApp (`https://wa.me/...`)** dengan format pesan terstruktur.
- **Routing Fleksibel (Per Pengurus atau 1 Pintu)**:
  1. Jika organisasi tujuan mengonfigurasi nomor WhatsApp pengurus (`routingMode = 'org_pic'`) dan nomornya valid, tautan langsung mengarah ke **nomor WhatsApp pengurus organisasi tujuan**.
  2. Jika nomor WhatsApp pengurus organisasi belum tersedia/kosong atau kebijakan disetel ke 1 pintu (`central_gateway`), tautan otomatis fallback ke **nomor WhatsApp 1 pintu ekosistem**.
- Keputusan akhir persetujuan/penolakan keanggotaan tetap dijalankan melalui dashboard organisasi oleh petugas berizin dan dicatat dalam `audit_logs`.

## 4. Rancangan ERD & Migration M1 (Tanpa `notifications`)
Migration M1 menyiapkan tabel inti berikut dengan `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`:
- `ecosystems`: Konfigurasi ekosistem Jaticempaka termasuk nomor WhatsApp 1 pintu (`central_whatsapp_e164`) dan kebijakan default routing.
- `organizations`: Kerangka organisasi (`kelurahan | unit | sub_unit`), `parent_organization_id` (nullable), `slug`, dan `status`.
- `profiles`: Profil pengguna yang terhubung `1:1` dengan `auth.users(id)` (`ON DELETE CASCADE`).
- `platform_role_assignments`: Pemisahan tegas super admin platform dari admin organisasi.
- `audit_logs`: Rekaman aksi sensitif (`organization_id` nullable untuk event level platform/auth).

## 5. Keamanan & Privasi
- `SUPABASE_SERVICE_ROLE_KEY` tidak pernah dikirim ke browser.
- Jabatan organisasi (`Ketua`, `Sekretaris`, dll.) dipisahkan dari role sistem (`Organization Admin`, `Content Editor`, `Membership Manager`, `Event Manager`, `Member`).
- Verifikasi publik kartu anggota pada M6 hanya memakai **Nama + Tanggal Lahir** tanpa menampilkan tanggal lahir/kontak pribadi pada hasil publik dan dilindungi rate limiting.
