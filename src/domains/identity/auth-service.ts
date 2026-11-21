import { getSupabaseClient } from '../../lib/supabase/client.ts';
import {
  ProfileStatus,
  type AuthSessionSnapshot,
  type SignInInput,
  type SignUpInput,
  type UpdateProfileInput,
  type UserProfile,
} from './types.ts';
import {
  validateProfileUpdateInput,
  validateSignInInput,
  validateSignUpInput,
} from './validation.ts';

interface DbProfileRow {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  phone_e164: string | null;
  address_rw: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapProfileRow(row: DbProfileRow): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    phoneE164: row.phone_e164,
    addressRw: row.address_rw,
    status:
      row.status === ProfileStatus.Suspended
        ? ProfileStatus.Suspended
        : ProfileStatus.Active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AuthActionResponse<T = void> {
  ok: boolean;
  data?: T;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function fetchCurrentSessionSnapshot(): Promise<AuthSessionSnapshot | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError || !session?.user) {
    return null;
  }

  const { data: profileRow, error: profileError } = await client
    .from('profiles')
    .select(
      'id, full_name, display_name, avatar_url, phone_e164, address_rw, status, created_at, updated_at',
    )
    .eq('id', session.user.id)
    .maybeSingle<DbProfileRow>();

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    profile: !profileError && profileRow ? mapProfileRow(profileRow) : null,
  };
}

export async function signUpWithEmail(
  input: SignUpInput,
): Promise<AuthActionResponse<{ needsEmailConfirmation: boolean }>> {
  const validation = validateSignUpInput(input);
  if (!validation.ok || !validation.data) {
    return {
      ok: false,
      fieldErrors: validation.fieldErrors,
      message: 'Periksa kembali kolom pendaftaran yang ditandai.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: 'Koneksi Supabase belum dikonfigurasi pada environment.',
    };
  }

  const { data, error } = await client.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        full_name: validation.data.fullName,
        address_rw: validation.data.addressRw,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  const needsEmailConfirmation = !data.session;
  return {
    ok: true,
    data: { needsEmailConfirmation },
    message: needsEmailConfirmation
      ? 'Akun berhasil dibuat. Periksa email Anda untuk konfirmasi sebelum masuk.'
      : 'Pendaftaran berhasil dan sesi Anda sudah aktif.',
  };
}

export async function signInWithEmail(
  input: SignInInput,
): Promise<AuthActionResponse<AuthSessionSnapshot>> {
  const validation = validateSignInInput(input);
  if (!validation.ok || !validation.data) {
    return {
      ok: false,
      fieldErrors: validation.fieldErrors,
      message: 'Periksa email dan kata sandi Anda.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: 'Koneksi Supabase belum dikonfigurasi pada environment.',
    };
  }

  const { error } = await client.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return {
      ok: false,
      message: 'Email atau kata sandi belum cocok. Periksa kembali lalu coba lagi.',
    };
  }

  const snapshot = await fetchCurrentSessionSnapshot();
  if (!snapshot) {
    return {
      ok: false,
      message: 'Berhasil masuk, tetapi sesi belum terbaca. Muat ulang halaman.',
    };
  }

  return {
    ok: true,
    data: snapshot,
    message: 'Berhasil masuk ke akun Anda.',
  };
}

export async function updateMyProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<AuthActionResponse<UserProfile>> {
  const validation = validateProfileUpdateInput(input);
  if (!validation.ok || !validation.data) {
    return {
      ok: false,
      fieldErrors: validation.fieldErrors,
      message: 'Periksa kembali isian profil yang ditandai.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: 'Koneksi Supabase belum dikonfigurasi.',
    };
  }

  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: validation.data.fullName,
      display_name: validation.data.displayName,
      phone_e164: validation.data.phoneE164,
      address_rw: validation.data.addressRw,
    })
    .eq('id', userId)
    .select(
      'id, full_name, display_name, avatar_url, phone_e164, address_rw, status, created_at, updated_at',
    )
    .single<DbProfileRow>();

  if (error || !data) {
    return {
      ok: false,
      message:
        error?.message ??
        'Gagal memperbarui profil. Pastikan migration M1 dan RLS sudah dijalankan.',
    };
  }

  return {
    ok: true,
    data: mapProfileRow(data),
    message: 'Profil berhasil diperbarui dan tercatat pada audit log.',
  };
}

export async function signOutCurrentUser(): Promise<AuthActionResponse> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: true };
  }
  const { error } = await client.auth.signOut();
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, message: 'Anda telah keluar dari sesi.' };
}
