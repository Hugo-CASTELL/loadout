import {useSteamUser} from "../../contexts/SteamUserContext.tsx";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router";
import {AlertCircle, ExternalLink, Package} from "lucide-react";
import type {AppInventory, InventoryItem} from "../../lib/loadouts_shared_generated.ts";
import {BackendRoutes} from "../../lib/backend_routes.ts";
import {cn} from "../../lib/utils.ts";
import {buttonVariants} from "../../components/ui/button.tsx";
import {Alert, AlertDescription, AlertTitle} from "../../components/ui/alert.tsx";
import {Badge} from "../../components/ui/badge.tsx";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../components/ui/empty.tsx";
import {Skeleton} from "../../components/ui/skeleton.tsx";
import {Spinner} from "../../components/ui/spinner.tsx";

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

  const isLoading = authLoading || loading;
  const itemCount = inventory.items.length;
  const showInventory = !isLoading && !error;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">My Loadout</h1>
          {showInventory ? (
            <p className="text-sm text-muted-foreground">
              Items in your inventory: {itemCount}
            </p>
          ) : null}
        </div>
        {isLoading ? (
          <Badge variant="outline">
            <Spinner data-icon="inline-start" />
            Loading inventory…
          </Badge>
        ) : null}
        {showInventory ? (
          <Badge variant="outline">{itemCount}</Badge>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertCircle />
          <AlertTitle>Could not load inventory</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? <InventorySkeleton /> : null}

      {showInventory && itemCount === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>No items in your inventory</EmptyTitle>
            <EmptyDescription>
              Items in your inventory: {itemCount}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {showInventory && itemCount > 0 ? (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {inventory.items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              <InventoryItemCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function InventoryItemCard({ item }: Readonly<{ item: InventoryItem }>) {
  return (
    <Card size="sm" className="h-full transition-colors hover:bg-muted/40">
      {item.icon_url ? (
        <img
          src={item.icon_url}
          alt={item.name}
          className="aspect-square w-full bg-muted/50 object-contain p-4"
        />
      ) : null}
      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-2 leading-snug">{item.name}</CardTitle>
      </CardHeader>
      {item.show_in_game_uri ? (
        <CardFooter className="mt-auto">
          <a
            href={item.show_in_game_uri}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
          >
            <ExternalLink data-icon="inline-start" />
            Show in Game
          </a>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function InventorySkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index}>
          <Card size="sm" className="pt-0">
            <Skeleton className="aspect-square w-full rounded-none rounded-t-xl" />
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-6 w-full" />
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
