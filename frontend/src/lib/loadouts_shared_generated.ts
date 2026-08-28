// Generated the 26/08/26
// ===== app.ts =====
export interface InventoryItem {
  name: string
  icon_url: string
  show_in_game_uri: string
}

export interface AppInventory {
  items: InventoryItem[];
}


// ===== steam.ts =====
// export interface Asset {
//   appid: number // 730
//   contextid: number // 2
//   assetid: number // 53181949965
//   classid: number // 7993037971
//   instanceid: number // 8740116227
//   amount: number // 1
// }
//
// export interface InnerDescription {
//   type: string // html
//   value: string // The Glock 18 is a serviceable first-round pistol that works best against unarmored opponents and is capable of firing three-round bursts. A blue topographic pattern has been applied.\n\n<i>\"Yeah, I saw that too...\"</i>
//   color: string // 9da1a9
//   name: string // itemset_name | description
// }
//
// export interface Action {
//   link: string // steam://run/730//+csgo_econ_action_preview%20%propid:6%
//   name: string // Inspect in Game...
// }
//
// export interface Tag {
//   category: string // Type
//   internal_name: string // CSGO_Type_Pistol
//   localized_category_name: string // Type
//   localized_tag_name: string // Pistol
// }
//
// export interface Description {
//   appid: number // 730
//   classid: number // 7993036259
//   instanceid: number // 302028390
//   currency: number // 0
//   background_color: string // 2f363e
//   icon_url: string // // i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL2kpnj9h1T9veRfKt9L8-eC2OZ1OM46eMxFnG3xhh24jzQyI76eHKQPFNzWJYkE7MIu0O_xNG1N-3k5FHWipUFk3tU1JV7Fg
//   descriptions: InnerDescription[]
//   tradeable: boolean // 1
//   actions: Action[]
//   name: string // Glock-18 | Ocean Topo
//   name_color: string // 5e98d9
//   type: string // Industrial Grade Pistol
//   market_name: string // Glock-18 | Ocean Topo (Field-Tested)
//   market_hash_name: string // Glock-18 | Ocean Topo (Field-Tested)
//   market_actions: Action[]
//   commodity: number // 0
//   market_tradable_restriction: number // 7
//   market_marketable_restriction: number // 7
//   marketable: number // 1
//   tags: Tag[]
//   sealed: boolean // 0
//   market_bucket_group_name: string // Glock-18 | Ocean Topo
//   market_bucket_group_id: string // G180420F1093004
//   sealed_type: number // 0
//   market_name_inside_group: string // Field-Tested
// }
//
// export interface InnerAssetProperty {
//   propertyid: number // 1 for int, 2 for float, 6 for string
//   int_value: number // if 1 then e.g. 389
//   float_value: number // if 2 then e.g. 0.0602601803839206696
//   string_value: string//  if 6 then e.g. 3727BAE7A7B8F1362F0A17BA321F3107330FD691ECDC3477B23455323F3727ED1D55323F3527ED1D55323F3427ED1D55383F3627D10E0A379F4F0D7237BD198B5F7E473F9536213F3727200A63F7A47672B78D30087A569A567767D636B36C72A6
//   name: string // Pattern Template
// }
//
// export interface InnerAccessoryProperty {
//   propertyid: number // 4 | 3
//   float_value: number // if 4 then e.g. 0.0
//   int_value: number // if 3 then e.g. 0
// }
//
// export interface InnerAssetAccessories {
//   classid: number // 4839651024
//   parent_relationship_properties: InnerAccessoryProperty[]
//   standalone_properties: InnerAccessoryProperty[]
// }
//
// export interface AssetProperty {
//   appid: number // 730
//   contextid: number // 2
//   assetid: number // 53181949965
//   asset_properties: InnerAssetProperty[]
//   asset_accessories: InnerAssetAccessories
// }
//
// export interface SteamInventory {
//   assets: Asset[]
//   descriptions: Description[]
//   assetsProperties: AssetProperty[]
//   total_inventory_count: number // 109
//   success: boolean // 1
//   rwgrsn: number // -2
// }


// ===== steamapis.ts =====
export interface Asset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

export interface Description {
  appid: number;
  classid: string;
  instanceid: string;
  currency: number;
  background_color: string;
  icon_url: string;
  icon_url_large?: string;
  descriptions: string[];
  tradable: number;
  marketable: number;
  commodity: number;
  market_tradable_restriction: number;
  market_marketable_restriction: number;
  name: string;
  name_color: string;
  type: string;
  market_name: string;
  market_hash_name: string;
  actions?: any[];
  market_actions?: any[];
  tags: any[];
  sealed: number;
  sealed_type: number;
  market_bucket_group_name: string;
  market_bucket_group_id: string;
}

export interface SteamApisInventoryResponse {
  assets: Asset[];
  descriptions: Description[];
}


