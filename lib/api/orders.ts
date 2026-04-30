import { gql } from "./client";
import type { OrderDto, OrderStatus } from "./types";

const ORDER_FIELDS = `
  id number status currency
  subtotalMinor shippingMinor taxMinor discountMinor totalMinor
  placedAt
  items {
    id variantId productTitleSnapshot skuSnapshot quantity unitPriceMinor totalMinor
  }
`;

export async function listOrders(first = 20, after?: string): Promise<OrderDto[]> {
  const data = await gql<{ orders: OrderDto[] }>({
    query: `
      query Orders($first: Int!, $after: String) {
        orders(first: $first, after: $after) { ${ORDER_FIELDS} }
      }
    `,
    variables: { first, after: after ?? null },
    cache: "no-store",
  });
  return data.orders;
}

export async function getOrder(number: string): Promise<OrderDto | null> {
  const data = await gql<{ order: OrderDto | null }>({
    query: `query O($number: String!) { order(number: $number) { ${ORDER_FIELDS} } }`,
    variables: { number },
    cache: "no-store",
  });
  return data.order;
}

export async function cancelOrder(args: {
  number: string;
  reason: string;
  itemIds?: string[];
}): Promise<OrderDto> {
  const data = await gql<{ cancelOrder: OrderDto }>({
    query: `
      mutation Cancel($number: String!, $reason: String!, $itemIds: [String!]) {
        cancelOrder(number: $number, reason: $reason, itemIds: $itemIds) { ${ORDER_FIELDS} }
      }
    `,
    variables: { number: args.number, reason: args.reason, itemIds: args.itemIds ?? null },
  });
  return data.cancelOrder;
}

export async function requestReturn(args: {
  orderNumber: string;
  items: Array<{ orderItemId: string; quantity: number; reason?: string }>;
  reason?: string;
}): Promise<string> {
  const data = await gql<{ requestReturn: string }>({
    query: `
      mutation Return($orderNumber: String!, $items: [ReturnItemInput!]!, $reason: String) {
        requestReturn(orderNumber: $orderNumber, items: $items, reason: $reason)
      }
    `,
    variables: args,
  });
  return data.requestReturn;
}

export async function shipmentForOrder(orderId: string) {
  const data = await gql<{
    shipmentForOrder: {
      id: string;
      trackingNumber?: string;
      trackingUrl?: string;
      status: string;
      labelUrl?: string;
    } | null;
  }>({
    query: `
      query Ship($orderId: String!) {
        shipmentForOrder(orderId: $orderId) { id trackingNumber trackingUrl status labelUrl }
      }
    `,
    variables: { orderId },
    cache: "no-store",
  });
  return data.shipmentForOrder;
}

export type { OrderStatus };
