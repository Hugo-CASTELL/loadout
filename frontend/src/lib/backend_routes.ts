export const BACKEND_URL = import.meta.env.VITE_API_URL;

export const BackendRoutes = {
  AuthSteam: BACKEND_URL + "/auth/steam",
  AuthMe: BACKEND_URL + "/auth/me",
  AuthLogout: BACKEND_URL + "/auth/logout",
  SteamInventory: BACKEND_URL + "/steam/inventory",
}
