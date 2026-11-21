import {
  OrganizationLevel,
  OrganizationStatus,
  OrgWhatsappRoutingMode,
  type OrganizationEntity,
} from './types.ts';
import { JATICEMPAKA_ECOSYSTEM_DEFAULT } from '../platform/types.ts';

export const JATICEMPAKA_INITIAL_ORGANIZATIONS: readonly OrganizationEntity[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    ecosystemId: JATICEMPAKA_ECOSYSTEM_DEFAULT.id,
    parentOrganizationId: null,
    level: OrganizationLevel.Kelurahan,
    name: 'Karang Taruna Kelurahan Jaticempaka',
    slug: 'katar-jaticempaka',
    status: OrganizationStatus.Active,
    areaLabel: 'Kelurahan Jaticempaka, Pondokgede',
    whatsappContact: {
      picName: 'Sekretariat Katar Kelurahan Jaticempaka',
      picPosition: 'Sekretaris',
      whatsappE164: '6281211112222',
      routingMode: OrgWhatsappRoutingMode.OrgPic,
    },
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    ecosystemId: JATICEMPAKA_ECOSYSTEM_DEFAULT.id,
    parentOrganizationId: '10000000-0000-4000-8000-000000000001',
    level: OrganizationLevel.Unit,
    name: 'Karang Taruna Unit 01 Jaticempaka',
    slug: 'katar-unit-01-jaticempaka',
    status: OrganizationStatus.Active,
    areaLabel: 'Unit 01, Jaticempaka',
    whatsappContact: {
      picName: 'Pengurus Keanggotaan Unit 01',
      picPosition: 'Wakil Ketua',
      whatsappE164: '0813-3333-4444',
      routingMode: OrgWhatsappRoutingMode.OrgPic,
    },
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    ecosystemId: JATICEMPAKA_ECOSYSTEM_DEFAULT.id,
    parentOrganizationId: '10000000-0000-4000-8000-000000000001',
    level: OrganizationLevel.Unit,
    name: 'Karang Taruna Unit 02 Jaticempaka',
    slug: 'katar-unit-02-jaticempaka',
    status: OrganizationStatus.Active,
    areaLabel: 'Unit 02, Jaticempaka',
    whatsappContact: {
      picName: null,
      picPosition: null,
      whatsappE164: null,
      routingMode: OrgWhatsappRoutingMode.OrgPic,
    },
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    ecosystemId: JATICEMPAKA_ECOSYSTEM_DEFAULT.id,
    parentOrganizationId: '10000000-0000-4000-8000-000000000002',
    level: OrganizationLevel.SubUnit,
    name: 'Karang Taruna Sub Unit Kreatif Pemuda Jaticempaka',
    slug: 'katar-subunit-kreatif-jaticempaka',
    status: OrganizationStatus.Active,
    areaLabel: 'Sub Unit Kreatif, Jaticempaka',
    whatsappContact: {
      picName: 'Koordinator Sub Unit Kreatif',
      picPosition: 'Kepala Bidang',
      whatsappE164: '6281555556666',
      routingMode: OrgWhatsappRoutingMode.CentralGateway,
    },
  },
];
