import { useState } from "react";
import {
  useGetOrders,
  getGetOrdersQueryKey,
  useRateProduct,
  useGetMyRatings,
  getGetMyRatingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type OrderLineItem = {
  productId: number;
  productName: string;
  productCategory: string;
  price: number;
  quantity: number;
};

type OrderHistoryItem = {
  id: number;
  orderId: string;
  total: number;
  itemCount: number;
  createdAt: string;
  items: OrderLineItem[];
};

type RatingItem = {
  productId: number;
  rating: number;
  review?: string | null;
};

function StarRating({ value, onChange, size = "md" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sz,
            "transition-colors cursor-pointer",
            (hovered || value) >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          )}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(star)}
        />
      ))}
    </div>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useGetOrders({ query: { queryKey: getGetOrdersQueryKey() } });
  const { data: myRatings } = useGetMyRatings({ query: { queryKey: getGetMyRatingsQueryKey() } });
  const rateProductMutation = useRateProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [ratingDialog, setRatingDialog] = useState<{ productId: number; productName: string } | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState("");

  const orderHistory = (orders ?? []) as OrderHistoryItem[];
  const ratingHistory = (myRatings ?? []) as RatingItem[];

  const getRatedScore = (productId: number) =>
    ratingHistory.find((r) => r.productId === productId)?.rating ?? 0;

  const openRatingDialog = (productId: number, productName: string) => {
    const existing = ratingHistory.find((r) => r.productId === productId);
    setSelectedRating(existing?.rating ?? 0);
    setReview(existing?.review ?? "");
    setRatingDialog({ productId, productName });
  };

  const submitRating = async () => {
    if (!ratingDialog || selectedRating === 0) return;
    try {
      await rateProductMutation.mutateAsync({
        data: { productId: ratingDialog.productId, rating: selectedRating, review: review || undefined },
      });
      await queryClient.invalidateQueries({ queryKey: getGetMyRatingsQueryKey() });
      toast({ title: "Rating saved", description: "Thank you for your feedback!" });
      setRatingDialog(null);
    } catch {
      toast({ title: "Error", description: "Could not save rating.", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-serif font-bold text-foreground md:text-4xl">
          Purchase <span className="text-primary">History</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your past orders and rating history.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[2rem]" />
          ))}
        </div>
      ) : orderHistory.length === 0 ? (
        <Card className="rounded-[2rem]">
          <CardContent className="space-y-4 p-12 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/20" />
            <p className="text-lg text-muted-foreground">No orders yet.</p>
            <Link href="/store">
              <Button className="mt-2 rounded-full">Browse the Store</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {orderHistory.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
                <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-bold tracking-wider text-primary">{order.orderId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <Badge variant="outline" className="border-primary/20 bg-white text-primary">
                        Rs. {order.total.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {order.items.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground">
                      {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} (details unavailable for older orders)
                    </p>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {order.items.map((item) => {
                        const myScore = getRatedScore(item.productId);

                        return (
                          <div key={item.productId} className="flex items-center justify-between gap-4 px-6 py-4">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-foreground">{item.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty {item.quantity} | Rs. {item.price.toFixed(0)} each
                              </p>
                              {myScore > 0 && (
                                <div className="mt-1">
                                  <StarRating value={myScore} size="sm" />
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 rounded-full border-primary/20 text-primary hover:bg-primary/5"
                              onClick={() => openRatingDialog(item.productId, item.productName)}
                            >
                              <Star className="mr-1.5 h-3.5 w-3.5" />
                              {myScore > 0 ? "Edit Rating" : "Rate"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!ratingDialog} onOpenChange={(open) => !open && setRatingDialog(null)}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Rate {ratingDialog?.productName}</DialogTitle>
            <DialogDescription>How would you rate this product?</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="flex justify-center">
              <StarRating value={selectedRating} onChange={setSelectedRating} />
            </div>
            <Textarea
              placeholder="Write a review (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="resize-none rounded-2xl"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingDialog(null)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={submitRating} disabled={selectedRating === 0 || rateProductMutation.isPending} className="rounded-full">
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
