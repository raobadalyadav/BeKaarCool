import { gqlClient } from "./client";

export interface CorporateInquiryInput {
  companyName: string;
  gstin?: string;
  contactName: string;
  email: string;
  phone: string;
  expectedVolume?: string;
  requirements?: string;
}

export async function submitCorporateInquiry(
  input: CorporateInquiryInput
): Promise<{ id: string; status: string }> {
  const data = await gqlClient<{
    submitCorporateInquiry: { id: string; status: string };
  }>({
    query: `
      mutation Submit($input: CorporateInquiryInput!) {
        submitCorporateInquiry(input: $input) { id status }
      }
    `,
    variables: { input },
  });
  return data.submitCorporateInquiry;
}
