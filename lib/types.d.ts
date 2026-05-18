export type CLM_Id = number;

export type RankJSON = {};

export type CharJSON = {
  char: number;
  color: number;
  ratio?: number | undefined;
};

export type PlayerJSON = {
  clmId: CLM_Id;
  playerId: number;
  eventId: number;
  image: string;
  ident: string;
  tag: string;
  prefix: string | null;
  realName: string | null;
  pronouns: string | null;
  twitch: string | null;
  twitter: string | null;
  hasRating: boolean;
  otherIdents: string[];
  chars: CharJSON[];
  rank: RankJSON;
};

export type OtherPlayerJSON = {
  clmId: CLM_Id;
  latest: number;
};

export type PeriodJSON = {
  periodId: number;
  title: string;
  players: Record<CLM_Id, PlayerJSON>;
  others: Record<string, OtherPlayerJSON>;
};
