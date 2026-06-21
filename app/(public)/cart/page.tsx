"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Truck,
  Shield,
  RotateCcw,
  Bookmark,
  ArrowUp,
  Tag,
  Gift,
  FileText,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const {
    items: allItems,
    total: subtotal,
    loading,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    cart,
    updateMeta,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [notes, setNotes] = useState(cart?.notes ?? "");
  const [giftMessage, setGiftMessage] = useState(cart?.giftMessage ?? "");
  const [couponCode, setCouponCode] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (cart) {
      setNotes(cart.notes ?? "");
      setGiftMessage(cart.giftMessage ?? "");
    }
  }, [cart?.notes, cart?.giftMessage]);

  const items = allItems.filter((it) => !it.savedForLater);
  const savedItems = allItems.filter((it) => it.savedForLater);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/cart");
    }
  }, [status, router]);

  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);
  const discountMinor = cart?.discountMinor ? Number(cart.discountMinor) / 100 : 0;
  const finalTotal = Math.max(0, subtotal + shipping + tax - discountMinor);
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleUpdate = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    setUpdating(itemId);
    try {
      await updateQuantity(itemId, qty);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await removeFromCart(itemId);
      toast({ title: "Removed", description: "Item removed from cart" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to remove",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveForLater = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await saveForLater(itemId);
      toast({ title: "Saved for later" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleMoveToCart = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await moveToCart(itemId);
      toast({ title: "Moved to cart" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
      await updateMeta(notes, giftMessage);
      toast({ title: "Saved successfully" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSavingMeta(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      toast({ title: "Coupon Applied" });
      setCouponCode("");
    } catch (e) {
      toast({ title: "Invalid Coupon", variant: "destructive" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setApplyingCoupon(true);
    try {
      await removeCoupon();
      toast({ title: "Coupon Removed" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="h-28 w-24 rounded" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-9 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-[#F38508]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven&apos;t added anything yet. Discover the latest
            arrivals and deals.
          </p>
          <Link href="/products">
            <Button size="lg" className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <Badge className="ml-4">{items.length} {items.length === 1 ? "item" : "items"}</Badge>
        </div>

        {remainingForFreeShip > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-md px-4 py-3 text-sm flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Add <strong>₹{remainingForFreeShip.toLocaleString()}</strong> more to unlock <strong>FREE shipping</strong>.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const optionPills = Object.entries(item.options ?? {}).filter(
                ([k]) => k !== "image"
              );
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="relative h-40 w-32 sm:h-32 sm:w-28 flex-shrink-0 bg-gray-100 rounded overflow-hidden border"
                      >
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productTitle}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-semibold text-gray-900 hover:text-[#F38508] line-clamp-2"
                        >
                          {item.productTitle}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          SKU: {item.sku}
                        </p>
                        {optionPills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {optionPills.map(([k, v]) => (
                              <Badge
                                key={k}
                                variant="outline"
                                className="text-[10px] px-2 py-0 h-5 capitalize"
                              >
                                {k}: {v}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center border rounded">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-9 w-9"
                              onClick={() => handleUpdate(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updating === item.id}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-10 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none h-9 w-9"
                              onClick={() => handleUpdate(item.id, item.quantity + 1)}
                              disabled={updating === item.id}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveForLater(item.id)}
                            disabled={updating === item.id}
                            className="text-gray-600 hover:bg-gray-50 h-9"
                          >
                            <Bookmark className="h-4 w-4 mr-1" />
                            Save for later
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.id)}
                            disabled={updating === item.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="text-right sm:min-w-[120px]">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        {item.compareAt && item.compareAt > item.price && (
                          <p className="text-xs text-gray-400 line-through">
                            ₹{(item.compareAt * item.quantity).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          ₹{item.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {savedItems.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Bookmark className="w-5 h-5" /> Saved for later ({savedItems.length})
                </h2>
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardContent className="p-4 flex items-center gap-4">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="relative h-20 w-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden border"
                        >
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productTitle}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : null}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.productSlug}`}
                            className="font-medium text-sm line-clamp-2 hover:text-[#F38508]"
                          >
                            {item.productTitle}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            SKU: {item.sku}
                          </p>
                          <p className="text-sm font-bold mt-1">
                            ₹{item.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleMoveToCart(item.id)}
                            disabled={updating === item.id}
                            className="bg-[#F38508] hover:bg-[#D97706] text-black font-bold h-8 text-xs"
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Move to cart
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.id)}
                            disabled={updating === item.id}
                            className="text-red-600 hover:bg-red-50 h-8 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({items.length} items)</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center text-gray-600">
                    <Truck className="h-4 w-4 mr-1" />
                    Shipping
                  </span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                {discountMinor > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discountMinor.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>

                <Link href="/checkout">
                  <Button className="w-full bg-[#F38508] hover:bg-[#D97706] text-black font-bold" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500 pt-2 border-t">
                  <div className="flex flex-col items-center text-center gap-1">
                    <Shield className="h-4 w-4 text-gray-400" />
                    Secure Checkout
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <Truck className="h-4 w-4 text-gray-400" />
                    Fast Delivery
                  </div>
                  <div className="flex flex-col items-center text-center gap-1">
                    <RotateCcw className="h-4 w-4 text-gray-400" />
                    Easy Returns
                  </div>
                </div>
              </CardContent>
            </Card>

            <Link href="/products">
              <Button variant="outline" className="w-full bg-transparent">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>

            {/* Coupons */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Apply Coupon
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart?.couponCode ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded border border-green-200">
                    <span className="font-bold text-sm">{cart.couponCode} applied</span>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} disabled={applyingCoupon} className="h-6 w-6 p-0 hover:bg-green-100">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Enter code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="h-9" />
                    <Button onClick={handleApplyCoupon} disabled={!couponCode || applyingCoupon} className="h-9 px-4">Apply</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cart Notes & Gift */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Order Notes & Gift
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Special Instructions</label>
                  <Textarea 
                    placeholder="Any special requests for your order?" 
                    className="text-sm min-h-[60px]" 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Gift className="w-3 h-3 text-[#F38508]" /> Gift Message
                  </label>
                  <Textarea 
                    placeholder="Adding a gift? Write a message here..." 
                    className="text-sm min-h-[60px]" 
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-8" 
                  onClick={handleSaveMeta}
                  disabled={savingMeta || (notes === (cart?.notes ?? "") && giftMessage === (cart?.giftMessage ?? ""))}
                >
                  {savingMeta ? "Saving..." : "Save Notes"}
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
