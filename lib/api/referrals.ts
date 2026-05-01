import { gql, gqlClient } from "./client";

export interface ReferralStatsDto {
  code: string;
  invited: number;
  signedUp: number;
  paidFirstOrder: number;
  totalEarnedMinor: string;
  referrerRewardMinor: string;
  refereeDiscountMinor: string;
}

export async function myReferralStats(): Promise<ReferralStatsDto> {
  const data = await gql<{ myReferralStats: ReferralStatsDto }>({
    query: `query {
      myReferralStats {
        code invited signedUp paidFirstOrder totalEarnedMinor
        referrerRewardMinor refereeDiscountMinor
      }
    }`,
    cache: "no-store",
  });
  return data.myReferralStats;
}

export async function applyReferralCode(code: string): Promise<boolean> {
  const data = await gqlClient<{ applyReferralCode: boolean }>({
    query: `mutation A($code: String!) { applyReferralCode(code: $code) }`,
    variables: { code },
  });
  return data.applyReferralCode;
}
