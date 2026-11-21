-- Seed awal Ekosistem Karang Taruna Kelurahan Jaticempaka (M1)
-- Jalankan setelah 0001_m1_foundation_auth.sql di Supabase SQL Editor.

insert into public.ecosystems (
  id,
  slug,
  name,
  central_whatsapp_e164,
  central_whatsapp_label,
  status
)
values (
  '00000000-0000-4000-8000-000000000001',
  'karang-taruna-jaticempaka',
  'Karang Taruna Kelurahan Jaticempaka',
  '6281200000000',
  'Sekretariat 1 Pintu Karang Taruna Jaticempaka',
  'active'
)
on conflict (slug) do nothing;

insert into public.organizations (
  id,
  ecosystem_id,
  parent_organization_id,
  org_level,
  name,
  slug,
  status,
  area_label,
  whatsapp_pic_name,
  whatsapp_pic_position,
  whatsapp_e164,
  whatsapp_routing_mode
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    null,
    'kelurahan',
    'Karang Taruna Kelurahan Jaticempaka',
    'katar-jaticempaka',
    'active',
    'Kelurahan Jaticempaka, Pondokgede',
    'Sekretariat Katar Kelurahan Jaticempaka',
    'Sekretaris',
    '6281211112222',
    'org_pic'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'unit',
    'Karang Taruna Unit 01 Jaticempaka',
    'katar-unit-01-jaticempaka',
    'active',
    'Wilayah Domisili Unit 01, Jaticempaka',
    'Pengurus Keanggotaan Unit 01',
    'Wakil Ketua',
    '6281333334444',
    'org_pic'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'unit',
    'Karang Taruna Unit 02 Jaticempaka',
    'katar-unit-02-jaticempaka',
    'active',
    'Wilayah Domisili Unit 02, Jaticempaka',
    null,
    null,
    null,
    'org_pic'
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'sub_unit',
    'Karang Taruna Sub Unit Kreatif Pemuda Jaticempaka',
    'katar-subunit-kreatif-jaticempaka',
    'active',
    'Wilayah Domisili Sub Unit Kreatif, Jaticempaka',
    'Koordinator Sub Unit Kreatif',
    'Kepala Bidang',
    '6281555556666',
    'central_gateway'
  )
on conflict (slug) do nothing;
