export interface InventoryItem {
  name: string
  icon_url: string
  show_in_game_uri: string
}

export interface AppInventory {
  items: InventoryItem[];
}
