import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import fetch from 'cross-fetch';

import dabInterface, {
  DABCollection,
  GetAllResult,
} from '../interfaces/dab_nfts';
import dabDid from '../idls/dab_nfts.did';
import { NFTStandards, NFTCollection } from '../interfaces/nft';
import EXT from '../nft_standards/ext';
import ICPunks from '../nft_standards/ic_punks';
import DepartureLabs from '../nft_standards/departure_labs';
import NFT from '../nft_standards/default';
import ERC721 from '../nft_standards/erc_721';

const DAB_CANISTER_ID = 'aipdg-waaaa-aaaah-aaq5q-cai';

const NFT_STANDARDS: { [key: string]: NFTStandards } = {
  EXT: EXT,
  ICPunks: ICPunks,
  DepartureLabs: DepartureLabs,
  ERC721: ERC721,
};

export const getNFTActor = (
  canisterId: string,
  agent: HttpAgent,
  standard: string
): NFT => {
  if (!(standard in NFT_STANDARDS)) {
    console.error(`Standard ${standard} is not implemented`);
    throw new Error(`standard is not supported: ${standard}`);
  }
  return new NFT_STANDARDS[standard](canisterId, agent);
};

export const getNFTInfo = async (
  nftCanisterId: string,
  agent: HttpAgent
): Promise<DABCollection | undefined> => {
  const dabActor = Actor.createActor<dabInterface>(dabDid, {
    agent,
    canisterId: Principal.fromText(DAB_CANISTER_ID),
  });

  const result = await dabActor.get_canister(nftCanisterId);
  if (result.length == 0) return undefined;

  return result[0];
};

export const getAllNFTS = async (
  agent: HttpAgent
): Promise<DABCollection[]> => {
  const dabActor = Actor.createActor<dabInterface>(dabDid, {
    agent,
    canisterId: Principal.fromText(DAB_CANISTER_ID),
  });
  return dabActor.get_all();
};

export const getAllUserNFTs = async (
  agent: HttpAgent,
  user: Principal
): Promise<NFTCollection[]> => {
  const NFTCollections = await getAllNFTS(agent);
  // REMOVE WHEN COLLECTION IS ADDED TO DAB
  if (
    !NFTCollections.some(
      (c) => c.principal_id.toText() === 'lhq4n-3yaaa-aaaai-qaniq-cai'
    )
  ) {
    NFTCollections.push({
      icon: 'https://storageapi.fleek.co/fleek-team-bucket/principia.png',
      name: 'Principia Mathematica',
      principal_id: Principal.fromText('lhq4n-3yaaa-aaaai-qaniq-cai'),
      description:
        'An Ode to Mathematics, a silent tribute to the greatest minds of all time.',
      standard: 'DepartureLabs',
    });
  }
  const result = await Promise.all(
    NFTCollections.map(async (collection) => {
      try {
        const NFTActor = getNFTActor(
          collection.principal_id.toString(),
          agent,
          collection.standard
        );
        const details = await NFTActor.getUserTokens(user);
        return {
          name: collection.name,
          canisterId: collection.principal_id.toString(),
          standard: collection.standard,
          description: collection.description,
          icon: collection.icon,
          tokens: details.map((detail) => ({
            ...detail,
            collection: collection.name,
          })),
        };
      } catch (e) {
        console.error(e);
        return {
          name: collection.name,
          canisterId: collection.principal_id.toString(),
          standard: collection.standard,
          tokens: [],
        };
      }
    })
  );
  return result.filter((element) => element.tokens.length);
};

const BATCH_AMOUNT = 5;

interface GetBatchedNFTsParams {
  principal: Principal;
  callback?: (collection: NFTCollection) => void;
  batchSize?: number;
  onFinish?: (collections: NFTCollection[]) => void;
}

export const getBatchedNFTs = async ({ principal, callback, batchSize = BATCH_AMOUNT, onFinish }: GetBatchedNFTsParams) => {
  const agent = new HttpAgent({ fetch, host: 'https://ic0.app' });
  const NFTCollections = await getAllNFTS(agent);
  let result: NFTCollection[] = [];
  for (let i = 0; i < NFTCollections.length; i+= batchSize) {
    const batch = NFTCollections.slice(i, i + batchSize);
    const batchResult = await Promise.all(
      batch.map(async (collection) => {
        try {
          const NFTActor = getNFTActor(
            collection.principal_id.toString(),
            agent,
            collection.standard
          );
          const details = await NFTActor.getUserTokens(principal);
          const collectionDetails = {
            name: collection.name,
            canisterId: collection.principal_id.toString(),
            standard: collection.standard,
            description: collection.description,
            icon: collection.icon,
            tokens: details.map((detail) => ({
              ...detail,
              collection: collection.name,
            })),
          };
          if (callback) {
            await callback?.(collectionDetails);
          }
          return collectionDetails;
        } catch (e) {
          console.warn(`Error while fetching collection ${collection?.name} (${collection?.principal_id?.toString()}). \n${e.message}`);
          return {
            name: collection.name,
            canisterId: collection.principal_id.toString(),
            standard: collection.standard,
            tokens: [],
          };
        }
      })
    );
    result = [...result, ...batchResult];
  }
  if (onFinish) {
    await onFinish?.(result);
  }
  return result.filter((element) => element?.tokens?.length);
};

export default {};
