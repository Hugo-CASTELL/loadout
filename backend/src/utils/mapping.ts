import {AppInventory, Description, SteamApisInventoryResponse} from "./loadouts_shared_generated"

const STEAM_ICON_BASE = "https://community.cloudflare.steamstatic.com/economy/image/"

function toIconUrl(iconUrl?: string): string {
  if (!iconUrl) return ""
  if (iconUrl.startsWith("http") || iconUrl.startsWith("//")) {
    return iconUrl.startsWith("//") ? `https:${iconUrl}` : iconUrl
  }
  return `${STEAM_ICON_BASE}${iconUrl}`
}

function mapping(steamInventory: SteamApisInventoryResponse, appInventory: AppInventory) {
  const descriptionMap: Record<string, Description> = {}
  for (const description of steamInventory.descriptions ?? []) {
    descriptionMap[`${description.classid}_${description.instanceid}`] = description
  }

  for (const asset of steamInventory.assets ?? []) {
    const description = descriptionMap[`${asset.classid}_${asset.instanceid}`]
    const inspectLink =
      description?.market_actions?.[0]?.link ??
      description?.actions?.[0]?.link ??
      ""

    appInventory.items.push({
      name: description?.market_name || description?.name || "Unknown Item",
      icon_url: toIconUrl(description?.icon_url),
      show_in_game_uri: inspectLink.replace(/%assetid%/gi, String(asset.assetid)),
    })
  }
}

export function mapSteamInventoryToAppInventory(steamInventory: SteamApisInventoryResponse): AppInventory {
  const inventory: AppInventory = { items: [] }
  mapping(steamInventory, inventory)
  return inventory
}
