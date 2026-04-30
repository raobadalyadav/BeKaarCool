import { gql } from "./client";
import type {
  CheckoutSessionDto,
  PaymentIntentDto,
  ShippingRateDto,
  ServiceabilityDto,
} from "./types";

const CHECKOUT_FIELDS = `sessionId subtotalMinor shippingMinor discountMinor items`;

export async function startCheckout(): Promise<CheckoutSessionDto> {
  const data = await gql<{ startCheckout: CheckoutSessionDto }>({
    query: `mutation { startCheckout { ${CHECKOUT_FIELDS} } }`,
  });
  return data.startCheckout;
}

export async function setCheckoutAddress(
  sessionId: string,
  addressId: string
): Promise<CheckoutSessionDto> {
  const data = await gql<{ setCheckoutAddress: CheckoutSessionDto }>({
    query: `
      mutation SetAddr($sessionId: String!, $addressId: String!) {
        setCheckoutAddress(sessionId: $sessionId, addressId: $addressId) { ${CHECKOUT_FIELDS} }
      }
    `,
    variables: { sessionId, addressId },
  });
  return data.setCheckoutAddress;
}

export async function setCheckoutShipping(
  sessionId: string,
  methodCode: string
): Promise<CheckoutSessionDto> {
  const data = await gql<{ setCheckoutShipping: CheckoutSessionDto }>({
    query: `
      mutation SetShip($sessionId: String!, $methodCode: String!) {
        setCheckoutShipping(sessionId: $sessionId, methodCode: $methodCode) { ${CHECKOUT_FIELDS} }
      }
    `,
    variables: { sessionId, methodCode },
  });
  return data.setCheckoutShipping;
}

export async function setPaymentMethod(
  sessionId: string,
  method: "razorpay" | "cod"
): Promise<CheckoutSessionDto> {
  const data = await gql<{ setPaymentMethod: CheckoutSessionDto }>({
    query: `
      mutation SetMethod($sessionId: String!, $method: String!) {
        setPaymentMethod(sessionId: $sessionId, method: $method) { ${CHECKOUT_FIELDS} }
      }
    `,
    variables: { sessionId, method },
  });
  return data.setPaymentMethod;
}

export async function applyCoupon(
  sessionId: string,
  code: string
): Promise<CheckoutSessionDto> {
  const data = await gql<{ applyCoupon: CheckoutSessionDto }>({
    query: `
      mutation Coupon($sessionId: String!, $code: String!) {
        applyCoupon(sessionId: $sessionId, code: $code) { ${CHECKOUT_FIELDS} }
      }
    `,
    variables: { sessionId, code },
  });
  return data.applyCoupon;
}

export async function removeCoupon(
  sessionId: string
): Promise<CheckoutSessionDto> {
  const data = await gql<{ removeCoupon: CheckoutSessionDto }>({
    query: `
      mutation RemoveCoupon($sessionId: String!) {
        removeCoupon(sessionId: $sessionId) { ${CHECKOUT_FIELDS} }
      }
    `,
    variables: { sessionId },
  });
  return data.removeCoupon;
}

export async function initiatePayment(
  sessionId: string
): Promise<PaymentIntentDto> {
  const data = await gql<{ initiatePayment: PaymentIntentDto }>({
    query: `
      mutation Init($sessionId: String!) {
        initiatePayment(sessionId: $sessionId) {
          orderNumber providerOrderId publicKey amountMinor currency method
        }
      }
    `,
    variables: { sessionId },
  });
  return data.initiatePayment;
}

export async function shippingRates(args: {
  originPincode: string;
  destPincode: string;
  weightGrams?: number;
  cod?: boolean;
  declaredValueMinor?: string;
}): Promise<ShippingRateDto[]> {
  const data = await gql<{ shippingRates: ShippingRateDto[] }>({
    query: `
      query Rates($originPincode: String!, $destPincode: String!, $weightGrams: Int, $cod: Boolean, $declaredValueMinor: String) {
        shippingRates(
          originPincode: $originPincode,
          destPincode: $destPincode,
          weightGrams: $weightGrams,
          cod: $cod,
          declaredValueMinor: $declaredValueMinor
        ) {
          methodCode name amountMinor etaDays provider
        }
      }
    `,
    variables: {
      originPincode: args.originPincode,
      destPincode: args.destPincode,
      weightGrams: args.weightGrams ?? 1000,
      cod: args.cod ?? false,
      declaredValueMinor: args.declaredValueMinor ?? null,
    },
    cache: "no-store",
  });
  return data.shippingRates;
}

export async function checkPincode(
  pincode: string
): Promise<ServiceabilityDto> {
  const data = await gql<{ checkPincode: ServiceabilityDto }>({
    query: `
      query Pin($pincode: String!) {
        checkPincode(pincode: $pincode) {
          pincode serviceable cod prepaid city state maxCodAmount
        }
      }
    `,
    variables: { pincode },
    next: { revalidate: 86_400, tags: [`pin:${pincode}`] },
  });
  return data.checkPincode;
}
