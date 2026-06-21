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
