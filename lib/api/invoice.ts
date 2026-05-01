import { gql } from "./client";

export interface InvoiceLine {
  description: string;
  hsn: string;
  quantity: number;
  unitPriceMinor: string;
  taxableMinor: string;
  taxRateBps: number;
  cgstMinor: string;
  sgstMinor: string;
  igstMinor: string;
  totalMinor: string;
}

export interface InvoiceDoc {
  orderNumber: string;
  placedAt: string;
  buyerName: string;
  buyerAddress: string;
  buyerState: string;
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerState: string;
  intraState: boolean;
  lines: InvoiceLine[];
  subtotalMinor: string;
  cgstTotalMinor: string;
  sgstTotalMinor: string;
  igstTotalMinor: string;
  totalTaxMinor: string;
  shippingMinor: string;
  discountMinor: string;
  grandTotalMinor: string;
  paymentMethod: string;
  paymentStatus: string;
}

const FIELDS = `
  orderNumber placedAt buyerName buyerAddress buyerState
  sellerName sellerAddress sellerGstin sellerState intraState
  lines { description hsn quantity unitPriceMinor taxableMinor taxRateBps cgstMinor sgstMinor igstMinor totalMinor }
  subtotalMinor cgstTotalMinor sgstTotalMinor igstTotalMinor totalTaxMinor
  shippingMinor discountMinor grandTotalMinor
  paymentMethod paymentStatus
`;

export async function orderInvoice(orderNumber: string): Promise<InvoiceDoc> {
  const data = await gql<{ orderInvoice: InvoiceDoc }>({
    query: `query Inv($n: String!) { orderInvoice(orderNumber: $n) { ${FIELDS} } }`,
    variables: { n: orderNumber },
    cache: "no-store",
  });
  return data.orderInvoice;
}
