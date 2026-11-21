import { getSupabaseClient } from '../../lib/supabase/client.ts';
import {
  JATICEMPAKA_ECOSYSTEM_DEFAULT,
  WhatsappRoutingPolicy,
  type EcosystemConfig,
} from '../platform/types.ts';
import { JATICEMPAKA_INITIAL_ORGANIZATIONS } from './jaticempaka-catalog.ts';
import {
  OrganizationLevel,
  OrganizationStatus,
  OrgWhatsappRoutingMode,
  type OrganizationEntity,
} from './types.ts';

interface DbEcosystemRow {
  id: string;
  slug: string;
  name: string;
  central_whatsapp_e164: string | null;
  central_whatsapp_label: string;
}

interface DbOrganizationRow {
  id: string;
  ecosystem_id: string;
  parent_organization_id: string | null;
  org_level: string;
  name: string;
  slug: string;
  status: string;
  area_label: string | null;
  whatsapp_pic_name: string | null;
  whatsapp_pic_position: string | null;
  whatsapp_e164: string | null;
  whatsapp_routing_mode: string;
}

export interface LoadedEcosystemCatalog {
  ecosystem: EcosystemConfig;
  organizations: readonly OrganizationEntity[];
  source: 'supabase' | 'local_catalog';
}

export async function loadActiveEcosystemCatalog(): Promise<LoadedEcosystemCatalog> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ecosystem: JATICEMPAKA_ECOSYSTEM_DEFAULT,
      organizations: JATICEMPAKA_INITIAL_ORGANIZATIONS,
      source: 'local_catalog',
    };
  }

  const [{ data: ecoRow, error: ecoError }, { data: orgRows, error: orgError }] =
    await Promise.all([
      client
        .from('ecosystems')
        .select('id, slug, name, central_whatsapp_e164, central_whatsapp_label')
        .eq('slug', JATICEMPAKA_ECOSYSTEM_DEFAULT.slug)
        .eq('status', 'active')
        .maybeSingle<DbEcosystemRow>(),
      client
        .from('organizations')
        .select(
          'id, ecosystem_id, parent_organization_id, org_level, name, slug, status, area_label, whatsapp_pic_name, whatsapp_pic_position, whatsapp_e164, whatsapp_routing_mode',
        )
        .eq('status', 'active')
        .order('org_level', { ascending: true })
        .order('name', { ascending: true })
        .returns<DbOrganizationRow[]>(),
    ]);

  if (ecoError || orgError || !ecoRow || !orgRows || orgRows.length === 0) {
    return {
      ecosystem: JATICEMPAKA_ECOSYSTEM_DEFAULT,
      organizations: JATICEMPAKA_INITIAL_ORGANIZATIONS,
      source: 'local_catalog',
    };
  }

  return {
    ecosystem: {
      id: ecoRow.id,
      slug: ecoRow.slug,
      name: ecoRow.name,
      centralWhatsappE164:
        ecoRow.central_whatsapp_e164 ?? JATICEMPAKA_ECOSYSTEM_DEFAULT.centralWhatsappE164,
      centralWhatsappLabel: ecoRow.central_whatsapp_label,
      defaultWhatsappPolicy: WhatsappRoutingPolicy.OrgPicWithCentralFallback,
    },
    organizations: orgRows.map((row) => ({
      id: row.id,
      ecosystemId: row.ecosystem_id,
      parentOrganizationId: row.parent_organization_id,
      level:
        row.org_level === OrganizationLevel.Unit
          ? OrganizationLevel.Unit
          : row.org_level === OrganizationLevel.SubUnit
            ? OrganizationLevel.SubUnit
            : OrganizationLevel.Kelurahan,
      name: row.name,
      slug: row.slug,
      status: OrganizationStatus.Active,
      areaLabel: row.area_label,
      whatsappContact: {
        picName: row.whatsapp_pic_name,
        picPosition: row.whatsapp_pic_position,
        whatsappE164: row.whatsapp_e164,
        routingMode:
          row.whatsapp_routing_mode === OrgWhatsappRoutingMode.CentralGateway
            ? OrgWhatsappRoutingMode.CentralGateway
            : OrgWhatsappRoutingMode.OrgPic,
      },
    })),
    source: 'supabase',
  };
}
