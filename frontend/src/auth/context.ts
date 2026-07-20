import { createContext } from "react";
import type { AuthUser } from "./session";

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser>;
  register: (details: { fullName: string; email: string; password: string }) => Promise<AuthUser>;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
