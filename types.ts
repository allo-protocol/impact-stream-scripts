export type User = {
  id: string;
  address: string;
};

export type Metadata = {
  protocol: number;
  pointer: string;
};

export type Profile = {
  userId: string;
  nonce: number;
  name: string;
  metadata: Metadata;
  owner: string;
  members: string[];
};

export type Recipient = {
  proposalId: string;
  userId: string;
  recipientAddress: string; // safe address
  requestedAmount: number;
};

export type RawSupabaseData = {
  proposal_id: string;
  author: {
    id: string;
    name?: string;
    family_name?: string;
    address?: string;
  };
  collaborators?: string[];
  minimum_budget?: number;
  allo_recipient_id?: string;
  safe_address?: string;
};

export type PoolDeployment = {
  profileId: string;
  strategyAddress: string;
  initData: string;
  tokenAddress: string;
  amount: string;
  metadata: Metadata;
  managers: string[];
};

export type Payout = {
  address: string;
  amount: number;
};

export type DistributionList = Payout[];

export type AddressList = string[];

export type AllocationEvent = {
  recipientId: string;
  voteResult: number;
};

export type RawFileData = {
  name: string;
  data: {
    [key: string]: string;
  };
};
