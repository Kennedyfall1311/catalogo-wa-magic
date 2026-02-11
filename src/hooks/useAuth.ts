import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api-client";
import { isPostgresMode } from "@/lib/api-client";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = useCallback(async (userId: string) => {
    return authApi.checkAdmin(userId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isPostgresMode()) {
      // PostgreSQL mode: admin is always open
      setUser({ id: "local-admin", email: "admin@local" });
      setSession({});
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Supabase mode: use auth state listener
    const unsubscribe = authApi.onAuthStateChange((newUser, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newUser);

      if (newUser) {
        setTimeout(() => {
          if (!isMounted) return;
          checkAdminRole(newUser.id).then((admin) => {
            if (isMounted) setIsAdmin(admin);
          });
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // Initial load
    const initializeAuth = async () => {
      try {
        const { user: currentUser, session: currentSession } = await authApi.getSession();
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          const admin = await checkAdminRole(currentUser.id);
          if (isMounted) setIsAdmin(admin);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    return authApi.signIn(email, password);
  };

  const signUp = async (email: string, password: string) => {
    return authApi.signUp(email, password);
  };

  const signOut = async () => {
    await authApi.signOut();
    if (isPostgresMode()) {
      // No-op in postgres mode
    }
  };

  return { user, isAdmin, loading, signIn, signUp, signOut };
}
