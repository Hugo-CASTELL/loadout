import {useSteamUser} from "../../contexts/SteamUserContext.tsx";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import type {AppInventory} from "../../lib/loadouts_shared_generated.ts";
import {BackendRoutes} from "../../lib/backend_routes.ts";

export function LoadoutMe(){
  const { steamUser, loading: authLoading } = useSteamUser();
  const navigate = useNavigate();

  const [ inventory, setInventory ] = useState<AppInventory>({ items: [] });
  const [ error, setError ] = useState<string | null>(null);
  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!steamUser) {
      navigate("/");
      return;
    }

    const controller = new AbortController();

    const fetchInventory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(BackendRoutes.SteamInventory, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || `Inventory request failed: ${response.status}`);
        }

        const data = payload as AppInventory;
        if (!data?.items) {
          throw new Error("Invalid inventory response");
        }

        setInventory(data);
      } catch (e) {
        if (controller.signal.aborted) return;
        const message = e instanceof Error ? e.message : "Failed to load inventory";
        console.error(e);
        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInventory();
    return () => controller.abort();
  }, [steamUser, authLoading, navigate]);

  return (
    <div>
      <h1>My Loadout</h1>
      {loading ? <p>Loading inventory…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {!loading && !error ? <p>Items in your inventory: {inventory.items.length}</p> : null}
      <ul>
        {inventory.items?.map((item, index) => (
          <li key={`${item.name}-${index}`}>
            {item.icon_url ? <img src={item.icon_url} alt={item.name} /> : null}
            <span>{item.name}</span>
            {item.show_in_game_uri ? (
              <a href={item.show_in_game_uri} target="_blank" rel="noopener noreferrer">Show in Game</a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
