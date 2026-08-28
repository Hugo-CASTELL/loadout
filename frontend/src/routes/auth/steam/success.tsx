import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSteamUser } from "../../../contexts/SteamUserContext.tsx";
import { BackendRoutes } from "../../../lib/backend_routes.ts";

export default function AuthSteamSuccess() {
  const navigate = useNavigate();
  const { setSteamUser } = useSteamUser();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(BackendRoutes.AuthMe, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const data = await response.json();
        if (data.authenticated && data.user) {
          setSteamUser(data.user);
        }
      } catch {
        setSteamUser(null);
      } finally {
        navigate("/");
      }
    };

    fetchUser();
  }, [navigate, setSteamUser]);

  return <div>Signing you in...</div>;
}
