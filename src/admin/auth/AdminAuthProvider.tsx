import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../server/db/database.types.ts";
import { isAdminAppMetadata } from "../../shared/auth/admin.ts";
import { getSupabaseBrowserClient } from "../lib/supabase-browser.ts";

type AdminAuthContextValue = {
  client: SupabaseClient<Database> | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getSupabaseBrowserClient()
      .then((supabase) => {
        if (!mounted) return;
        setClient(supabase);

        return supabase.auth.getSession().then(({ data }) => {
          if (mounted) {
            setSession(data.session);
            setLoading(false);
          }
        });
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!client) return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [client]);

  const value = useMemo<AdminAuthContextValue>(() => {
    const isAdmin = isAdminAppMetadata(session?.user.app_metadata);

    return {
      client,
      session,
      isAdmin,
      loading,
      error,
      signIn: async (email, password) => {
        if (!client) {
          throw new Error("Auth client not ready");
        }
        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      },
      signOut: async () => {
        if (!client) return;
        await client.auth.signOut();
      },
    };
  }, [client, session, loading, error]);

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
