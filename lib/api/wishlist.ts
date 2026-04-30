import { gql } from "./client";
import type { WishlistItemDto } from "./types";

const FIELDS = `id productId createdAt`;

export async function myWishlist(): Promise<WishlistItemDto[]> {
  const data = await gql<{ myWishlist: WishlistItemDto[] }>({
    query: `query { myWishlist { ${FIELDS} } }`,
    cache: "no-store",
  });
  return data.myWishlist;
}

export async function addToWishlist(productId: string): Promise<WishlistItemDto> {
  const data = await gql<{ addToWishlist: WishlistItemDto }>({
    query: `mutation Add($productId: String!) { addToWishlist(productId: $productId) { ${FIELDS} } }`,
    variables: { productId },
  });
  return data.addToWishlist;
}

export async function removeFromWishlist(productId: string): Promise<boolean> {
  const data = await gql<{ removeFromWishlist: boolean }>({
    query: `mutation R($productId: String!) { removeFromWishlist(productId: $productId) }`,
    variables: { productId },
  });
  return data.removeFromWishlist;
}
