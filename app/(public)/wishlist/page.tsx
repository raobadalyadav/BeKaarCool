"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { items, loading, remove } = useWishlist();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/wishlist");
    }
  }, [status, router]);

  const removeItem = async (productId: string) => {
    try {
      await remove(productId);
      toast({ title: "Removed from Wishlist" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">My Wishlist ({items.length})</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Your Wishlist is Empty
          </h2>
          <p className="text-gray-500">
            Save items you love by tapping the heart icon.
          </p>
          <Link href="/products">
            <Button className="mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <Link
                href={`/products/${item.productId}`}
                className="block text-sm font-medium line-clamp-1"
              >
                Product {item.productId.slice(0, 8)}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.productId)}
                className="mt-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Remove
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
