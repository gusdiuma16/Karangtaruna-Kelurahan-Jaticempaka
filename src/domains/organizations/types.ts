export enum OrganizationLevel {
  Kelurahan = 'kelurahan',
  Unit = 'unit',
  SubUnit = 'sub_unit',
}

export enum OrganizationStatus {
  Pending = 'pending',
  Active = 'active',
  Suspended = 'suspended',
  Archived = 'archived',
}

export enum OrgWhatsappRoutingMode {
  OrgPic = 'org_pic',
  CentralGateway = 'central_gateway',
}

export interface OrganizationWhatsappContact {
  picName: string | null;
  picPosition: string | null;
  whatsappE164: string | null;
  routingMode: OrgWhatsappRoutingMode;
}

export interface OrganizationEntity {
  id: string;
  ecosystemId: string;
  parentOrganizationId: string | null;
  level: OrganizationLevel;
  name: string;
  slug: string;
  status: OrganizationStatus;
  areaLabel: string | null;
  whatsappContact: OrganizationWhatsappContact;
}

export const ALLOWED_ORGANIZATION_LEVELS: readonly OrganizationLevel[] = [
  OrganizationLevel.Kelurahan,
  OrganizationLevel.Unit,
  OrganizationLevel.SubUnit,
];

export function isAllowedOrganizationLevel(value: string): value is OrganizationLevel {
  return ALLOWED_ORGANIZATION_LEVELS.includes(value as OrganizationLevel);
}
