import { gqlClient } from "./client";
import type { ProductDto } from "./types";

export async function aiReviewSummary(productId: string): Promise<string> {
  try {
    const data = await gqlClient<{ aiReviewSummary: string }>({
      query: `query AiSummary($productId: String!) { aiReviewSummary(productId: $productId) }`,
      variables: { productId },
    });
    return data.aiReviewSummary ?? "";
  } catch {
    return "";
  }
}

export async function aiProductRecommendations(productId: string): Promise<ProductDto[]> {
  try {
    const data = await gqlClient<{ aiProductRecommendations: ProductDto[] }>({
      query: `query AiRecs($productId: String!) {
        aiProductRecommendations(productId: $productId) {
          id slug title images ratingAvg ratingCount
          variants { id sku priceMinor compareAtMinor optionsJson inStock tierPricingJson }
        }
      }`,
      variables: { productId },
    });
    return data.aiProductRecommendations ?? [];
  } catch {
    return [];
  }
}

export async function aiChat(
  messages: Array<{ role: string; content: string }>,
  context?: string
): Promise<string> {
  const data = await gqlClient<{ aiChat: string }>({
    query: `mutation AiChat($messages: [AiMessageInput!]!, $context: String) {
      aiChat(messages: $messages, context: $context)
    }`,
    variables: { messages, context },
  });
  return data.aiChat ?? "";
}
