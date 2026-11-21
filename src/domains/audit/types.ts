export enum AuditAction {
  ProfileUpdated = 'profile.updated',
  OrganizationCreated = 'organization.created',
  OrganizationSettingsUpdated = 'organization.settings_updated',
  MembershipApplicationApproved = 'membership_application.approved',
  MembershipApplicationRejected = 'membership_application.rejected',
  MembershipAdded = 'membership.added',
  MembershipTransferred = 'membership.transferred',
  MembershipDeactivated = 'membership.deactivated',
  MembershipCardIssued = 'membership_card.issued',
  MembershipCardRevoked = 'membership_card.revoked',
  RoleAssigned = 'role.assigned',
  RoleRevoked = 'role.revoked',
  ContentPublished = 'content.published',
}

export interface AuditLogEntry {
  id: string;
  ecosystemId: string | null;
  organizationId: string | null;
  actorUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
