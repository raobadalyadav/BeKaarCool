import { gql } from "./client";
import type { ContentItemDto } from "./types";

const FIELDS = `id slug title excerpt bodyHtml ctaText ctaUrl imageUrl`;

export async function blogPosts(): Promise<ContentItemDto[]> {
  const data = await gql<{ blogPosts: ContentItemDto[] }>({
    query: `query { blogPosts { ${FIELDS} } }`,
    next: { revalidate: 300, tags: ["blog"] },
  });
  return data.blogPosts;
}

export async function banners(): Promise<ContentItemDto[]> {
  const data = await gql<{ banners: ContentItemDto[] }>({
    query: `query { banners { ${FIELDS} } }`,
    next: { revalidate: 300, tags: ["banners"] },
  });
  return data.banners;
}

export async function newsletterSubscribe(email: string): Promise<void> {
  await gql<{ newsletterSubscribe: boolean }>({
    query: `mutation Newsletter($email: String!) { newsletterSubscribe(email: $email) }`,
    variables: { email },
  });
}

export async function staticPage(
  slug: string
): Promise<ContentItemDto | null> {
  const data = await gql<{ page: ContentItemDto | null }>({
    query: `query P($slug: String!) { page(slug: $slug) { ${FIELDS} } }`,
    variables: { slug },
    next: { revalidate: 600, tags: [`page:${slug}`] },
  });
  return data.page;
}
