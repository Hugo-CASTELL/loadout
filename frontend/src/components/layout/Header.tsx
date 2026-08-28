import SteamConnectButton from "../steam/SteamConnectButton.tsx";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Center Title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-widest">
          LOADOUT
        </h1>

        {/* Right Button */}
        <div className="ml-auto">
          <SteamConnectButton />
        </div>
      </div>
    </header>
  );
}