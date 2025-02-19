import { Principal } from '@dfinity/principal';
import dip_721_v2Did from '../idls/dip_721_v2.did';
import DepartureLabs from '../standard_wrappers/nft_standards/departure_labs';
import DIP721 from '../standard_wrappers/nft_standards/dip_721';
import DIP721v2 from '../standard_wrappers/nft_standards/dip_721_v2';
import EXT from '../standard_wrappers/nft_standards/ext';
import CCC from '../standard_wrappers/nft_standards/ccc';
import ICPunks from '../standard_wrappers/nft_standards/ic_punks';
import Itoka from '../standard_wrappers/nft_standards/itoka';

export type NFTStandards =
  | typeof EXT
  | typeof ICPunks
  | typeof DepartureLabs
  | typeof DIP721
  | typeof DIP721v2
  | typeof CCC
  | typeof Itoka;

export interface DABCollection {
  icon: string;
  name: string;
  description: string;
  principal_id: Principal;
  standard: string;
}

export interface NFTCollection {
  name: string;
  canisterId: string;
  standard: string;
  tokens: NFTDetails[];
  icon?: string;
  description?: string;
}

export interface NFTDetails {
  index: bigint;
  canister: string;
  id?: string;
  name?: string;
  url: string;
  metadata: any;
  standard: string;
  collection?: string;
  owner?: string;
}
