# Milestone Checklist & Acceptance Criteria

## Milestone M0 — Product Foundation
- [x] `metadata.json` dan `index.html` disesuaikan untuk Karang Taruna Kelurahan Jaticempaka Digital Ecosystem.
- [x] `.env.example` mendokumentasikan variabel lingkungan tanpa secret (termasuk `VITE_DEFAULT_WHATSAPP_GATEWAY`).
- [x] Design tokens Light Mode (dominan putih + aksen biru/oranye/merah) dan Dark Mode (navy/biru gelap doff) terkonfigurasi dengan `@custom-variant dark`.
- [x] Struktur modular per bounded context (`platform`, `organizations`, `memberships`, `permissions`, `audit`).
- [x] Resolver konfirmasi keanggotaan WhatsApp (per pengurus organisasi dengan fallback otomatis ke 1 pintu) terimplementasi dan teruji.
- [x] Pemisahan katalog jabatan organisasi vs role sistem & permission granular terdokumentasi dan teruji.
- [x] Tidak ada modul administrasi pemerintahan RT/RW/Kelurahan maupun modul notifikasi in-app yang tidak dibutuhkan.
- [x] Persetujuan user untuk melanjutkan ke **M1 — Database & Auth**.

## Milestone M1 — Database & Auth
- [x] Migration `0001_m1_foundation_auth.sql` (`ecosystems`, `organizations`, `profiles`, `platform_role_assignments`, `audit_logs`, trigger `on_auth_user_created`, proteksi anti-eskalasi status profil, dan RLS deny-by-default).
- [x] Seed awal `supabase/seed.sql` khusus ekosistem Karang Taruna Kelurahan Jaticempaka beserta Unit dan Sub Unit.
- [x] Client wrapper aman (`src/lib/supabase/client.ts`) yang hanya menggunakan public anon key dan menolak placeholder env.
- [x] Validasi input & service Auth/Profile (`signUpWithEmail`, `signInWithEmail`, `updateMyProfile`, `signOutCurrentUser`) beserta UI `AuthAccountPanel`.
- [ ] Verifikasi live dengan project Supabase aktif (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan eksekusi migration di SQL Editor).

## Milestone M2 — Organization Core (Berikutnya setelah verifikasi M1)
- [ ] Onboarding organisasi (pendaftaran publik & undangan resmi).
- [ ] Pengelolaan profil organisasi & konfigurasi nomor WhatsApp pengurus per organisasi.
- [ ] Organization scope guard pada endpoint & dashboard awal.
