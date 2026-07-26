export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRegistrationDetails extends AuthCredentials {
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  message?: string;
  deletionCanceled?: boolean;
}

export interface LoginResult {
  user: AuthUser;
  deletionCanceled?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials: AuthCredentials) => Promise<LoginResult>;
  register: (details: AuthRegistrationDetails) => Promise<AuthUser>;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
}

export type AccountSecurityUser = AuthUser;

export interface ProfileData extends AuthUser {
  streakCount: number;
  createdAt: string;
  coursesJoined: number;
  lessonsCompleted: number;
}
