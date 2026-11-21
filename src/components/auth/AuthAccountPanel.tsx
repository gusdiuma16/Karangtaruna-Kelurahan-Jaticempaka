import { useEffect, useState, type FormEvent } from 'react';
import { Check, KeyRound, LogOut, UserCheck } from 'lucide-react';

import {
  fetchCurrentSessionSnapshot,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  updateMyProfile,
} from '../../domains/identity/auth-service.ts';
import type { AuthSessionSnapshot } from '../../domains/identity/types.ts';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client.ts';

type AuthTab = 'signin' | 'signup';

export function AuthAccountPanel() {
  const supabaseReady = isSupabaseConfigured();

  const [tab, setTab] = useState<AuthTab>('signin');
  const [session, setSession] = useState<AuthSessionSnapshot | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(supabaseReady);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sign-in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign-up state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerAddressRw, setRegisterAddressRw] = useState('');

  // Profile edit state
  const [profileFullName, setProfileFullName] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddressRw, setProfileAddressRw] = useState('');

  const syncProfileForm = (snapshot: AuthSessionSnapshot | null) => {
    if (!snapshot?.profile) {
      return;
    }
    setProfileFullName(snapshot.profile.fullName);
    setProfileDisplayName(snapshot.profile.displayName ?? '');
    setProfilePhone(snapshot.profile.phoneE164 ?? '');
    setProfileAddressRw(snapshot.profile.addressRw ?? '');
  };

  useEffect(() => {
    if (!supabaseReady) {
      return;
    }

    let active = true;
    const client = getSupabaseClient();

    fetchCurrentSessionSnapshot().then((snapshot) => {
      if (!active) {
        return;
      }
      setSession(snapshot);
      syncProfileForm(snapshot);
      setLoadingSession(false);
    });

    const subscription = client?.auth.onAuthStateChange(() => {
      fetchCurrentSessionSnapshot().then((snapshot) => {
        if (!active) {
          return;
        }
        setSession(snapshot);
        syncProfileForm(snapshot);
      });
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [supabaseReady]);

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});

    const result = await signInWithEmail({
      email: loginEmail,
      password: loginPassword,
    });

    setSubmitting(false);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFeedback({
        type: 'error',
        text: result.message ?? 'Gagal masuk ke akun.',
      });
      return;
    }

    if (result.data) {
      setSession(result.data);
      syncProfileForm(result.data);
    }
    setLoginPassword('');
    setFeedback({
      type: 'success',
      text: result.message ?? 'Berhasil masuk.',
    });
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});

    const result = await signUpWithEmail({
      fullName: registerName,
      email: registerEmail,
      password: registerPassword,
      addressRw: registerAddressRw,
    });

    setSubmitting(false);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFeedback({
        type: 'error',
        text: result.message ?? 'Pendaftaran gagal.',
      });
      return;
    }

    setRegisterPassword('');
    setFeedback({
      type: 'success',
      text: result.message ?? 'Akun berhasil dibuat.',
    });

    if (!result.data?.needsEmailConfirmation) {
      const snapshot = await fetchCurrentSessionSnapshot();
      setSession(snapshot);
      syncProfileForm(snapshot);
    }
  };

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});

    const result = await updateMyProfile(session.userId, {
      fullName: profileFullName,
      displayName: profileDisplayName,
      phoneRaw: profilePhone,
      addressRw: profileAddressRw,
    });

    setSubmitting(false);
    if (!result.ok || !result.data) {
      setFieldErrors(result.fieldErrors ?? {});
      setFeedback({
        type: 'error',
        text: result.message ?? 'Gagal memperbarui profil.',
      });
      return;
    }

    const updatedSnapshot: AuthSessionSnapshot = {
      ...session,
      profile: result.data,
    };
    setSession(updatedSnapshot);
    syncProfileForm(updatedSnapshot);
    setFeedback({
      type: 'success',
      text: result.message ?? 'Profil diperbarui.',
    });
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    setFeedback(null);
    const result = await signOutCurrentUser();
    setSubmitting(false);
    if (result.ok) {
      setSession(null);
      setFeedback({
        type: 'success',
        text: result.message ?? 'Anda telah keluar.',
      });
    } else {
      setFeedback({
        type: 'error',
        text: result.message ?? 'Gagal keluar dari sesi.',
      });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Setup Status & M1 Database Scope */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-[#1E2D4A] dark:bg-[#111C30] lg:col-span-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Milestone M1 · Database & Auth
            </span>
            <KeyRound className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </div>

          <h3 className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">
            Status Koneksi Supabase
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {supabaseReady
              ? 'Variabel koneksi Supabase aktif. Autentikasi dan pembaruan profil berjalan langsung ke database dengan RLS deny-by-default.'
              : 'Kredensial Supabase belum diisi pada environment. Anda tetap dapat meninjau SQL migration M1 di bawah sebelum menghubungkan project Supabase.'}
          </p>

          <dl className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-xs dark:border-[#1E2D4A]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Mode Auth</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100">
                {supabaseReady ? 'Supabase Auth Aktif' : 'Menunggu Konfigurasi Env'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Migration File</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">
                0001_m1_foundation_auth.sql
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Seed Ekosistem</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">seed.sql</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-600 dark:border-[#1E2D4A] dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            Langkah Aktivasi Live:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4">
            <li>Jalankan isi file migration dan seed di Supabase SQL Editor.</li>
            <li>
              Masukkan <span className="font-mono">VITE_SUPABASE_URL</span> dan{' '}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> di panel Secrets.
            </li>
            <li>Daftar akun baru dan cek profil otomatis terbentuk via trigger database.</li>
          </ol>
        </div>
      </div>

      {/* Right Column: Auth Form / Active Profile Workspace */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2D4A] dark:bg-[#111C30] lg:col-span-7">
        {feedback && (
          <div
            role="status"
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'border-red-200 bg-red-50/70 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {loadingSession ? (
          <div className="space-y-3 py-8">
            <div className="h-5 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ) : session ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-[#1E2D4A]">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Profil Pengguna Aktif
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {session.email ?? session.userId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={submitting}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-[#1E2D4A] dark:text-slate-200 dark:hover:bg-[#0B1220]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Keluar
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-fullname"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    id="profile-fullname"
                    type="text"
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="profile-displayname"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Nama Panggilan
                  </label>
                  <input
                    id="profile-displayname"
                    type="text"
                    value={profileDisplayName}
                    onChange={(e) => setProfileDisplayName(e.target.value)}
                    placeholder="Opsional"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                  {fieldErrors.displayName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.displayName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-phone"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Nomor WhatsApp (Privat)
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                  {fieldErrors.phoneRaw && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.phoneRaw}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="profile-address-rw"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Alamat / RW
                  </label>
                  <input
                    id="profile-address-rw"
                    type="text"
                    value={profileAddressRw}
                    onChange={(e) => setProfileAddressRw(e.target.value)}
                    placeholder="Contoh: Jl. Kemang RW 03, Jaticempaka"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                  {fieldErrors.addressRw && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.addressRw}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-[#1E2D4A]">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Status profil dilindungi RLS & trigger audit otomatis.
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div
              role="tablist"
              aria-label="Pilih mode autentikasi"
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-[#1E2D4A] dark:bg-[#0B1220]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'signin'}
                onClick={() => {
                  setTab('signin');
                  setFieldErrors({});
                  setFeedback(null);
                }}
                className={`min-h-9 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'signin'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'signup'}
                onClick={() => {
                  setTab('signup');
                  setFieldErrors({});
                  setFeedback(null);
                }}
                className={`min-h-9 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'signup'
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Daftar Akun
              </button>
            </div>

            {tab === 'signin' ? (
              <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Email
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Kata Sandi
                  </label>
                  <input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !supabaseReady}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {submitting
                    ? 'Memproses...'
                    : supabaseReady
                      ? 'Masuk ke Akun'
                      : 'Aktifkan Supabase di Secrets untuk Masuk'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Nama lengkap sesuai identitas"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                    />
                    {fieldErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-address-rw"
                      className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      Alamat / RW
                    </label>
                    <input
                      id="signup-address-rw"
                      type="text"
                      value={registerAddressRw}
                      onChange={(e) => setRegisterAddressRw(e.target.value)}
                      placeholder="Contoh: Jl. Kemang RW 03, Jaticempaka"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                    />
                    {fieldErrors.addressRw && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.addressRw}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      Email
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      Kata Sandi
                    </label>
                    <input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                    />
                    {fieldErrors.password && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !supabaseReady}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  {submitting
                    ? 'Mendaftarkan...'
                    : supabaseReady
                      ? 'Buat Akun Baru'
                      : 'Aktifkan Supabase di Secrets untuk Daftar'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
