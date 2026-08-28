import {createContext, useContext, useEffect, useState, type ReactNode, useMemo,} from "react";
import {BackendRoutes} from "../lib/backend_routes.ts";

export interface SteamUser {
  steamId: string;
}

interface SteamUserContextType {
  steamUser: SteamUser | null;
  loading: boolean;
  setSteamUser: (user: SteamUser | null) => void;
  logout: () => Promise<void>;
}

const SteamUserContext = createContext<SteamUserContextType | undefined>(undefined);

export function SteamUserProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [steamUser, setSteamUser] = useState<SteamUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(BackendRoutes.AuthMe, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        return response.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setSteamUser(data.user);
        } else {
          setSteamUser(null);
        }
      })
      .catch(() => {
        setSteamUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await fetch(BackendRoutes.AuthLogout, {
      method: "POST",
      credentials: "include",
    });

    setSteamUser(null);
  };

  const context_value = useMemo(() => {
    return {
      steamUser,
      setSteamUser,
      loading,
      logout,
    };
  }, [steamUser, loading, setSteamUser, logout]);

  return (
    <SteamUserContext.Provider
      value={context_value}
    >
      {children}
    </SteamUserContext.Provider>
  );
}

export function useSteamUser() {
  const context = useContext(SteamUserContext);

  if (!context) {
    throw new Error("useSteamUser must be used inside SteamUserProvider");
  }

  return context;
}