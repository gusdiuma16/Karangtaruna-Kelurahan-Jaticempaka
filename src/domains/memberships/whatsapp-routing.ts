import {
  OrgWhatsappRoutingMode,
  type OrganizationEntity,
} from '../organizations/types.ts';
import {
  WhatsappRoutingPolicy,
  type EcosystemConfig,
} from '../platform/types.ts';

export enum MembershipApplicationType {
  Addition = 'addition',
  Transfer = 'transfer',
}

export interface WhatsappConfirmationInput {
  applicantName: string;
  applicationType: MembershipApplicationType;
  targetOrganization: OrganizationEntity;
  originOrganizationName?: string | null;
  ecosystem: EcosystemConfig;
  policyOverride?: WhatsappRoutingPolicy;
}

export type WhatsappTargetSource = 'organization_pic' | 'central_gateway_fallback' | 'central_gateway_forced';

export interface ResolvedWhatsappConfirmation {
  targetPhoneDigits: string;
  targetLabel: string;
  targetPosition: string | null;
  source: WhatsappTargetSource;
  messagePreview: string;
  whatsappUrl: string;
}

export function normalizeWhatsappDigits(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) {
    return null;
  }
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    return null;
  }
  if (digitsOnly.startsWith('0')) {
    return `62${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.startsWith('8')) {
    return `62${digitsOnly}`;
  }
  return digitsOnly;
}

export function resolveMembershipConfirmationTarget(
  input: WhatsappConfirmationInput,
): ResolvedWhatsappConfirmation {
  const effectivePolicy =
    input.policyOverride ?? input.ecosystem.defaultWhatsappPolicy;
  const orgContact = input.targetOrganization.whatsappContact;
  const normalizedOrgDigits = normalizeWhatsappDigits(orgContact.whatsappE164);
  const normalizedCentralDigits =
    normalizeWhatsappDigits(input.ecosystem.centralWhatsappE164) ?? '6281200000000';

  const shouldUseOrgPic =
    effectivePolicy === WhatsappRoutingPolicy.OrgPicWithCentralFallback &&
    orgContact.routingMode === OrgWhatsappRoutingMode.OrgPic &&
    normalizedOrgDigits !== null;

  const targetPhoneDigits = shouldUseOrgPic
    ? normalizedOrgDigits
    : normalizedCentralDigits;

  let source: WhatsappTargetSource = 'central_gateway_fallback';
  if (shouldUseOrgPic) {
    source = 'organization_pic';
  } else if (
    effectivePolicy === WhatsappRoutingPolicy.CentralGatewayOnly ||
    orgContact.routingMode === OrgWhatsappRoutingMode.CentralGateway
  ) {
    source = 'central_gateway_forced';
  }

  const targetLabel = shouldUseOrgPic
    ? orgContact.picName?.trim() || `Pengurus ${input.targetOrganization.name}`
    : input.ecosystem.centralWhatsappLabel;

  const targetPosition = shouldUseOrgPic ? orgContact.picPosition : 'Admin 1 Pintu Ekosistem';

  const safeApplicant = input.applicantName.trim() || 'Calon Anggota';
  const actionLabel =
    input.applicationType === MembershipApplicationType.Transfer
      ? 'Perpindahan (Transfer) Keanggotaan'
      : 'Penambahan Keanggotaan Baru';

  const originLine =
    input.applicationType === MembershipApplicationType.Transfer && input.originOrganizationName
      ? `\nOrganisasi Asal: ${input.originOrganizationName}`
      : '';

  const messagePreview = [
    `Halo ${targetLabel},`,
    `Saya ${safeApplicant} ingin melakukan konfirmasi permohonan keanggotaan Karang Taruna.`,
    `Jenis Permohonan: ${actionLabel}`,
    `Organisasi Tujuan: ${input.targetOrganization.name}${originLine}`,
    `Mohon arahan untuk proses verifikasi dan persetujuan pada dashboard organisasi. Terima kasih.`,
  ].join('\n');

  const whatsappUrl = `https://wa.me/${targetPhoneDigits}?text=${encodeURIComponent(
    messagePreview,
  )}`;

  return {
    targetPhoneDigits,
    targetLabel,
    targetPosition,
    source,
    messagePreview,
    whatsappUrl,
  };
}
