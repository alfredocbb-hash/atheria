import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "operator" | "client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  rolesLoaded: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  isAdminOrOperator: boolean;
  signOut: () => Promise<void>;
}

export const defaultAuthState: AuthState = {
  user: null,
  session: null,
  roles: [],
  isAuthenticated: false,
  isLoading: true,
  rolesLoaded: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  isAdminOrOperator: false,
  signOut: async () => {},
};