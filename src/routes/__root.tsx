import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { AuthContext } from "@/hooks/use-auth";
import type { AppRole, AuthState } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  auth: AuthState;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Coopecur 2.0 — Plataforma de Servicios" },
      {
        name: "description",
        content:
          "Plataforma de gestión de servicios públicos de Coopecur: facturación, suministros y reclamos en línea.",
      },
      { name: "author", content: "Coopecur" },
      { property: "og:title", content: "Coopecur 2.0" },
      {
        property: "og:description",
        content: "Gestión integral de servicios públicos para socios y operadores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}

function AuthGate() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const loadRoles = useCallback(async (userId: string | undefined) => {
    setRolesLoaded(false);
    if (!userId) {
      setRoles([]);
      setRolesLoaded(true);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles((data ?? []).map((r) => r.role as AppRole));
    setRolesLoaded(true);
  }, []);

  useEffect(() => {
    let prevUserId: string | undefined;
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      const nextUserId = newSession?.user?.id;
      const userChanged = nextUserId !== prevUserId;
      if (!newSession) setRoles([]);
      // Only react meaningfully when the user identity actually changed,
      // or on explicit sign in/out events. TOKEN_REFRESHED and similar
      // events fire frequently and must NOT trigger a global refetch.
      const isSignInOut = event === "SIGNED_IN" || event === "SIGNED_OUT";
      if (!userChanged && !isSignInOut) {
        return;
      }
      prevUserId = nextUserId;
      // defer to avoid recursive deadlocks inside the listener
      setTimeout(() => {
        void loadRoles(nextUserId);
        if (event === "SIGNED_OUT" || !newSession) {
          router.invalidate();
          queryClient.cancelQueries();
          queryClient.removeQueries();
        } else if (userChanged) {
          router.invalidate();
          queryClient.invalidateQueries();
        }
      }, 0);
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      prevUserId = data.session?.user?.id;
      void loadRoles(data.session?.user?.id).finally(() => setIsLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, [loadRoles, router, queryClient]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const auth: AuthState = useMemo(() => {
    const hasRole = (r: AppRole) => roles.includes(r);
    const hasAnyRole = (rs: AppRole[]) => rs.some((r) => roles.includes(r));
    return {
      user: session?.user ?? null,
      session,
      roles,
      isAuthenticated: !!session?.user,
      isLoading,
      rolesLoaded,
      hasRole,
      hasAnyRole,
      isAdminOrOperator: hasAnyRole(["admin", "operator"]),
      signOut,
    };
  }, [session, roles, isLoading, rolesLoaded, signOut]);

  return (
    <AuthContext.Provider value={auth}>
      <Outlet />
    </AuthContext.Provider>
  );
}
