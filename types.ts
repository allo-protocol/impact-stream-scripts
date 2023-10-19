export type User = {
 id: string;
 address: string;
};

export type Metadata = {
 protocol: number;
 pointer: string;
};

export type Profile = {
 nonce: number;
 name: string;
 metadata: Metadata;
 owner: string;
 members: string[];
};

export type Recipient = {
 userId: string;
 recipientId: string;
 recipientAddress: string;
 requestedAmount: number;
 metadata: Metadata;
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

export type DistributionList = string[];
export type AddressList = string[];
export type Payout = {
 recipientId: string;
 amount: number;
};

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
