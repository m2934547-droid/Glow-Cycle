import { useGetCart, useRemoveCartItem, useCheckout, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Trash2, ShoppingBag, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  
  const removeItemMutation = useRemoveCartItem();
  const checkoutMutation = useCheckout();
  const clearCartMutation = useClearCart();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRemove = (itemId: number) => {
    removeItemMutation.mutate(
      { itemId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Item removed" });
        },
        onError: () => {
          toast({ title: "Error removing item", variant: "destructive" });
        }
      }
    );
  };

  const handleClearCart = () => {
    clearCartMutation.mutate(
      undefined,
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Cart cleared" });
        }
      }
    );
  };

  const handleCheckout = () => {
    checkoutMutation.mutate(
      undefined,
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Order placed!", description: data.message });
        },
        onError: () => {
          toast({ title: "Checkout failed", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Your Cart
        </h1>
      </motion.div>

      {isEmpty ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-[2rem] border border-border/50">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-2xl font-serif font-medium text-foreground">Your cart is empty</h3>
          <p className="text-muted-foreground mt-2 mb-8">Looks like you haven't added anything yet.</p>
          <Link href="/store">
            <Button size="lg" className="rounded-full shadow-md hover-elevate px-8">
              Explore Store
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-end mb-2">
              <Button variant="ghost" size="sm" onClick={handleClearCart} disabled={clearCartMutation.isPending} className="text-muted-foreground hover:text-destructive">
                Clear Cart
              </Button>
            </div>
            
            {cart.items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-2xl border-primary/10 shadow-sm overflow-hidden flex flex-row">
                  {item.product.imageUrl ? (
                    <div className="w-24 sm:w-32 shrink-0 bg-muted">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 sm:w-32 shrink-0 bg-primary/5 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                  
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-medium text-foreground line-clamp-1">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-primary whitespace-nowrap">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                        onClick={() => handleRemove(item.id)}
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="rounded-[2rem] border-primary/10 shadow-md sticky top-24 bg-card/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${cart.total.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12 rounded-xl text-lg hover-elevate shadow-primary/20 shadow-lg"
                  onClick={handleCheckout}
                  disabled={checkoutMutation.isPending}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {checkoutMutation.isPending ? "Processing..." : "Checkout"}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-6">
              <Link href="/store" className="flex items-center justify-center text-sm font-medium text-primary hover:underline">
                Continue Shopping <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
