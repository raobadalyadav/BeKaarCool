"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CreditCard,
  Banknote,
  Shield,
  Truck,
  Tag,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";
import * as checkoutApi from "@/lib/api/checkout";
import * as usersApi from "@/lib/api/users";
import { minorToRupees } from "@/lib/api/config";
import type { AddressDto, CheckoutSessionDto } from "@/lib/api/types";

type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void };

type PaymentMethod = "razorpay" | "cod";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { items, total, refresh: refreshCart } = useCart();

  const [step, setStep] = useState<"ADDRESS" | "PAYMENT">("ADDRESS");
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [session2, setSession2] = useState<CheckoutSessionDto | null>(null);
  const sessionId = session2?.sessionId ?? null;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [selectedShippingCode, setSelectedShippingCode] = useState<string>("shiprocket_surface");
  const [availableRates, setAvailableRates] = useState<Array<{ methodCode: string; name: string; amountMinor: string; etaDays: number | null }>>([]);

  const shippingMinor = session2?.shippingMinor;
  const discountMinor = session2?.discountMinor;
  const shippingRupees = shippingMinor ? minorToRupees(shippingMinor) : 0;
  const discountRupees = discountMinor ? minorToRupees(discountMinor) : 0;
  const grandTotal = Math.max(0, total + shippingRupees - discountRupees);

  const [newAddress, setNewAddress] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN",
  });

  useEffect(() => {
    // Removed forced redirect, allowing guest checkout
  }, [status, router]);

  useEffect(() => {
    if (status === "loading") return;
    (async () => {
      try {
        if (status === "authenticated") {
            const list = await usersApi.myAddresses();
            setAddresses(list);
            const def = list.find((a) => a.isDefault) ?? list[0];
            if (def) setSelectedAddressId(def.id);
        }
        const sess = await checkoutApi.startCheckout();
        setSession2(sess);
      } catch (e) {
        console.error("Checkout init failed:", e);
      }
    })();
  }, [status]);

  const handleSaveNewAddress = async () => {
    try {
      const created = await usersApi.createAddress(newAddress);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      toast({ title: "Address saved" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save address",
        variant: "destructive",
      });
    }
  };

  const handleNextStep = async () => {
    if (!sessionId || !selectedAddressId) {
      toast({ title: "Pick or add an address first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (status === "unauthenticated") {
        await checkoutApi.setGuestDetails(sessionId, newAddress.email || "guest@example.com", newAddress.phone, newAddress.name);
      }
      await checkoutApi.setCheckoutAddress(sessionId, selectedAddressId);

      // Resolve a real shipping method code from the backend
      const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
      let methodCode = "shiprocket_surface";
      if (selectedAddr?.pincode) {
        try {
          const totalItems = items.reduce((s, i) => s + i.quantity, 0);
          const rates = await checkoutApi.shippingRates({
            originPincode: "400001",
            destPincode: selectedAddr.pincode,
            weightGrams: Math.max(100, totalItems * 400),
            cod: paymentMethod === "cod",
            declaredValueMinor: String(Math.round(total * 100)),
          });
          if (rates.length > 0) {
            setAvailableRates(rates);
            const freeRate = rates.find((r) => r.amountMinor === "0");
            methodCode = (freeRate ?? rates[0]).methodCode;
            setSelectedShippingCode(methodCode);
          }
        } catch {
          // Non-fatal: fall through with default method code
        }
      }

      const shipped = await checkoutApi.setCheckoutShipping(sessionId, methodCode);
      setSession2((prev) => ({ ...(prev ?? { sessionId }), ...shipped }));
      setStep("PAYMENT");
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to set address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!sessionId || !couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const next = await checkoutApi.applyCoupon(
        sessionId,
        couponCode.trim().toUpperCase()
      );
      setSession2((prev) => ({ ...(prev ?? { sessionId }), ...next }));
      setAppliedCoupon(couponCode.trim().toUpperCase());
      toast({ title: "Coupon applied", description: couponCode.trim().toUpperCase() });
      setCouponCode("");
    } catch (e) {
      toast({
        title: "Coupon failed",
        description: e instanceof Error ? e.message : "Invalid coupon",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!sessionId) return;
    setCouponLoading(true);
    try {
      const next = await checkoutApi.removeCoupon(sessionId);
      setSession2((prev) => ({ ...(prev ?? { sessionId }), ...next, discountMinor: undefined }));
      setAppliedCoupon(null);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await checkoutApi.setPaymentMethod(sessionId, paymentMethod);
      const intent = await checkoutApi.initiatePayment(sessionId);

      if (paymentMethod === "cod") {
        toast({ title: "Order Placed!" });
        await refreshCart();
        router.push(
          `/order-confirmation?orderNumber=${intent.orderNumber}&success=true`
        );
        return;
      }

      const options: Record<string, unknown> = {
        key: intent.publicKey,
        amount: Number(intent.amountMinor),
        currency: intent.currency,
        name: "Baefikra",
        description: `Order ${intent.orderNumber}`,
        order_id: intent.providerOrderId,
        handler: async () => {
          // Razorpay confirms via backend webhook; we just refresh and redirect.
          await refreshCart();
          router.push(
            `/order-confirmation?orderNumber=${intent.orderNumber}&success=true`
          );
        },
        prefill: {
          name: session?.user?.name ?? "",
          email: session?.user?.email ?? "",
        },
        theme: { color: "#FACC15" },
        modal: { ondismiss: () => setLoading(false) },
      };
      const RZP = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
      const rzp = new RZP(options);
      rzp.open();
    } catch (e) {
      toast({
        title: "Payment Failed",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your Bag is Empty</h2>
        <Button
          onClick={() => router.push("/products")}
          className="bg-[#F38508] text-black hover:bg-[#D97706]"
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            {/* Step 1: Address */}
            <div
              className={`border rounded-lg overflow-hidden bg-white ${step === "ADDRESS" ? "border-gray-300 shadow-sm" : "border-gray-200"
                }`}
            >
              <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "ADDRESS"
                        ? "bg-[#F38508] text-black"
                        : "bg-green-500 text-white"
                      }`}
                  >
                    {step === "ADDRESS" ? "1" : "✓"}
                  </span>
                  Delivery Address
                </h3>
                {step === "PAYMENT" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("ADDRESS")}
                    className="text-[#F38508] font-bold h-8"
                  >
                    CHANGE
                  </Button>
                )}
              </div>

              {step === "ADDRESS" ? (
                <div className="p-6 space-y-6">
                  {addresses.length > 0 && (
                    <RadioGroup
                      value={selectedAddressId ?? ""}
                      onValueChange={setSelectedAddressId}
                      className="space-y-3"
                    >
                      {addresses.map((a) => (
                        <label
                          key={a.id}
                          className={`flex gap-3 items-start border p-4 rounded cursor-pointer ${selectedAddressId === a.id
                              ? "border-[#F38508] bg-orange-50"
                              : "hover:border-gray-400"
                            }`}
                        >
                          <RadioGroupItem value={a.id} id={a.id} />
                          <div className="text-sm flex-1">
                            <p className="font-bold">{a.name}</p>
                            <p className="text-gray-600">
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}{" "}
                              {a.pincode}
                            </p>
                            {a.phone && (
                              <p className="text-gray-500">Phone: {a.phone}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  )}

                  <details className="border rounded p-4">
                    <summary className="cursor-pointer font-medium">
                      + Add a new address
                    </summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          value={newAddress.name}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      {status === "unauthenticated" && (
                          <div className="space-y-2">
                            <Label>Email (for order updates)</Label>
                            <Input
                              type="email"
                              value={newAddress.email}
                              onChange={(e) =>
                                setNewAddress({
                                  ...newAddress,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                      )}
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={newAddress.phone}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              phone: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Address Line 1</Label>
                        <Input
                          value={newAddress.line1}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              line1: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Line 2 (optional)</Label>
                        <Input
                          value={newAddress.line2}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              line2: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              city: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              state: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pincode</Label>
                        <Input
                          value={newAddress.pincode}
                          onChange={async (e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setNewAddress((prev) => ({ ...prev, pincode: val }));
                            
                            if (val.length === 6) {
                                try {
                                    const res = await usersApi.resolvePincode(val);
                                    if (res) {
                                        setNewAddress((prev) => ({
                                            ...prev,
                                            city: res.city,
                                            state: res.state
                                        }));
                                        toast({ title: "Pincode verified" });
                                    }
                                } catch(e) {
                                    console.error("Failed to resolve pincode:", e);
                                }
                            }
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          onClick={handleSaveNewAddress}
                          variant="outline"
                          className="w-full"
                        >
                          Save Address
                        </Button>
                      </div>
                    </div>
                  </details>

                  <Button
                    className="w-full md:w-auto bg-[#F38508] hover:bg-[#D97706] text-black font-bold"
                    onClick={handleNextStep}
                    disabled={!selectedAddressId || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking rates...
                      </>
                    ) : "SAVE & CONTINUE"}
                  </Button>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-600">
                  {(() => {
                    const a = addresses.find((x) => x.id === selectedAddressId);
                    if (!a) return null;
                    return (
                      <>
                        <p className="font-bold text-gray-900">{a.name}</p>
                        <p>
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}
                        </p>
                        <p>
                          {a.city}, {a.state} - {a.pincode}
                        </p>
                        {a.phone && <p>Phone: {a.phone}</p>}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            <div
              className={`border rounded-lg overflow-hidden bg-white ${step === "PAYMENT"
                  ? "border-gray-300 shadow-sm"
                  : "border-gray-200 opacity-60"
                }`}
            >
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === "PAYMENT"
                        ? "bg-[#F38508] text-black"
                        : "bg-gray-400 text-white"
                      }`}
                  >
                    2
                  </span>
                  Payment Method
                </h3>
              </div>

              {step === "PAYMENT" && (
                <div className="p-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                    className="space-y-3"
                  >
                    <label
                      className={`flex items-center space-x-3 border p-4 rounded cursor-pointer ${paymentMethod === "razorpay"
                          ? "border-[#F38508] bg-orange-50"
                          : "hover:border-gray-400"
                        }`}
                    >
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">
                            UPI / Cards / Net Banking
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pay with GPay, PhonePe, Credit/Debit Card via Razorpay
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center space-x-3 border p-4 rounded cursor-pointer ${paymentMethod === "cod"
                          ? "border-[#F38508] bg-orange-50"
                          : "hover:border-gray-400"
                        }`}
                    >
                      <RadioGroupItem value="cod" id="cod" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Cash On Delivery</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Pay when you receive your order
                        </p>
                      </div>
                    </label>
                  </RadioGroup>

                  <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                    <Shield className="h-4 w-4" />
                    <span>100% Secure Payments | SSL Encrypted</span>
                  </div>

                  <Button
                    className="w-full bg-[#F38508] hover:bg-[#D97706] text-black font-bold h-12 mt-6"
                    onClick={handlePlaceOrder}
                    disabled={
                      loading ||
                      (!razorpayLoaded && paymentMethod === "razorpay")
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : paymentMethod === "cod" ? (
                      `PLACE ORDER • ₹${grandTotal.toLocaleString()}`
                    ) : (
                      `PAY ₹${grandTotal.toLocaleString()}`
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[340px]">
            <div className="border rounded-lg bg-white p-5 sticky top-24">
              <h4 className="text-gray-500 text-xs font-bold uppercase mb-4">
                Order Summary ({items.length} items)
              </h4>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="relative h-14 w-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden border">
                      {item.productImage && (
                        <Image
                          src={item.productImage}
                          alt={item.productTitle}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{item.productTitle}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium whitespace-nowrap">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="h-8"
                    disabled={!!appliedCoupon || couponLoading}
                  />
                  {appliedCoupon ? (
                    <Button size="sm" variant="ghost" onClick={handleRemoveCoupon} disabled={couponLoading} className="px-2">
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                      Apply
                    </Button>
                  )}
                </div>

                {appliedCoupon && (
                  <div className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                    <strong>{appliedCoupon}</strong> applied
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Shipping
                  </span>
                  <span>{shippingRupees === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${shippingRupees.toLocaleString()}`}</span>
                </div>
                {discountRupees > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>− ₹{discountRupees.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
