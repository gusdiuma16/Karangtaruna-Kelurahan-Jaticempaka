import { normalizeWhatsappDigits } from '../memberships/whatsapp-routing.ts';
import type {
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from './types.ts';

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  fieldErrors: Record<string, string>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignUpInput(input: SignUpInput): ValidationResult<SignUpInput> {
  const fieldErrors: Record<string, string> = {};
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const addressRw = input.addressRw.trim();

  if (fullName.length < 3) {
    fieldErrors.fullName = 'Masukkan nama lengkap minimal 3 karakter.';
  }
  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'Gunakan format email yang valid, misalnya nama@domain.com.';
  }
  if (password.length < 8) {
    fieldErrors.password = 'Kata sandi minimal 8 karakter agar akun tetap aman.';
  }
  if (addressRw.length < 4) {
    fieldErrors.addressRw =
      'Masukkan alamat dan RW Anda (contoh: Jl. Kemang RW 03).';
  } else if (addressRw.length > 200) {
    fieldErrors.addressRw = 'Alamat / RW maksimal 200 karakter.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    fieldErrors: {},
    data: {
      fullName,
      email,
      password,
      addressRw,
    },
  };
}

export function validateSignInInput(input: SignInInput): ValidationResult<SignInInput> {
  const fieldErrors: Record<string, string> = {};
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'Masukkan alamat email yang valid untuk masuk.';
  }
  if (password.length === 0) {
    fieldErrors.password = 'Masukkan kata sandi Anda.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    fieldErrors: {},
    data: { email, password },
  };
}

export interface SanitizedProfileUpdate {
  fullName: string;
  displayName: string | null;
  phoneE164: string | null;
  addressRw: string;
}

export function validateProfileUpdateInput(
  input: UpdateProfileInput,
): ValidationResult<SanitizedProfileUpdate> {
  const fieldErrors: Record<string, string> = {};
  const fullName = input.fullName.trim();
  const displayName = input.displayName.trim();
  const phoneRaw = input.phoneRaw.trim();
  const addressRw = input.addressRw.trim();

  if (fullName.length < 3) {
    fieldErrors.fullName = 'Nama lengkap minimal 3 karakter.';
  }
  if (displayName.length > 60) {
    fieldErrors.displayName = 'Nama panggilan maksimal 60 karakter.';
  }

  let phoneE164: string | null = null;
  if (phoneRaw.length > 0) {
    phoneE164 = normalizeWhatsappDigits(phoneRaw);
    if (!phoneE164) {
      fieldErrors.phoneRaw =
        'Gunakan nomor WhatsApp/ponsel Indonesia yang valid (contoh: 081234567890).';
    }
  }

  if (addressRw.length < 4) {
    fieldErrors.addressRw =
      'Masukkan alamat dan RW Anda (contoh: Jl. Kemang RW 03).';
  } else if (addressRw.length > 200) {
    fieldErrors.addressRw = 'Alamat / RW maksimal 200 karakter.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    fieldErrors: {},
    data: {
      fullName,
      displayName: displayName || null,
      phoneE164,
      addressRw,
    },
  };
}
