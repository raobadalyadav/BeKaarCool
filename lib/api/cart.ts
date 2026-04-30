import { gql } from "./client";
import type { CartDto } from "./types";

const CART_FIELDS = `
  id currency subtotalMinor
  items { id variantId quantity priceMinor }
`;

export async function getCart(): Promise<CartDto> {
  const data = await gql<{ cart: CartDto }>({
    query: `query { cart { ${CART_FIELDS} } }`,
    cache: "no-store",
  });
  return data.cart;
}

export async function addToCart(
  variantId: string,
  quantity: number
): Promise<CartDto> {
  const data = await gql<{ addToCart: CartDto }>({
    query: `
      mutation Add($input: AddToCartInput!) {
        addToCart(input: $input) { ${CART_FIELDS} }
      }
    `,
    variables: { input: { variantId, quantity } },
  });
  return data.addToCart;
}

export async function updateCartItem(
  id: string,
  quantity: number
): Promise<CartDto> {
  const data = await gql<{ updateCartItem: CartDto }>({
    query: `
      mutation Update($id: String!, $quantity: Int!) {
        updateCartItem(id: $id, quantity: $quantity) { ${CART_FIELDS} }
      }
    `,
    variables: { id, quantity },
  });
  return data.updateCartItem;
}

export async function removeFromCart(id: string): Promise<CartDto> {
  const data = await gql<{ removeFromCart: CartDto }>({
    query: `
      mutation Remove($id: String!) {
        removeFromCart(id: $id) { ${CART_FIELDS} }
      }
    `,
    variables: { id },
  });
  return data.removeFromCart;
}

export async function saveForLater(id: string): Promise<CartDto> {
  const data = await gql<{ saveCartItemForLater: CartDto }>({
    query: `
      mutation SaveForLater($id: String!) {
        saveCartItemForLater(id: $id) { ${CART_FIELDS} }
      }
    `,
    variables: { id },
  });
  return data.saveCartItemForLater;
}

export async function moveToCart(id: string): Promise<CartDto> {
  const data = await gql<{ moveCartItemToCart: CartDto }>({
    query: `
      mutation MoveToCart($id: String!) {
        moveCartItemToCart(id: $id) { ${CART_FIELDS} }
      }
    `,
    variables: { id },
  });
  return data.moveCartItemToCart;
}

export async function mergeAnonymousCart(anonymousId: string): Promise<CartDto> {
  const data = await gql<{ mergeAnonymousCart: CartDto }>({
    query: `
      mutation Merge($anonymousId: String!) {
        mergeAnonymousCart(anonymousId: $anonymousId) { ${CART_FIELDS} }
      }
    `,
    variables: { anonymousId },
  });
  return data.mergeAnonymousCart;
}
