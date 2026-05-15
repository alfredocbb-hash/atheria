import { createContext, useContext } from "react";
import { defaultAuthState, type AuthState } from "@/lib/auth-context";

export const AuthContext = createContext<AuthState>(defaultAuthState);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}