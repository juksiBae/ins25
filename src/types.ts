export type UserRole = 'admin' | 'moderator' | 'participant';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface Student {
  id: string;
  nim: string;
  name: string;
  origin: string;
  nickname: string;
  avatarUrl?: string;
  addedBy?: string; // UID of the user who added this student
}

export type GameMode = 'NAME_TO_ORIGIN' | 'ORIGIN_TO_NAME' | 'PHOTO_TO_NAME';
