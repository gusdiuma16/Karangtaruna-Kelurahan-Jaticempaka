import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';

import { AuthAccountPanel } from './components/auth/AuthAccountPanel.tsx';
import {
  MembershipApplicationType,
  resolveMembershipConfirmationTarget,
} from './domains/memberships/whatsapp-routing.ts';
import { JATICEMPAKA_INITIAL_ORGANIZATIONS } from './domains/organizations/jaticempaka-catalog.ts';
import { loadActiveEcosystemCatalog } from './domains/organizations/organization-service.ts';
import {
  OrganizationLevel,
  OrgWhatsappRoutingMode,
  type OrganizationEntity,
} from './domains/organizations/types.ts';
import {
  OrganizationPositionTitle,
  SYSTEM_ROLE_DEFAULT_PERMISSIONS,
  SystemRoleCode,
} from './domains/permissions/catalog.ts';
import {
  JATICEMPAKA_ECOSYSTEM_DEFAULT,
  WhatsappRoutingPolicy,
  type EcosystemConfig,
} from './domains/platform/types.ts';
import type { ThemeMode } from './lib/theme/tokens.ts';

const LEVEL_LABELS: Record<OrganizationLevel, string> = {
  [OrganizationLevel.Kelurahan]: 'Kelurahan',
  [OrganizationLevel.Unit]: 'Unit',
  [OrganizationLevel.SubUnit]: 'Sub Unit',
};

const ROLE_LABELS: Record<SystemRoleCode, string> = {
  [SystemRoleCode.OrganizationAdmin]: 'Organization Admin',
  [SystemRoleCode.MembershipManager]: 'Membership Manager',
  [SystemRoleCode.ContentEditor]: 'Content Editor',
  [SystemRoleCode.EventManager]: 'Event Manager',
  [SystemRoleCode.Member]: 'Member',
};

