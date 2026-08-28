import { Button } from "../ui/button.tsx";
import { LogIn } from "lucide-react";
import { BackendRoutes } from "../../lib/backend_routes.ts";

export default function SteamConnectButton() {
  const handleSteamLogin = () => {
    window.location.href = BackendRoutes.AuthSteam;
  };

  return (
    <Button
      onClick={handleSteamLogin}
      className="flex items-center gap-2 bg-[#171A21] hover:bg-[#2A475E]"
    >
      <LogIn className="h-4 w-4" />
      Connect to Steam
    </Button>
  );
}