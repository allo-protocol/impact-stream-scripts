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

export type RawSupabaseData = {
 proposal_id: string;
 author: {
  id: string;
  name: string;
  family_name: string;
  address: string;
 };
 collaborators: string[] | null;
};
