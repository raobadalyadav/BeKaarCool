/**
 * Invoice rendering moved to the backend (worker).
 * Frontend just hands off — call the backend's adminGenerateInvoice mutation
 * and link to the returned PDF URL.
 *
 * These stubs keep existing call sites compiling until they're rewritten
 * to download the backend-generated PDF directly.
 */
export async function generateInvoicePDF(_order: unknown): Promise<void> {
  console.warn(
    "generateInvoicePDF: invoice PDFs are now produced by the backend."
  );
}

export function generateStyledInvoiceHTML(_order: unknown): string {
  console.warn(
    "generateStyledInvoiceHTML: invoice rendering is now done by the backend."
  );
  return "<!doctype html><html><body><p>Invoice not available — backend handles rendering.</p></body></html>";
}

export default generateInvoicePDF;
