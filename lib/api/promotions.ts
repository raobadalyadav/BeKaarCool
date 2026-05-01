import { gql } from "./client";
import type { CouponDto } from "./types";

const COUPON_FIELDS = `
  id code type valueMinor percentBps usageCount usageLimit
  isActive startsAt endsAt minOrderMinor maxDiscountMinor
`;

export async function publicCoupons(limit = 24): Promise<CouponDto[]> {
  const data = await gql<{ publicCoupons: CouponDto[] }>({
    query: `query Public($limit: Int!) { publicCoupons(limit: $limit) { ${COUPON_FIELDS} } }`,
    variables: { limit },
    next: { revalidate: 300, tags: ["public-coupons"] },
  });
  return data.publicCoupons;
}
