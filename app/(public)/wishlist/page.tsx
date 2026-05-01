"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Trash2,
  ArrowLeft,
  ShoppingBag,
  Loader2,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/contexts/cart-context";
import { minorToRupees } from "@/lib/api/config";

export default function WishlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { items, loading, remove } = useWishlist();
  const { addToCart } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/wishlist");
    }
  }, [status, router]);

  const removeItem = async (productId: string) => {
    setBusyId(productId);
    try {
      await remove(productId);
      toast({ title: "Removed from Wishlist" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const moveToCart = async (productId: string, variantId?: string | null) => {
    if (!variantId) {
      toast({ title: "No variant available", variant: "destructive" });
      return;
    }
    setMovingId(productId);
    try {
      await addToCart({ variantId, quantity: 1 });
      await remove(productId);
      toast({ title: "Moved to Cart" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setMovingId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-56 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          My Wishlist <span className="text-gray-400 font-normal">({items.length})</span>
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-rose-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Your Wishlist is Empty
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Save items you love by tapping the heart icon. They&apos;ll show up here
            for easy access later.
          </p>
          <Link href="/products">
            <Button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => {
            const slug = item.productSlug ?? item.productId;
            const title = item.productTitle ?? "Untitled";
            const price = item.priceMinor ? minorToRupees(item.priceMinor) : 0;
            const compareAt = item.compareAtMinor
              ? minorToRupees(item.compareAtMinor)
              : null;
            const discount =
              compareAt && compareAt > price
                ? Math.round(((compareAt - price) / compareAt) * 100)
                : 0;

            return (
              <Card key={item.id} className="overflow-hidden group flex flex-col">
                <Link
                  href={`/products/${slug}`}
                  className="relative aspect-[3/4] bg-gray-100 block"
                >
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {discount > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white border-0 text-[10px] px-1.5 h-5">
                      {discount}% OFF
                    </Badge>
                  )}
                  {item.inStock === false && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-xs font-bold uppercase text-gray-700 bg-white px-3 py-1 rounded">
                        Out of stock
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-3 flex-1 flex flex-col gap-1.5">
                  <Link
                    href={`/products/${slug}`}
                    className="text-sm font-medium line-clamp-2 hover:text-yellow-600"
                  >
                    {title}
                  </Link>
                  {(item.ratingCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {(item.ratingAvg ?? 0).toFixed(1)} ({item.ratingCount})
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900">
                      ₹{price.toLocaleString()}
                    </span>
                    {compareAt && compareAt > price && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{compareAt.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2 flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      onClick={() =>
                        moveToCart(item.productId, item.defaultVariantId ?? undefined)
                      }
                      disabled={
                        movingId === item.productId ||
                        item.inStock === false ||
                        !item.defaultVariantId
                      }
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-9 text-xs"
                    >
                      {movingId === item.productId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3 mr-1" />
                          Move to Cart
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      disabled={busyId === item.productId}
                      className="text-red-600 hover:bg-red-50 h-8 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
