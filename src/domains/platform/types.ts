export enum PlatformRoleCode {
  PlatformSuperAdmin = 'platform_super_admin',
  PlatformSupport = 'platform_support',
}

export enum WhatsappRoutingPolicy {
  OrgPicWithCentralFallback = 'org_pic_with_central_fallback',
  CentralGatewayOnly = 'central_gateway_only',
}

export interface EcosystemConfig {
  id: string;
  slug: string;
  name: string;
  centralWhatsappE164: string;
  centralWhatsappLabel: string;
  defaultWhatsappPolicy: WhatsappRoutingPolicy;
}

export const JATICEMPAKA_ECOSYSTEM_DEFAULT: EcosystemConfig = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'karang-taruna-jaticempaka',
  name: 'Karang Taruna Kelurahan Jaticempaka',
  centralWhatsappE164: '6281200000000',
  centralWhatsappLabel: 'Sekretariat 1 Pintu Karang Taruna Jaticempaka',
  defaultWhatsappPolicy: WhatsappRoutingPolicy.OrgPicWithCentralFallback,
};
