// Shared GraphQL response types — mirrors the backend's @ObjectType DTOs.
// Keep in sync with apps/api/src/modules in the backend repo.

export interface BackendUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  emailVerified: boolean;
}

export interface VariantDto {
  id: string;
  sku: string;
  /** money in minor units (paise) as string */
  priceMinor: string;
  compareAtMinor?: string | null;
  weightGrams?: number | null;
  /** JSON-stringified Record<string,string> */
  optionsJson: string;
  inStock: boolean;
}

export interface ProductDto {
  id: string;
  slug: string;
  title: string;
  descriptionHtml?: string;
  status: "draft" | "published" | "archived";
  ratingAvg: number;
  ratingCount: number;
  brandId?: string;
  categoryId?: string;
  images: string[];
  variants: VariantDto[];
  createdAt: string;
}

export interface ProductEdge {
  cursor: string;
  node: ProductDto;
}

export interface PageInfoDto {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

export interface ProductConnection {
  edges: ProductEdge[];
  pageInfo: PageInfoDto;
  totalCount?: number;
}

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  descriptionHtml?: string;
  parentId?: string;
}

export interface BrandDto {
  id: string;
  slug: string;
  name: string;
}

export interface CollectionDto {
  id: string;
  slug: string;
  name: string;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  quantity: number;
  priceMinor: string;
}

export interface CartDto {
  id: string;
  currency: string;
  items: CartItemDto[];
  subtotalMinor: string;
}

export interface AddressDto {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItemDto {
  id: string;
  variantId: string;
  productTitleSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceMinor: string;
  totalMinor: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_pending"
  | "return_approved"
  | "returned"
  | "refunded";

export interface OrderDto {
  id: string;
  number: string;
  status: OrderStatus;
  currency: string;
  subtotalMinor: string;
  shippingMinor: string;
  taxMinor: string;
  discountMinor: string;
  totalMinor: string;
  placedAt: string;
  items: OrderItemDto[];
}

export interface CheckoutSessionDto {
  sessionId: string;
  subtotalMinor?: string;
  shippingMinor?: string;
  discountMinor?: string;
  items?: number;
}

export interface PaymentIntentDto {
  orderNumber: string;
  providerOrderId: string;
  publicKey: string;
  amountMinor: string;
  currency: string;
  method: "razorpay" | "cod";
}

export interface ShippingRateDto {
  methodCode: string;
  name: string;
  amountMinor: string;
  etaDays: number;
  provider: "delhivery" | "manual" | "free";
}

export interface ServiceabilityDto {
  pincode: string;
  serviceable: boolean;
  cod: boolean;
  prepaid: boolean;
  city?: string;
  state?: string;
  maxCodAmount: number;
}

export interface WishlistItemDto {
  id: string;
  productId: string;
  createdAt: string;
}

export interface ReviewDto {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  verifiedPurchase: boolean;
  status: "pending" | "approved" | "rejected";
  helpfulCount: number;
  notHelpfulCount: number;
}

export interface SearchHitDto {
  id: string;
  slug: string;
  title: string;
  priceMinor: string;
  inStock: boolean;
  brandId?: string;
  categoryId?: string;
  ratingAvg: number;
}

export interface SearchResultDto {
  hits: SearchHitDto[];
  estimatedTotalHits: number;
  facetsJson?: string;
}

export interface CouponDto {
  id: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping" | "bogo" | "tiered";
  valueMinor?: string;
  percentBps?: number;
  usageCount: number;
  usageLimit?: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface NotificationDto {
  id: string;
  channel: string;
  template: string;
  subject?: string;
  status: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface SessionDto {
  id: string;
  sessionId: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface ContentItemDto {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  bodyHtml?: string;
}
