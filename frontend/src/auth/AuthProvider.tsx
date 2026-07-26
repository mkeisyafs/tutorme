import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { apiRequest } from "../lib/api";
import { AuthContext, type AuthContextValue } from "./context";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
  type AuthSession,
  type AuthUser,
} from "./session";
import type { AuthCredentials, AuthRegistrationDetails, AuthResponse } from "../types/auth";

function saveSession(response: AuthResponse, setSession: (session: AuthSession | null) => void): AuthUser {
  const session: AuthSession = { token: response.token, user: response.user };
  writeStoredSession(session);
  setSession(session);
  return response.user;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  const login = useCallback(async (credentials: AuthCredentials) => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    });
    const user = saveSession(response, setSession);
    return { user, deletionCanceled: response.deletionCanceled };
  }, []);

  const register = useCallback(async (details: AuthRegistrationDetails) => {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: details,
    });
    return saveSession(response, setSession);
  }, []);

  const updateUser = useCallback((user: AuthUser) => {
    setSession((currentSession) => {
      if (!currentSession) return null;

      const updatedSession = { ...currentSession, user };
      writeStoredSession(updatedSession);
      return updatedSession;
    });
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session),
    isReady: true,
    login,
    register,
    updateUser,
    logout,
  }), [login, logout, register, session, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
