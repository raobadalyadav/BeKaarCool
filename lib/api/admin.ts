import { gql } from "./client";
import type { ProductDto, VariantDto, CategoryDto, BrandDto, AdminDashboardStats } from "./types";

const PRODUCT_FIELDS = `
  id slug title descriptionHtml status
  ratingAvg ratingCount brandId categoryId
  images createdAt
  shortDescription highlights tags specificationsJson attributesJson
  variants { id sku priceMinor compareAtMinor costMinor weightGrams optionsJson inStock }
`;

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const data = await gql<{ adminDashboardStats: AdminDashboardStats }>({
    query: `query { adminDashboardStats {
      totalProducts totalOrders totalCustomers
      totalRevenueMinor pendingOrders lowStockVariants
    }}`,
    cache: "no-store",
  });
  return data.adminDashboardStats;
}

// ─── Products ─────────────────────────────────────────────────────────────

export async function adminListProducts(args?: {
  first?: number;
  after?: string;
  status?: "draft" | "published" | "archived";
}): Promise<{ edges: Array<{ cursor: string; node: ProductDto }> }> {
  const data = await gql<{ products: { edges: Array<{ cursor: string; node: ProductDto }> } }>({
    query: `
      query AdminProducts($first: Int!, $after: String, $status: ProductStatus) {
        products(first: $first, after: $after, status: $status) {
          edges { cursor node { ${PRODUCT_FIELDS} } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `,
    variables: {
      first: args?.first ?? 50,
      after: args?.after ?? null,
      status: args?.status ?? null,
    },
    cache: "no-store",
  });
  return data.products;
}

export async function adminCreateProduct(input: {
  slug: string;
  title: string;
  descriptionDocJson?: string;
  brandId?: string;
  categoryId?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: "draft" | "published" | "archived";
  shortDescription?: string;
  highlightsJson?: string;
  tagsJson?: string;
  specificationsJson?: string;
  imagesJson?: string;
  fashionAttrsJson?: string;
}): Promise<ProductDto> {
  const data = await gql<{ adminCreateProduct: ProductDto }>({
    query: `
      mutation AdminCreateProduct($input: CreateProductInput!) {
        adminCreateProduct(input: $input) { ${PRODUCT_FIELDS} }
      }
    `,
    variables: { input },
    cache: "no-store",
  });
  return data.adminCreateProduct;
}

export async function adminUpdateProduct(
  id: string,
  input: {
    slug?: string;
    title?: string;
    descriptionDocJson?: string;
    brandId?: string;
    categoryId?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: "draft" | "published" | "archived";
    shortDescription?: string;
    highlightsJson?: string;
    tagsJson?: string;
    specificationsJson?: string;
    imagesJson?: string;
    fashionAttrsJson?: string;
  }
): Promise<ProductDto> {
  const data = await gql<{ adminUpdateProduct: ProductDto }>({
    query: `
      mutation AdminUpdateProduct($id: String!, $input: UpdateProductInput!) {
        adminUpdateProduct(id: $id, input: $input) { ${PRODUCT_FIELDS} }
      }
    `,
    variables: { id, input },
    cache: "no-store",
  });
  return data.adminUpdateProduct;
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  const data = await gql<{ adminDeleteProduct: boolean }>({
    query: `mutation AdminDeleteProduct($id: String!) { adminDeleteProduct(id: $id) }`,
    variables: { id },
    cache: "no-store",
  });
  return data.adminDeleteProduct;
}

// ─── Variants ─────────────────────────────────────────────────────────────

export async function adminCreateVariant(input: {
  productId: string;
  sku: string;
  priceMinor: string;
  compareAtMinor?: string;
  costMinor?: string;
  weightGrams?: number;
  optionsJson?: string;
}): Promise<VariantDto> {
  const data = await gql<{ adminCreateVariant: VariantDto }>({
    query: `
      mutation AdminCreateVariant($input: CreateVariantInput!) {
        adminCreateVariant(input: $input) {
          id sku priceMinor compareAtMinor costMinor weightGrams optionsJson inStock
        }
      }
    `,
    variables: { input },
    cache: "no-store",
  });
  return data.adminCreateVariant;
}

