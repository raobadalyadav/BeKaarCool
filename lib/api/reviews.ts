import { gql } from "./client";
import type { ReviewDto } from "./types";

const FIELDS = `id rating title body verifiedPurchase status helpfulCount notHelpfulCount images reviewerName createdAt`;

export async function createReview(input: {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  mediaIds?: string[];
  images?: string[];
}): Promise<ReviewDto> {
  const data = await gql<{ createReview: ReviewDto }>({
    query: `mutation C($input: CreateReviewInput!) { createReview(input: $input) { ${FIELDS} } }`,
    variables: { input },
  });
  return data.createReview;
}

export async function voteReview(
  reviewId: string,
  helpful: boolean
): Promise<boolean> {
  const data = await gql<{ voteReview: boolean }>({
    query: `mutation V($reviewId: String!, $helpful: Boolean!) { voteReview(reviewId: $reviewId, helpful: $helpful) }`,
    variables: { reviewId, helpful },
  });
  return data.voteReview;
}

export async function askQuestion(productId: string, question: string) {
  const data = await gql<{
    askProductQuestion: {
      id: string;
      question: string;
      status: string;
      upvotes: number;
      createdAt: string;
    };
  }>({
    query: `
      mutation Ask($productId: String!, $question: String!) {
        askProductQuestion(productId: $productId, question: $question) {
          id question status upvotes createdAt
        }
      }
    `,
    variables: { productId, question },
  });
  return data.askProductQuestion;
}

export async function answerQuestion(questionId: string, answer: string) {
  const data = await gql<{
    answerProductQuestion: {
      id: string;
      answer: string;
      isOfficial: boolean;
      upvotes: number;
      createdAt: string;
    };
  }>({
    query: `
      mutation Ans($questionId: String!, $answer: String!) {
        answerProductQuestion(questionId: $questionId, answer: $answer) {
          id answer isOfficial upvotes createdAt
        }
      }
    `,
    variables: { questionId, answer },
  });
  return data.answerProductQuestion;
}
