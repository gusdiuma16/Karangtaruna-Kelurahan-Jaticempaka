import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MembershipApplicationType,
  normalizeWhatsappDigits,
  resolveMembershipConfirmationTarget,
} from '../src/domains/memberships/whatsapp-routing.ts';
import { JATICEMPAKA_INITIAL_ORGANIZATIONS } from '../src/domains/organizations/jaticempaka-catalog.ts';
import {
  ALLOWED_ORGANIZATION_LEVELS,
  OrganizationLevel,
  isAllowedOrganizationLevel,
} from '../src/domains/organizations/types.ts';
import {
  PermissionCode,
  SystemRoleCode,
  roleHasPermission,
} from '../src/domains/permissions/catalog.ts';
import {
  JATICEMPAKA_ECOSYSTEM_DEFAULT,
  WhatsappRoutingPolicy,
} from '../src/domains/platform/types.ts';

test('Domain guard: only kelurahan, unit, and sub_unit levels are permitted (no RT/RW governance)', () => {
  assert.deepEqual(ALLOWED_ORGANIZATION_LEVELS, [
    OrganizationLevel.Kelurahan,
    OrganizationLevel.Unit,
    OrganizationLevel.SubUnit,
  ]);
  assert.equal(isAllowedOrganizationLevel('kelurahan'), true);
  assert.equal(isAllowedOrganizationLevel('unit'), true);
  assert.equal(isAllowedOrganizationLevel('sub_unit'), true);
  assert.equal(isAllowedOrganizationLevel('rt'), false);
  assert.equal(isAllowedOrganizationLevel('rw'), false);
  assert.equal(isAllowedOrganizationLevel('pemerintah_kelurahan'), false);
});

test('WhatsApp normalization converts 08/62/+62 formats cleanly and rejects invalid inputs', () => {
  assert.equal(normalizeWhatsappDigits('0813-3333-4444'), '6281333334444');
  assert.equal(normalizeWhatsappDigits('+62 812 1111 2222'), '6281211112222');
  assert.equal(normalizeWhatsappDigits('81555556666'), '6281555556666');
  assert.equal(normalizeWhatsappDigits('12345'), null);
  assert.equal(normalizeWhatsappDigits(null), null);
});

test('WhatsApp routing targets organization PIC when configured', () => {
  const unit01 = JATICEMPAKA_INITIAL_ORGANIZATIONS.find(
    (org) => org.slug === 'katar-unit-01-jaticempaka',
  );
  assert.ok(unit01);

  const resolved = resolveMembershipConfirmationTarget({
    applicantName: 'Budi Santoso',
    applicationType: MembershipApplicationType.Addition,
    targetOrganization: unit01,
    ecosystem: JATICEMPAKA_ECOSYSTEM_DEFAULT,
  });

  assert.equal(resolved.source, 'organization_pic');
  assert.equal(resolved.targetPhoneDigits, '6281333334444');
  assert.ok(resolved.whatsappUrl.startsWith('https://wa.me/6281333334444?text='));
  assert.match(resolved.messagePreview, /Penambahan Keanggotaan Baru/);
  assert.match(resolved.messagePreview, /Budi Santoso/);
});

test('WhatsApp routing falls back to 1-pintu central gateway when org PIC number is missing', () => {
  const unit02 = JATICEMPAKA_INITIAL_ORGANIZATIONS.find(
    (org) => org.slug === 'katar-unit-02-jaticempaka',
  );
  assert.ok(unit02);

  const resolved = resolveMembershipConfirmationTarget({
    applicantName: 'Siti Aminah',
    applicationType: MembershipApplicationType.Transfer,
    targetOrganization: unit02,
    originOrganizationName: 'Karang Taruna Unit 01 Jaticempaka',
    ecosystem: JATICEMPAKA_ECOSYSTEM_DEFAULT,
  });

  assert.equal(resolved.source, 'central_gateway_fallback');
  assert.equal(
    resolved.targetPhoneDigits,
    JATICEMPAKA_ECOSYSTEM_DEFAULT.centralWhatsappE164,
  );
  assert.match(resolved.messagePreview, /Perpindahan \(Transfer\) Keanggotaan/);
  assert.match(resolved.messagePreview, /Organisasi Asal: Karang Taruna Unit 01 Jaticempaka/);
});

test('WhatsApp routing respects 1-pintu central gateway policy override', () => {
  const unit01 = JATICEMPAKA_INITIAL_ORGANIZATIONS.find(
    (org) => org.slug === 'katar-unit-01-jaticempaka',
  );
  assert.ok(unit01);

  const resolved = resolveMembershipConfirmationTarget({
    applicantName: 'Rizky Pratama',
    applicationType: MembershipApplicationType.Addition,
    targetOrganization: unit01,
    ecosystem: JATICEMPAKA_ECOSYSTEM_DEFAULT,
    policyOverride: WhatsappRoutingPolicy.CentralGatewayOnly,
  });

  assert.equal(resolved.source, 'central_gateway_forced');
  assert.equal(
    resolved.targetPhoneDigits,
    JATICEMPAKA_ECOSYSTEM_DEFAULT.centralWhatsappE164,
  );
});

test('RBAC catalog: Content Editor can publish content but cannot assign roles or approve membership', () => {
  assert.equal(
    roleHasPermission(SystemRoleCode.ContentEditor, PermissionCode.ContentPublish),
    true,
  );
  assert.equal(
    roleHasPermission(SystemRoleCode.ContentEditor, PermissionCode.RolesAssign),
    false,
  );
  assert.equal(
    roleHasPermission(
      SystemRoleCode.ContentEditor,
      PermissionCode.MembershipRequestsApprove,
    ),
    false,
  );
  assert.equal(
    roleHasPermission(SystemRoleCode.OrganizationAdmin, PermissionCode.RolesAssign),
    true,
  );
});