export async function adminUpdateVariant(
  id: string,
  input: {
    sku?: string;
    priceMinor?: string;
    compareAtMinor?: string | null;
    costMinor?: string | null;
    weightGrams?: number;
    optionsJson?: string;
  }
): Promise<VariantDto> {
  const data = await gql<{ adminUpdateVariant: VariantDto }>({
    query: `
      mutation AdminUpdateVariant($id: String!, $input: UpdateVariantInput!) {
        adminUpdateVariant(id: $id, input: $input) {
          id sku priceMinor compareAtMinor costMinor weightGrams optionsJson inStock
        }
      }
    `,
    variables: { id, input },
    cache: "no-store",
  });
  return data.adminUpdateVariant;
}

export async function adminDeleteVariant(id: string): Promise<boolean> {
  const data = await gql<{ adminDeleteVariant: boolean }>({
    query: `mutation AdminDeleteVariant($id: String!) { adminDeleteVariant(id: $id) }`,
    variables: { id },
    cache: "no-store",
  });
  return data.adminDeleteVariant;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function adminCreateCategory(input: {
  slug: string;
  name: string;
  parentId?: string;
}): Promise<CategoryDto> {
  const data = await gql<{ adminCreateCategory: CategoryDto }>({
    query: `
      mutation AdminCreateCategory($slug: String!, $name: String!, $parentId: String) {
        adminCreateCategory(slug: $slug, name: $name, parentId: $parentId) { id slug name parentId }
      }
    `,
    variables: input,
    cache: "no-store",
  });
  return data.adminCreateCategory;
}

export async function adminUpdateCategory(
  id: string,
  input: { slug?: string; name?: string; parentId?: string }
): Promise<CategoryDto> {
  const data = await gql<{ adminUpdateCategory: CategoryDto }>({
    query: `
      mutation AdminUpdateCategory($id: String!, $slug: String, $name: String, $parentId: String) {
        adminUpdateCategory(id: $id, slug: $slug, name: $name, parentId: $parentId) { id slug name parentId }
      }
    `,
    variables: { id, ...input },
    cache: "no-store",
  });
  return data.adminUpdateCategory;
}

export async function adminDeleteCategory(id: string): Promise<boolean> {
  const data = await gql<{ adminDeleteCategory: boolean }>({
    query: `mutation AdminDeleteCategory($id: String!) { adminDeleteCategory(id: $id) }`,
    variables: { id },
    cache: "no-store",
  });
  return data.adminDeleteCategory;
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export async function adminCreateBrand(input: { slug: string; name: string }): Promise<BrandDto> {
  const data = await gql<{ adminCreateBrand: BrandDto }>({
    query: `
      mutation AdminCreateBrand($slug: String!, $name: String!) {
        adminCreateBrand(slug: $slug, name: $name) { id slug name }
      }
    `,
    variables: input,
    cache: "no-store",
  });
  return data.adminCreateBrand;
}

export async function adminUpdateBrand(
  id: string,
  input: { slug?: string; name?: string }
): Promise<BrandDto> {
  const data = await gql<{ adminUpdateBrand: BrandDto }>({
    query: `
      mutation AdminUpdateBrand($id: String!, $slug: String, $name: String) {
        adminUpdateBrand(id: $id, slug: $slug, name: $name) { id slug name }
      }
    `,
    variables: { id, ...input },
    cache: "no-store",
  });
  return data.adminUpdateBrand;
}

export async function adminDeleteBrand(id: string): Promise<boolean> {
  const data = await gql<{ adminDeleteBrand: boolean }>({
    query: `mutation AdminDeleteBrand($id: String!) { adminDeleteBrand(id: $id) }`,
    variables: { id },
    cache: "no-store",
  });
  return data.adminDeleteBrand;
}

// ─── Orders (admin) ───────────────────────────────────────────────────────

export async function adminListOrders(args?: { first?: number; after?: string }) {
  const data = await gql<{
    orders: Array<{
      id: string;
      number: string;
      status: string;
      totalMinor: string;
      placedAt: string;
      userId: string;
    }>;
  }>({
    query: `
      query AdminOrders($first: Int, $after: String) {
        orders(first: $first, after: $after) {
          id number status totalMinor placedAt userId
        }
      }
    `,
    variables: { first: args?.first ?? 50, after: args?.after },
    cache: "no-store",
  });
  return data.orders;
}

export async function adminTransitionOrder(id: string, to: string, note?: string) {
  const data = await gql<{ adminTransitionOrder: { id: string; status: string } }>({
    query: `
      mutation AdminTransitionOrder($id: String!, $to: String!, $note: String) {
        adminTransitionOrder(id: $id, to: $to, note: $note) { id status }
      }
    `,
    variables: { id, to, note },
    cache: "no-store",
  });
  return data.adminTransitionOrder;
}

// ─── Inventory ────────────────────────────────────────────────────────────

export async function adminAdjustInventory(
  variantId: string,
  delta: number,
  reason: string
): Promise<boolean> {
  const data = await gql<{ adminAdjustInventory: boolean }>({
    query: `
      mutation AdminAdjustInventory($variantId: String!, $delta: Int!, $reason: String!) {
        adminAdjustInventory(variantId: $variantId, delta: $delta, reason: $reason)
      }
    `,
    variables: { variantId, delta, reason },
    cache: "no-store",
  });
  return data.adminAdjustInventory;
}

export async function getStockFor(variantIds: string[]) {
  const data = await gql<{
    stockFor: Array<{ variantId: string; onHand: number; reserved: number; available: number }>;
  }>({
    query: `
      query StockFor($variantIds: [String!]!) {
        stockFor(variantIds: $variantIds) { variantId onHand reserved available }
      }
    `,
    variables: { variantIds },
    cache: "no-store",
  });
  return data.stockFor;
}

// ─── Coupons ──────────────────────────────────────────────────────────────

export async function adminListCoupons() {
  const data = await gql<{
    coupons: Array<{
      id: string;
      code: string;
      type: string;
      valueMinor?: string;
      percentBps?: number;
      usageCount: number;
      usageLimit?: number;
      isActive: boolean;
      startsAt?: string;
      endsAt?: string;
    }>;
  }>({
    query: `
      query AdminCoupons {
        coupons(activeOnly: false) {
          id code type valueMinor percentBps
          usageCount usageLimit isActive startsAt endsAt
        }
      }
    `,
    cache: "no-store",
  });
  return data.coupons;
}

export async function adminToggleCoupon(id: string, active: boolean): Promise<boolean> {
  const data = await gql<{ adminToggleCoupon: boolean }>({
    query: `
      mutation AdminToggleCoupon($id: String!, $active: Boolean!) {
        adminToggleCoupon(id: $id, active: $active)
      }
    `,
    variables: { id, active },
    cache: "no-store",
  });
  return data.adminToggleCoupon;
}

// ─── Collections ─────────────────────────────────────────────────────────

export async function adminListCollections() {
  const data = await gql<{
    collections: Array<{ id: string; slug: string; name: string; type: string; visibility: string }>;
  }>({
    query: `query AdminCollections { collections { id slug name type visibility } }`,
    cache: "no-store",
  });
  return data.collections;
}

export async function adminCreateCollection(input: {
  slug: string;
  name: string;
  type?: string;
}): Promise<{ id: string; slug: string; name: string; type: string }> {
  const data = await gql<{ adminCreateCollection: { id: string; slug: string; name: string; type: string } }>({
    query: `
      mutation AdminCreateCollection($slug: String!, $name: String!, $type: String) {
        adminCreateCollection(slug: $slug, name: $name, type: $type) { id slug name type }
      }
    `,
    variables: { slug: input.slug, name: input.name, type: input.type ?? "manual" },
    cache: "no-store",
  });
  return data.adminCreateCollection;
}

export async function adminAddProductToCollection(collectionId: string, productId: string): Promise<boolean> {
  const data = await gql<{ adminAddProductToCollection: boolean }>({
    query: `
      mutation AdminAddToCollection($collectionId: String!, $productId: String!) {
        adminAddProductToCollection(collectionId: $collectionId, productId: $productId)
      }
    `,
    variables: { collectionId, productId },
    cache: "no-store",
  });
  return data.adminAddProductToCollection;
}

export async function adminRemoveProductFromCollection(collectionId: string, productId: string): Promise<boolean> {
  const data = await gql<{ adminRemoveProductFromCollection: boolean }>({
    query: `
      mutation AdminRemoveFromCollection($collectionId: String!, $productId: String!) {
        adminRemoveProductFromCollection(collectionId: $collectionId, productId: $productId)
      }
    `,
    variables: { collectionId, productId },
    cache: "no-store",
  });
  return data.adminRemoveProductFromCollection;
}

// ─── Reviews (Admin) ──────────────────────────────────────────────────────

export async function adminListReviews(args?: { first?: number; status?: string; productId?: string }) {
  const data = await gql<{
    adminListReviews: Array<{
      id: string;
      productId: string;
      productTitle: string;
      rating: number;
      title?: string;
      body?: string;
      images?: string[];
      verifiedPurchase: boolean;
      status: string;
      helpfulCount: number;
      notHelpfulCount: number;
      createdAt?: string;
      reviewerName?: string;
    }>;
  }>({
    query: `
      query AdminListReviews($first: Int, $status: String, $productId: String) {
        adminListReviews(first: $first, status: $status, productId: $productId) {
          id productId productTitle rating title body images
          verifiedPurchase status helpfulCount notHelpfulCount createdAt reviewerName
        }
      }
    `,
    variables: {
      first: args?.first ?? 100,
      status: args?.status ?? null,
      productId: args?.productId ?? null,
    },
    cache: "no-store",
  });
  return data.adminListReviews;
}

export async function adminModerateReview(reviewId: string, status: "approved" | "rejected"): Promise<boolean> {
  const data = await gql<{ adminModerateReview: boolean }>({
    query: `
      mutation AdminModerateReview($reviewId: String!, $status: String!) {
        adminModerateReview(reviewId: $reviewId, status: $status)
      }
    `,
    variables: { reviewId, status },
    cache: "no-store",
  });
  return data.adminModerateReview;
}

export async function adminDeleteReview(id: string): Promise<boolean> {
  const data = await gql<{ adminDeleteReview: boolean }>({
    query: `mutation AdminDeleteReview($id: String!) { adminDeleteReview(id: $id) }`,
    variables: { id },
    cache: "no-store",
  });
  return data.adminDeleteReview;
}

// ─── Inventory Ledger & Low Stock ─────────────────────────────────────────

export async function adminInventoryLedger(variantId?: string, limit = 100) {
  const data = await gql<{
    adminInventoryLedger: Array<{
      id: string;
      variantId: string;
      sku?: string;
      productTitle?: string;
      delta: number;
      field: string;
      reason: string;
      referenceType?: string;
      referenceId?: string;
      createdAt: string;
    }>;
  }>({
    query: `
      query AdminInventoryLedger($variantId: String, $limit: Int) {
        adminInventoryLedger(variantId: $variantId, limit: $limit) {
          id variantId sku productTitle delta field reason referenceType referenceId createdAt
        }
      }
    `,
    variables: { variantId: variantId ?? null, limit },
    cache: "no-store",
  });
  return data.adminInventoryLedger;
}

export async function adminLowStockVariants(threshold = 10) {
  const data = await gql<{
    adminLowStockVariants: Array<{
      variantId: string;
      available: number;
      sku?: string;
      productTitle?: string;
      optionsLabel?: string;
      onHand: number;
      reserved: number;
    }>;
  }>({
    query: `
      query AdminLowStockVariants($threshold: Int) {
        adminLowStockVariants(threshold: $threshold) {
          variantId available sku productTitle optionsLabel onHand reserved
        }
      }
    `,
    variables: { threshold },
    cache: "no-store",
  });
  return data.adminLowStockVariants;
}

// ─── Analytics ────────────────────────────────────────────────────────────

export async function adminSalesReport(days = 30) {
  const data = await gql<{
    adminSalesReport: Array<{
      date: string;
      totalMinor: string;
      orderCount: number;
    }>;
  }>({
    query: `
      query AdminSalesReport($days: Int) {
        adminSalesReport(days: $days) { date totalMinor orderCount }
      }
    `,
    variables: { days },
    cache: "no-store",
  });
  return data.adminSalesReport;
}

export async function adminProductAnalytics(limit = 10) {
  const data = await gql<{
    adminProductAnalytics: Array<{
      productId: string;
      productTitle: string;
      unitsSold: number;
      revenueMinor: string;
    }>;
  }>({
    query: `
      query AdminProductAnalytics($limit: Int) {
        adminProductAnalytics(limit: $limit) { productId productTitle unitsSold revenueMinor }
      }
    `,
    variables: { limit },
    cache: "no-store",
  });
  return data.adminProductAnalytics;
}

export async function adminCustomerAnalytics() {
  const data = await gql<{
    adminCustomerAnalytics: {
      totalCustomers: number;
      newThisMonth: number;
      returningCount: number;
      ordersThisMonth: number;
    };
  }>({
    query: `
      query AdminCustomerAnalytics {
        adminCustomerAnalytics { totalCustomers newThisMonth returningCount ordersThisMonth }
      }
    `,
    cache: "no-store",
  });
  return data.adminCustomerAnalytics;
}

// ─── Customers ────────────────────────────────────────────────────────────

export async function adminListCustomers() {
  const data = await gql<{
    adminListUsers: Array<{
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
  }>({
    query: `
      query AdminListUsers {
        adminListUsers { id email firstName lastName role status createdAt }
      }
    `,
    cache: "no-store",
  });
  return data.adminListUsers;
}
