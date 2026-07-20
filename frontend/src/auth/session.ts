export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export const AUTH_SESSION_STORAGE_KEY = "tutorme.auth.session";

export function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof session.token !== "string" ||
      !session.token ||
      !session.user ||
      typeof session.user.id !== "string" ||
      typeof session.user.email !== "string" ||
      typeof session.user.fullName !== "string"
    ) {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    return session as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeStoredSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}
