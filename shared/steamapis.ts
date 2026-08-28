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