import { Principal } from "@dfinity/principal";

export interface Token {
    'logo' : string,
    'name' : string,
    'description' : string,
    'website' : string,
    'principal_id' : Principal,
    'standard' : string,
    'total_supply' : [] | [bigint],
    'symbol' : string,
  }