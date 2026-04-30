/**
 * Backend integration config — points at the NestJS API.
 * Server-side reads BACKEND_URL; client-side reads NEXT_PUBLIC_API_URL.
 */

export const API_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export const GRAPHQL_URL = `${API_URL}/graphql`;

export const COOKIE_ACCESS = "bf_access";
export const COOKIE_REFRESH = "bf_refresh";
export const COOKIE_ANON_CART = "bf_anon_cart";

export const MINOR_PER_RUPEE = 100;

export const formatINR = (minor: string | number | bigint): string => {
  const n =
    typeof minor === "bigint" ? Number(minor) : Number(minor.toString());
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n / MINOR_PER_RUPEE);
};

export const minorToRupees = (minor: string | number | bigint): number => {
  const n =
    typeof minor === "bigint" ? Number(minor) : Number(minor.toString());
  return n / MINOR_PER_RUPEE;
};

export const rupeesToMinor = (rupees: number): string =>
  Math.round(rupees * MINOR_PER_RUPEE).toString();
