import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  validateProfileUpdateInput,
  validateSignInInput,
  validateSignUpInput,
} from '../src/domains/identity/validation.ts';
import { isValidSupabasePublicEnv } from '../src/lib/supabase/env.ts';

test('Supabase public env validator rejects placeholder and malformed values', () => {
  assert.equal(
    isValidSupabasePublicEnv(
      'https://YOUR_PROJECT_REF.supabase.co',
      'YOUR_SUPABASE_ANON_KEY',
    ),
    false,
  );
  assert.equal(isValidSupabasePublicEnv('not-a-url', 'valid-length-key-1234567890'), false);
  assert.equal(isValidSupabasePublicEnv(undefined, undefined), false);
  assert.equal(
    isValidSupabasePublicEnv(
      'https://abcdefghijk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample.signature',
    ),
    true,
  );
});

test('Sign-up validation enforces full name, valid email, 8+ char password, and addressRw', () => {
  const invalid = validateSignUpInput({
    fullName: 'Al',
    email: 'bukan-email',
    password: '123',
    addressRw: 'RW',
  });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.fieldErrors.fullName);
  assert.ok(invalid.fieldErrors.email);
  assert.ok(invalid.fieldErrors.password);
  assert.ok(invalid.fieldErrors.addressRw);

  const valid = validateSignUpInput({
    fullName: '  Dimas Prakoso  ',
    email: 'DIMAS@Example.COM ',
    password: 'PasswordKuat123',
    addressRw: ' Jl. Kemang RW 03, Jaticempaka ',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data?.fullName, 'Dimas Prakoso');
  assert.equal(valid.data?.email, 'dimas@example.com');
  assert.equal(valid.data?.addressRw, 'Jl. Kemang RW 03, Jaticempaka');
});

test('Sign-in validation checks email and non-empty password', () => {
  const invalid = validateSignInInput({ email: 'salah', password: '' });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.fieldErrors.email);
  assert.ok(invalid.fieldErrors.password);

  const valid = validateSignInInput({ email: 'anggota@jaticempaka.id', password: 'secret' });
  assert.equal(valid.ok, true);
});

test('Profile update validation normalizes WhatsApp phone and validates addressRw', () => {
  const invalidPhone = validateProfileUpdateInput({
    fullName: 'Nadia Putri',
    displayName: 'Nadia',
    phoneRaw: '123',
    addressRw: 'Jl. Kemang RW 02',
  });
  assert.equal(invalidPhone.ok, false);
  assert.ok(invalidPhone.fieldErrors.phoneRaw);

  const valid = validateProfileUpdateInput({
    fullName: 'Nadia Putri',
    displayName: '',
    phoneRaw: '0812-9988-7766',
    addressRw: 'Jl. Kemang RW 02',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.data?.phoneE164, '6281299887766');
  assert.equal(valid.data?.displayName, null);
  assert.equal(valid.data?.addressRw, 'Jl. Kemang RW 02');
});

test('M1 SQL migration enforces RLS on all tables, uses address_rw, and omits notifications', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/0001_m1_foundation_auth.sql',
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const requiredTables = [
    'public.ecosystems',
    'public.organizations',
    'public.profiles',
    'public.platform_role_assignments',
    'public.audit_logs',
  ];

  for (const table of requiredTables) {
    assert.ok(
      sql.includes(`alter table ${table} enable row level security`),
      `Missing RLS enable on ${table}`,
    );
    assert.ok(
      sql.includes(`alter table ${table} force row level security`),
      `Missing FORCE RLS on ${table}`,
    );
  }

  assert.equal(/\bcreate table[^;]*notifications\b/i.test(sql), false);
  assert.equal(/\bpengurus_rt\b|\bpengurus_rw\b|\bpelayanan_warga\b/i.test(sql), false);
  assert.ok(sql.includes('address_rw text'));
  assert.equal(sql.includes('domicile_context'), false);
  assert.ok(sql.includes('on_auth_user_created'));
  assert.ok(sql.includes('guard_and_audit_profile_update'));
});
