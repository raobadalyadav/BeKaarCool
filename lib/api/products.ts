import { gql } from "./client";
import type {
  ProductConnection,
  ProductDto,
  CategoryDto,
  BrandDto,
  CollectionDto,
  SearchResultDto,
} from "./types";

const PRODUCT_FIELDS = `
  id slug title descriptionHtml status
  ratingAvg ratingCount brandId categoryId
  images createdAt
  shortDescription highlights tags specificationsJson attributesJson
  variants { id sku priceMinor compareAtMinor costMinor weightGrams optionsJson inStock tierPricingJson }
  productRelations {
    id sourceProductId targetProductId relationType bundlePriceMinor
    targetProduct {
      id slug title createdAt
      images
      variants { id sku priceMinor compareAtMinor inStock }
    }
  }
`;

export async function listProducts(args?: {
  first?: number;
  after?: string;
  categoryId?: string;
  brandId?: string;
  status?: "draft" | "published" | "archived";
}): Promise<ProductConnection> {
  const data = await gql<{ products: ProductConnection }>({
    query: `
      query Products($first: Int!, $after: String, $filter: ProductFilterInput, $status: ProductStatus) {
        products(first: $first, after: $after, filter: $filter, status: $status) {
          edges {
            cursor
            node { ${PRODUCT_FIELDS} }
          }
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        }
      }
    `,
    variables: {
      first: args?.first ?? 20,
      after: args?.after ?? undefined,
      filter:
        args?.categoryId || args?.brandId
          ? { categoryId: args?.categoryId, brandId: args?.brandId }
          : {},
      status: args?.status ?? undefined,
    },
    next: { revalidate: 60, tags: ["products"] },
  });
  return data.products;
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDto | null> {
  const data = await gql<{ product: ProductDto | null }>({
    query: `
      query Product($slug: String!) {
        product(slug: $slug) { ${PRODUCT_FIELDS} }
      }
    `,
    variables: { slug },
    next: { revalidate: 300, tags: [`product:${slug}`] },
  });
  return data.product;
}

export async function listCategories(): Promise<CategoryDto[]> {
  const data = await gql<{ categoriesWithCounts: CategoryDto[] }>({
    query: `query { categoriesWithCounts { id slug name descriptionHtml parentId productCount } }`,
    next: { revalidate: 300, tags: ["categories"] },
  });
  return data.categoriesWithCounts;
}

export async function listBrands(): Promise<BrandDto[]> {
  const data = await gql<{ brands: BrandDto[] }>({
    query: `query { brands { id slug name } }`,
    next: { revalidate: 600, tags: ["brands"] },
  });
  return data.brands;
}

export async function listCollections(): Promise<CollectionDto[]> {
  const data = await gql<{ collections: CollectionDto[] }>({
    query: `query { collections { id slug name type visibility } }`,
    next: { revalidate: 600, tags: ["collections"] },
  });
  return data.collections;
}

export async function getCollectionBySlug(slug: string): Promise<(CollectionDto & { products: ProductConnection }) | null> {
  const data = await gql<{
    collection: (CollectionDto & { products: ProductConnection }) | null;
  }>({
    query: `
      query Collection($slug: String!) {
        collection(slug: $slug) {
          id slug name type visibility description
          products(first: 60) {
            edges { cursor node { ${PRODUCT_FIELDS} } }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    `,
    variables: { slug },
    next: { revalidate: 300, tags: [`collection:${slug}`] },
  });
  return data.collection;
}

export async function search(args: {
  q: string;
  first?: number;
  filter?: {
    categoryIds?: string[];
    brandIds?: string[];
    inStock?: boolean;
    minPriceMinor?: number;
    maxPriceMinor?: number;
    minRating?: number;
  };
  sort?: "price_asc" | "price_desc" | "rating_desc" | "popularity";
}): Promise<SearchResultDto> {
  const data = await gql<{ search: SearchResultDto }>({
    query: `
      query Search($q: String!, $first: Int!, $filter: SearchFilterInput, $sort: String) {
        search(q: $q, first: $first, filter: $filter, sort: $sort) {
          hits { id slug title priceMinor inStock brandId categoryId ratingAvg image }
          estimatedTotalHits
          facetsJson
        }
      }
    `,
    variables: {
      q: args.q,
      first: args.first ?? 24,
      filter: args.filter ?? {},
      sort: args.sort ?? undefined,
    },
    cache: "no-store",
  });
  return data.search;
}

export interface ProductReviewWire {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  verifiedPurchase: boolean;
  status: string;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt?: string | null;
  reviewerName?: string | null;
}

export async function productReviews(
  productId: string
): Promise<ProductReviewWire[]> {
  const data = await gql<{ productReviews: ProductReviewWire[] }>({
    query: `
      query Reviews($productId: String!) {
        productReviews(productId: $productId) {
          id rating title body verifiedPurchase status
          helpfulCount notHelpfulCount createdAt reviewerName
        }
      }
    `,
    variables: { productId },
    next: { revalidate: 60, tags: [`reviews:${productId}`] },
  });
  return data.productReviews;
}

export async function productQuestions(productId: string) {
  const data = await gql<{
    productQuestions: Array<{
      id: string;
      question: string;
      status: string;
      upvotes: number;
      createdAt: string;
      answers: Array<{
        id: string;
        answer: string;
        isOfficial: boolean;
        upvotes: number;
        createdAt: string;
      }>;
    }>;
  }>({
    query: `
      query QnA($productId: String!) {
        productQuestions(productId: $productId) {
          id question status upvotes createdAt
          answers { id answer isOfficial upvotes createdAt }
        }
      }
    `,
    variables: { productId },
    next: { revalidate: 60, tags: [`qna:${productId}`] },
  });
  return data.productQuestions;
}
