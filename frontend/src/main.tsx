import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
import {BrowserRouter, Route, Routes} from "react-router";
import Notfound from "./routes/notfound.tsx";
import AuthSteamSuccess from "./routes/auth/steam/success.tsx";
import PageTemplate from "./components/layout/PageTemplate.tsx";
import {SteamUserProvider} from "./contexts/SteamUserContext.tsx";
import Index from "./routes";
import {LoadoutMe} from "./routes/loadout/me.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SteamUserProvider>
      <PageTemplate>
        <BrowserRouter>
          <Routes>
            <Route index element={<Index />} />

            <Route path={"auth"}>
              <Route path={"steam/success"} element={<AuthSteamSuccess />} />
            </Route>

            <Route path={"loadout"}>
              <Route path={"me"} element={<LoadoutMe />} />
            </Route>

            <Route path="*" element={<Notfound />} />
          </Routes>
        </BrowserRouter>
      </PageTemplate>
    </SteamUserProvider>
  </StrictMode>,
)
