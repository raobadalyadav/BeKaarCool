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
  costMinor?: string | null;
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
  videos?: string[];
  view360Images?: string[];
  variants: VariantDto[];
  createdAt: string;
  // Extended fields
  shortDescription?: string;
  highlights: string[];
  tags: string[];
  specificationsJson?: string;
  attributesJson?: string;
}

export interface AdminDashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenueMinor: string;
  pendingOrders: number;
  lowStockVariants: number;
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
  productCount?: number;
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
  type?: string;
  visibility?: string;
  description?: string;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  quantity: number;
  priceMinor: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  productImage?: string | null;
  sku: string;
  compareAtMinor?: string | null;
  /** JSON-stringified Record<string,string> */
  optionsJson: string;
  savedForLater: boolean;
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
  variantOptionsJson: string;
  productSlug?: string | null;
  productImage?: string | null;
  cancelledQuantity: number;
  returnedQuantity: number;
}

export interface OrderShippingAddressDto {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
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
  couponCode?: string | null;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  shippingAddress?: OrderShippingAddressDto | null;
  paymentMethod?: string | null;
  paymentStatus?: string;
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
  productSlug?: string | null;
  productTitle?: string | null;
  productImage?: string | null;
  priceMinor?: string | null;
  compareAtMinor?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number | null;
  inStock?: boolean | null;
  defaultVariantId?: string | null;
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
  createdAt?: string | null;
  reviewerName?: string | null;
  images?: string[];
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
  image?: string;
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
  minOrderMinor?: string;
  maxDiscountMinor?: string;
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
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
}
