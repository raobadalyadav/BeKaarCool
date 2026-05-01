import { gql, gqlClient } from "./client";

export interface WalletEntryDto {
  id: string;
  kind: string;
  amountMinor: string;
  balanceAfterMinor: string;
  sourceType: string;
  sourceId?: string | null;
  note?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface WalletDto {
  balanceMinor: string;
  currency: string;
  entries: WalletEntryDto[];
}

const FIELDS = `
  balanceMinor currency
  entries {
    id kind amountMinor balanceAfterMinor sourceType sourceId note expiresAt createdAt
  }
`;

export async function myWallet(limit = 50): Promise<WalletDto> {
  const data = await gql<{ myWallet: WalletDto }>({
    query: `query W($limit: Int!) { myWallet(limit: $limit) { ${FIELDS} } }`,
    variables: { limit },
    cache: "no-store",
  });
  return data.myWallet;
}

export async function redeemGiftCard(
  code: string,
  pin: string
): Promise<{ creditedMinor: string }> {
  const data = await gqlClient<{ redeemGiftCard: { creditedMinor: string } }>({
    query: `
      mutation Redeem($code: String!, $pin: String!) {
        redeemGiftCard(code: $code, pin: $pin) { creditedMinor }
      }
    `,
    variables: { code, pin },
  });
  return data.redeemGiftCard;
}
