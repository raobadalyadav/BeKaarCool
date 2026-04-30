"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";
import * as checkoutApi from "@/lib/api/checkout";
import * as usersApi from "@/lib/api/users";
import type { AddressDto } from "@/lib/api/types";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [newAddress, setNewAddress] = useState({
    name: session?.user?.name ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "IN",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const list = await usersApi.myAddresses();
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) setSelectedAddressId(def.id);
        const sess = await checkoutApi.startCheckout();
        setSessionId(sess.sessionId);
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
    try {
      await checkoutApi.setCheckoutAddress(sessionId, selectedAddressId);
      setStep("PAYMENT");
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to set address",
        variant: "destructive",
      });
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
          className="bg-yellow-400 text-black hover:bg-yellow-500"
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
                        ? "bg-yellow-400 text-black"
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
                    className="text-yellow-600 font-bold h-8"
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
                              ? "border-yellow-400 bg-yellow-50"
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
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              pincode: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6),
                            })
                          }
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
                    className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                    onClick={handleNextStep}
                    disabled={!selectedAddressId}
                  >
                    SAVE & CONTINUE
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
                        ? "bg-yellow-400 text-black"
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
                          ? "border-yellow-400 bg-yellow-50"
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
                          ? "border-yellow-400 bg-yellow-50"
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
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-12 mt-6"
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
                      `PLACE ORDER • ₹${total.toLocaleString()}`
                    ) : (
                      `PAY ₹${total.toLocaleString()}`
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

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        Variant {item.variantId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{items.length - 3} more items
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 bg-green-50 text-green-700 text-xs font-medium px-3 py-2 rounded flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Free shipping on this order
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