const M0_CHECKLIST_ITEMS = [
  'Identitas ekosistem & metadata disetel khusus untuk Karang Taruna Kelurahan Jaticempaka beserta Unit dan Sub Unit.',
  'Batasan domain ditegakkan: tidak ada modul administrasi pemerintahan RT, RW, atau Kelurahan.',
  'Design system dual-theme terkonfigurasi: Light mode dominan putih dan Dark mode navy doff.',
  'Routing konfirmasi keanggotaan langsung ke WhatsApp pengurus dengan fallback otomatis 1 pintu.',
  'Pemisahan jabatan organisasi dari role sistem dan katalog permission granular per organisasi.',
] as const;

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const stored = window.localStorage.getItem('kt-jtc-theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const [ecosystemConfig, setEcosystemConfig] = useState<EcosystemConfig>(
    JATICEMPAKA_ECOSYSTEM_DEFAULT,
  );
  const [organizations, setOrganizations] = useState<readonly OrganizationEntity[]>(
    JATICEMPAKA_INITIAL_ORGANIZATIONS,
  );
  const [catalogSource, setCatalogSource] = useState<'supabase' | 'local_catalog'>(
    'local_catalog',
  );

  const [levelFilter, setLevelFilter] = useState<'all' | OrganizationLevel>('all');
  const [applicantName, setApplicantName] = useState('Raka Pratama');
  const [applicationType, setApplicationType] = useState<MembershipApplicationType>(
    MembershipApplicationType.Addition,
  );
  const [targetOrgId, setTargetOrgId] = useState(
    JATICEMPAKA_INITIAL_ORGANIZATIONS[1].id,
  );
  const [originOrgId, setOriginOrgId] = useState(
    JATICEMPAKA_INITIAL_ORGANIZATIONS[0].id,
  );
  const [policyOverride, setPolicyOverride] = useState<WhatsappRoutingPolicy>(
    WhatsappRoutingPolicy.OrgPicWithCentralFallback,
  );
  const [centralGatewayInput, setCentralGatewayInput] = useState(
    JATICEMPAKA_ECOSYSTEM_DEFAULT.centralWhatsappE164,
  );
  const [selectedRole, setSelectedRole] = useState<SystemRoleCode>(
    SystemRoleCode.ContentEditor,
  );

  useEffect(() => {
    let active = true;
    loadActiveEcosystemCatalog().then((loaded) => {
      if (!active) {
        return;
      }
      setEcosystemConfig(loaded.ecosystem);
      setOrganizations(loaded.organizations);
      setCatalogSource(loaded.source);
      setCentralGatewayInput(loaded.ecosystem.centralWhatsappE164);
      if (loaded.organizations.length > 0) {
        setTargetOrgId((prev) =>
          loaded.organizations.some((o) => o.id === prev)
            ? prev
            : loaded.organizations[0].id,
        );
        setOriginOrgId((prev) =>
          loaded.organizations.some((o) => o.id === prev)
            ? prev
            : loaded.organizations[0].id,
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('kt-jtc-theme', theme);
    } catch {
      // Ignore storage access restrictions in embedded frames.
    }
  }, [theme]);

  const filteredOrganizations = useMemo(() => {
    if (levelFilter === 'all') {
      return organizations;
    }
    return organizations.filter((org) => org.level === levelFilter);
  }, [levelFilter, organizations]);

  const targetOrganization = useMemo(
    () => organizations.find((org) => org.id === targetOrgId) ?? organizations[0],
    [organizations, targetOrgId],
  );

  const originOrganization = useMemo(
    () => organizations.find((org) => org.id === originOrgId) ?? null,
    [organizations, originOrgId],
  );

  const resolvedWhatsapp = useMemo(
    () =>
      resolveMembershipConfirmationTarget({
        applicantName,
        applicationType,
        targetOrganization,
        originOrganizationName:
          originOrganization && originOrganization.id !== targetOrganization.id
            ? originOrganization.name
            : null,
        ecosystem: {
          ...ecosystemConfig,
          centralWhatsappE164: centralGatewayInput,
        },
        policyOverride,
      }),
    [
      applicantName,
      applicationType,
      targetOrganization,
      originOrganization,
      ecosystemConfig,
      centralGatewayInput,
      policyOverride,
    ],
  );

  const selectedRolePermissions = SYSTEM_ROLE_DEFAULT_PERMISSIONS[selectedRole];

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors duration-200 dark:bg-[#0B1220] dark:text-slate-100">
      {/* Zone 1 - 2 - 3 Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-[#1E2D4A] dark:bg-[#0B1220]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-4 sm:px-6">
          <a
            href="#beranda"
            className="shrink-0 whitespace-nowrap font-display text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg"
          >
            Karang Taruna Jaticempaka
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex"
          >
            <a
              href="#struktur"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-700 hover:underline hover:underline-offset-4 dark:hover:text-blue-400"
            >
              Struktur
            </a>
            <a
              href="#konfirmasi-wa"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-700 hover:underline hover:underline-offset-4 dark:hover:text-blue-400"
            >
              Konfirmasi WA
            </a>
            <a
              href="#keamanan"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-700 hover:underline hover:underline-offset-4 dark:hover:text-blue-400"
            >
              Keamanan
            </a>
            <a
              href="#akun"
              className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-700 hover:underline hover:underline-offset-4 dark:hover:text-blue-400"
            >
              Akun
            </a>
          </nav>

          <div className="flex shrink-0 items-center">
            <a
              href="#akun"
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Masuk / Daftar
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main id="beranda">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-[#1E2D4A]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-50/70 via-orange-50/30 to-transparent dark:from-blue-950/35 dark:via-slate-900/10 dark:to-transparent"
          />

          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
            <div className="grid items-stretch gap-10 lg:grid-cols-12">
              <div className="flex flex-col justify-between lg:col-span-7">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-400">
                    M0–M1 Foundation · Karang Taruna Kelurahan Jaticempaka
                  </p>
                  <h1 className="mt-3 max-w-2xl text-balance font-display text-[clamp(2.15rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
                    Ekosistem Digital Multi-Organisasi Karang Taruna Jaticempaka
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Dirancang khusus untuk mengelola Karang Taruna Kelurahan Jaticempaka beserta
                    Unit dan Sub Unit di dalamnya—dengan isolasi data per organisasi, keanggotaan
                    lintas unit tanpa pewarisan otomatis, serta konfirmasi keanggotaan langsung
                    melalui WhatsApp pengurus atau layanan 1 pintu.
                  </p>
                </div>

                {/* Hero Toolbar: Primary CTA + Theme Switcher */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#konfirmasi-wa"
                    className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Simulasi Konfirmasi WhatsApp
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                    aria-pressed={theme === 'dark'}
                    className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-[#1E2D4A] dark:bg-[#111C30] dark:text-slate-200 dark:hover:bg-[#16233B]"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="h-4 w-4 text-blue-700" aria-hidden="true" />
                        Aktifkan Navy Doff
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4 text-orange-400" aria-hidden="true" />
                        Aktifkan Mode Terang
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Architectural Summary Card (Single Elevation) */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/85 p-6 backdrop-blur-sm dark:border-[#1E2D4A] dark:bg-[#111C30]/90 lg:col-span-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    Keputusan Fondasi Aktif
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Ringkasan keputusan arsitektur sebelum masuk ke pembangunan database M1.
                  </p>

                  <dl className="mt-6 space-y-4 border-t border-slate-200 pt-5 text-sm dark:border-[#1E2D4A]">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Lingkup Tenant</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                        Kelurahan · Unit · Sub Unit Jaticempaka
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Batas Domain</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                        Tanpa birokrasi / pengurus RT & RW
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Konfirmasi Anggota</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                        WhatsApp Pengurus / Fallback 1 Pintu
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Notifikasi In-App</dt>
                      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                        Ditiadakan sesuai arahan produk
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-[#1E2D4A] dark:text-slate-400">
                  Aksen identitas Karang Taruna ·{' '}
                  <span className="font-medium text-blue-700 dark:text-blue-400">Biru</span> ·{' '}
                  <span className="font-medium text-orange-600 dark:text-orange-400">Oranye</span> ·{' '}
                  <span className="font-medium text-red-600 dark:text-red-400">Merah</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: Multi-Organization Scope */}
        <section
          id="struktur"
          className="border-b border-slate-200 bg-slate-50/50 dark:border-[#1E2D4A] dark:bg-[#0D1628]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  01. Struktur Organisasi Karang Taruna Jaticempaka
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Setiap organisasi mempunyai ruang data, pengurus, anggota, dan konfigurasi
                  WhatsApp sendiri. Sumber data saat ini:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {catalogSource === 'supabase'
                      ? 'Supabase PostgreSQL (Live)'
                      : 'Katalog Referensi Lokal'}
                  </span>
                  .
                </p>
              </div>

              <div
                role="group"
                aria-label="Filter tingkat organisasi"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-[#1E2D4A] dark:bg-[#111C30]"
              >
                {(
                  [
                    ['all', 'Semua'],
                    [OrganizationLevel.Kelurahan, 'Kelurahan'],
                    [OrganizationLevel.Unit, 'Unit'],
                    [OrganizationLevel.SubUnit, 'Sub Unit'],
                  ] as const
                ).map(([value, label]) => {
                  const active = levelFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLevelFilter(value)}
                      className={`min-h-9 shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {filteredOrganizations.map((org) => {
                const hasOrgWhatsapp = Boolean(org.whatsappContact.whatsappE164);
                const routingText =
                  org.whatsappContact.routingMode === OrgWhatsappRoutingMode.CentralGateway
                    ? 'Dialihkan ke 1 Pintu Ekosistem'
                    : hasOrgWhatsapp
                      ? 'WhatsApp Pengurus Aktif'
                      : 'Nomor Pengurus Kosong · Fallback 1 Pintu';

                return (
                  <article
                    key={org.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2D4A] dark:bg-[#111C30]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          {LEVEL_LABELS[org.level]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{org.slug}</span>
                      </div>

                      <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                        {org.name}
                      </h3>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-600 dark:border-[#1E2D4A] dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        Routing Konfirmasi:
                      </span>{' '}
                      {routingText}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 02: Interactive WhatsApp Routing Simulator */}
        <section
          id="konfirmasi-wa"
          className="border-b border-slate-200 bg-white dark:border-[#1E2D4A] dark:bg-[#0B1220]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                02. Routing Konfirmasi Keanggotaan via WhatsApp
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Uji perilaku resolver konfirmasi: sistem mengarahkan pemohon ke nomor WhatsApp
                pengurus organisasi tujuan jika tersedia, atau otomatis beralih ke nomor 1 pintu
                apabila nomor pengurus belum diisi atau kebijakan 1 pintu dipilih.
              </p>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-12">
              {/* Controls */}
              <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-[#1E2D4A] dark:bg-[#111C30] lg:col-span-6">
                <div>
                  <label
                    htmlFor="applicant-name"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Nama Pemohon
                  </label>
                  <input
                    id="applicant-name"
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Masukkan nama pemohon"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    Jenis Permohonan Keanggotaan
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setApplicationType(MembershipApplicationType.Addition)}
                      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        applicationType === MembershipApplicationType.Addition
                          ? 'border-blue-700 bg-blue-700 text-white dark:border-blue-500 dark:bg-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-200'
                      }`}
                    >
                      Penambahan Anggota
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplicationType(MembershipApplicationType.Transfer)}
                      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        applicationType === MembershipApplicationType.Transfer
                          ? 'border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-200'
                      }`}
                    >
                      Perpindahan (Transfer)
                    </button>
                  </div>
                </div>

                {applicationType === MembershipApplicationType.Transfer && (
                  <div>
                    <label
                      htmlFor="origin-org"
                      className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                    >
                      Organisasi Asal
                    </label>
                    <select
                      id="origin-org"
                      value={originOrgId}
                      onChange={(e) => setOriginOrgId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="target-org"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Organisasi Tujuan
                  </label>
                  <select
                    id="target-org"
                    value={targetOrgId}
                    onChange={(e) => setTargetOrgId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}{' '}
                        {org.whatsappContact.whatsappE164 ? '' : '(Belum ada nomor pengurus)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    Kebijakan Routing Ekosistem
                  </span>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPolicyOverride(WhatsappRoutingPolicy.OrgPicWithCentralFallback)
                      }
                      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        policyOverride === WhatsappRoutingPolicy.OrgPicWithCentralFallback
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-blue-500 dark:bg-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-200'
                      }`}
                    >
                      Pengurus Org (Fallback 1 Pintu)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPolicyOverride(WhatsappRoutingPolicy.CentralGatewayOnly)
                      }
                      className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        policyOverride === WhatsappRoutingPolicy.CentralGatewayOnly
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-blue-500 dark:bg-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-200'
                      }`}
                    >
                      Selalu 1 Pintu Pusat
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="central-wa"
                    className="block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Nomor WhatsApp 1 Pintu Ekosistem (Fallback)
                  </label>
                  <input
                    id="central-wa"
                    type="text"
                    value={centralGatewayInput}
                    onChange={(e) => setCentralGatewayInput(e.target.value)}
                    placeholder="Contoh: 081200000000 atau 6281200000000"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 outline-none transition focus:border-blue-600 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Resolved Output */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2D4A] dark:bg-[#111C30] lg:col-span-6">
                <div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-[#1E2D4A]">
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Hasil Resolusi Tujuan Konfirmasi
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-white">
                        {resolvedWhatsapp.targetLabel}
                      </h3>
                    </div>
                    <MessageCircle
                      className="h-6 w-6 shrink-0 text-blue-700 dark:text-blue-400"
                      aria-hidden="true"
                    />
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Sumber Rute</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">
                        {resolvedWhatsapp.source === 'organization_pic'
                          ? 'Pengurus Organisasi Tujuan'
                          : resolvedWhatsapp.source === 'central_gateway_fallback'
                            ? 'Fallback Otomatis 1 Pintu'
                            : 'Mode 1 Pintu Pusat'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Jabatan / PIC</dt>
                      <dd className="font-medium text-slate-900 dark:text-slate-100">
                        {resolvedWhatsapp.targetPosition ?? 'Admin Konfirmasi'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Nomor E.164</dt>
                      <dd className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        +{resolvedWhatsapp.targetPhoneDigits}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Pratinjau Pesan WhatsApp
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-sans text-xs leading-relaxed text-slate-700 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-200">
                      {resolvedWhatsapp.messagePreview}
                    </pre>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-[#1E2D4A]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Approval resmi tetap diproses di dashboard organisasi tujuan.
                  </p>
                  <a
                    href={resolvedWhatsapp.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Buka Tautan WhatsApp
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 03: M1 Auth & Profile Workspace */}
        <section
          id="akun"
          className="border-b border-slate-200 bg-slate-50/50 dark:border-[#1E2D4A] dark:bg-[#0D1628]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="mb-8 max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                03. Autentikasi & Profil Pengguna (M1)
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Pendaftaran akun, masuk sesi, dan pengelolaan profil dasar terhubung dengan
                Supabase Auth serta tabel <span className="font-mono text-xs">profiles</span> yang
                dilindungi RLS.
              </p>
            </div>

            <AuthAccountPanel />
          </div>
        </section>

        {/* Section 04: RBAC Separation & Security Baseline */}
        <section
          id="keamanan"
          className="border-b border-slate-200 bg-white dark:border-[#1E2D4A] dark:bg-[#0B1220]"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  04. Pemisahan Jabatan Organisasi & Role Permission
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Jabatan struktural Karang Taruna ({Object.values(OrganizationPositionTitle).join(', ')})
                  tidak otomatis memberi akses teknis penuh. Permission diberikan secara eksplisit
                  per organisasi melalui role sistem.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                RLS Deny by Default · Scoped by organization_id
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-[#1E2D4A] dark:bg-[#111C30]">
              <div
                role="tablist"
                aria-label="Pilih role sistem"
                className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-[#1E2D4A]"
              >
                {Object.values(SystemRoleCode).map((role) => {
                  const active = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedRole(role)}
                      className={`min-h-10 shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-300'
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Permission aktif untuk {ROLE_LABELS[selectedRole]} ({selectedRolePermissions.length}{' '}
                  izin terikat organisasi)
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedRolePermissions.map((permission) => (
                    <li
                      key={permission}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 dark:border-[#1E2D4A] dark:bg-[#0B1220] dark:text-slate-200"
                    >
                      <span>{permission}</span>
                      <Check
                        className="h-3.5 w-3.5 shrink-0 text-blue-700 dark:text-blue-400"
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 05: Milestone M0-M1 Acceptance & Next M2 */}
        <section id="milestone" className="bg-slate-50/50 dark:bg-[#0D1628]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  05. Status Milestone M0–M1
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Fondasi produk (M0) serta schema database awal, RLS, dan modul autentikasi (M1)
                  sudah siap sebelum pembangunan onboarding multi-organisasi pada M2.
                </p>

                <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:divide-[#1E2D4A] dark:border-[#1E2D4A]">
                  {M0_CHECKLIST_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 py-3.5 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-400"
                        aria-hidden="true"
                      />
                      <span className="text-slate-700 dark:text-slate-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-[#1E2D4A] dark:bg-[#111C30] lg:col-span-5">
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                  Tahap Berikutnya: M2 — Organization Core
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  M2 akan menambahkan manajemen profil organisasi, onboarding pendaftaran publik
                  maupun undangan resmi, serta pengaturan nomor WhatsApp pengurus per organisasi
                  yang tersimpan di database.
                </p>
                <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500 dark:border-[#1E2D4A] dark:text-slate-400">
                  Migration M1 tersedia di{' '}
                  <span className="font-mono">supabase/migrations/0001_m1_foundation_auth.sql</span>{' '}
                  dan seed awal di <span className="font-mono">supabase/seed.sql</span>.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-[#1E2D4A] dark:bg-[#0B1220]">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-4 py-8 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:px-6">
          <span>
            Karang Taruna Kelurahan Jaticempaka Digital Ecosystem · Khusus Ekosistem Karang Taruna
          </span>
          <span>M0–M1 Foundation · Database & Auth</span>
        </div>
      </footer>
    </div>
  );
}
