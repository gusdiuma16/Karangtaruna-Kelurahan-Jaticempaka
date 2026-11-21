export enum ProfileStatus {
  Active = 'active',
  Suspended = 'suspended',
}

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  phoneE164: string | null;
  addressRw: string | null;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  addressRw: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName: string;
  displayName: string;
  phoneRaw: string;
  addressRw: string;
}

export interface AuthSessionSnapshot {
  userId: string;
  email: string | null;
  profile: UserProfile | null;
}
