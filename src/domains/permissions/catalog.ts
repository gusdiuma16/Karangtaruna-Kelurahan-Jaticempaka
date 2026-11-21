export enum PermissionCode {
  OrganizationView = 'organization.view',
  OrganizationUpdate = 'organization.update',
  MembersView = 'members.view',
  MembersCreate = 'members.create',
  MembersUpdate = 'members.update',
  MembersDeactivate = 'members.deactivate',
  MembershipRequestsView = 'membership_requests.view',
  MembershipRequestsApprove = 'membership_requests.approve',
  MembershipRequestsReject = 'membership_requests.reject',
  MembershipCardsManage = 'membership_cards.manage',
  MembershipCardsRevoke = 'membership_cards.revoke',
  ContentCreate = 'content.create',
  ContentUpdate = 'content.update',
  ContentPublish = 'content.publish',
  ContentArchive = 'content.archive',
  EventsManage = 'events.manage',
  ProgramsManage = 'programs.manage',
  GalleryManage = 'gallery.manage',
  UsersInvite = 'users.invite',
  RolesAssign = 'roles.assign',
  SettingsManage = 'settings.manage',
}

export enum SystemRoleCode {
  OrganizationAdmin = 'organization_admin',
  MembershipManager = 'membership_manager',
  ContentEditor = 'content_editor',
  EventManager = 'event_manager',
  Member = 'member',
}

export enum OrganizationPositionTitle {
  Ketua = 'Ketua',
  WakilKetua = 'Wakil Ketua',
  Sekretaris = 'Sekretaris',
  Bendahara = 'Bendahara',
  KepalaBidang = 'Kepala Bidang',
}

export const SYSTEM_ROLE_DEFAULT_PERMISSIONS: Record<
  SystemRoleCode,
  readonly PermissionCode[]
> = {
  [SystemRoleCode.OrganizationAdmin]: [
    PermissionCode.OrganizationView,
    PermissionCode.OrganizationUpdate,
    PermissionCode.MembersView,
    PermissionCode.MembersCreate,
    PermissionCode.MembersUpdate,
    PermissionCode.MembersDeactivate,
    PermissionCode.MembershipRequestsView,
    PermissionCode.MembershipRequestsApprove,
    PermissionCode.MembershipRequestsReject,
    PermissionCode.MembershipCardsManage,
    PermissionCode.MembershipCardsRevoke,
    PermissionCode.ContentCreate,
    PermissionCode.ContentUpdate,
    PermissionCode.ContentPublish,
    PermissionCode.ContentArchive,
    PermissionCode.EventsManage,
    PermissionCode.ProgramsManage,
    PermissionCode.GalleryManage,
    PermissionCode.UsersInvite,
    PermissionCode.RolesAssign,
    PermissionCode.SettingsManage,
  ],
  [SystemRoleCode.MembershipManager]: [
    PermissionCode.OrganizationView,
    PermissionCode.MembersView,
    PermissionCode.MembersCreate,
    PermissionCode.MembersUpdate,
    PermissionCode.MembershipRequestsView,
    PermissionCode.MembershipRequestsApprove,
    PermissionCode.MembershipRequestsReject,
    PermissionCode.MembershipCardsManage,
  ],
  [SystemRoleCode.ContentEditor]: [
    PermissionCode.OrganizationView,
    PermissionCode.ContentCreate,
    PermissionCode.ContentUpdate,
    PermissionCode.ContentPublish,
    PermissionCode.ContentArchive,
    PermissionCode.GalleryManage,
  ],
  [SystemRoleCode.EventManager]: [
    PermissionCode.OrganizationView,
    PermissionCode.EventsManage,
    PermissionCode.ProgramsManage,
    PermissionCode.GalleryManage,
  ],
  [SystemRoleCode.Member]: [PermissionCode.OrganizationView],
};

export function roleHasPermission(
  role: SystemRoleCode,
  permission: PermissionCode,
): boolean {
  return SYSTEM_ROLE_DEFAULT_PERMISSIONS[role].includes(permission);
}
