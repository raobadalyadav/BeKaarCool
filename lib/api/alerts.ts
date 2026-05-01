import { gql, gqlClient } from "./client";

export interface BackInStockSub {
  id: string;
  variantId: string;
  productId: string;
  createdAt: string;
  notifiedAt?: string | null;
}

const FIELDS = `id variantId productId createdAt notifiedAt`;

export async function notifyMeWhenInStock(
  variantId: string,
  email?: string
): Promise<BackInStockSub> {
  const data = await gqlClient<{ notifyMeWhenInStock: BackInStockSub }>({
    query: `
      mutation N($variantId: String!, $email: String) {
        notifyMeWhenInStock(variantId: $variantId, email: $email) { ${FIELDS} }
      }
    `,
    variables: { variantId, email },
  });
  return data.notifyMeWhenInStock;
}

export async function myBackInStockSubscriptions(): Promise<BackInStockSub[]> {
  const data = await gql<{ myBackInStockSubscriptions: BackInStockSub[] }>({
    query: `query { myBackInStockSubscriptions { ${FIELDS} } }`,
    cache: "no-store",
  });
  return data.myBackInStockSubscriptions;
}

export async function unsubscribeBackInStock(
  variantId: string
): Promise<boolean> {
  const data = await gqlClient<{ unsubscribeBackInStock: boolean }>({
    query: `
      mutation U($variantId: String!) {
        unsubscribeBackInStock(variantId: $variantId)
      }
    `,
    variables: { variantId },
  });
  return data.unsubscribeBackInStock;
}
