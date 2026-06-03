import { useState } from "react";
import { useGetProducts, useAddToCart, useGetCart, getGetProductsQueryKey, getGetCartQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShoppingBag, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Sanitary Pads", value: "pads" },
  { label: "Tampons", value: "tampons" },
  { label: "Menstrual Cups", value: "menstrual-cups" },
  { label: "Pain Relief", value: "pain-relief" },
  { label: "Heating Pads", value: "heating-pads" },
  { label: "Comfort Kits", value: "comfort-kits" },
];

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const queryParams = selectedCategory === "all" ? undefined : { category: selectedCategory };
  const { data: products, isLoading } = useGetProducts(queryParams, { 
    query: { queryKey: getGetProductsQueryKey(queryParams) } 
  });
  const { data: cart } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  
  const addToCartMutation = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAddToCart = (productId: number) => {
    addToCartMutation.mutate(
      { data: { productId, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          setIsCartOpen(true);
          toast({ title: "Added to cart", description: "Side cart opened." });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add item to cart.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Period Care Store
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Curated wellness products for every phase of your cycle.
        </p>
      </motion.div>

      {/* Categories */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {CATEGORIES.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
              selectedCategory === category.value
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
            )}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[350px] rounded-[2rem]" />
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-[2rem] border border-border/50">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-serif font-medium text-foreground">No products found</h3>
          <p className="text-muted-foreground mt-2">Try selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product, i) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <Card className="h-full flex flex-col rounded-[2rem] border-primary/10 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm overflow-hidden group">
                {product.imageUrl ? (
                  <div className="h-48 overflow-hidden bg-muted relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <ShoppingBag className="h-12 w-12 text-primary/20" />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                )}
                
                <CardHeader className="pb-2 flex-none">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <Badge variant="outline" className="bg-background/50 text-[10px] uppercase tracking-wider text-muted-foreground border-primary/20">
                      {product.category}
                    </Badge>
                    <span className="font-bold text-lg text-primary">₹{product.price.toFixed(0)}</span>
                  </div>
                  <CardTitle className="text-lg font-serif line-clamp-1" title={product.name}>{product.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {product.description}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    className="w-full rounded-xl hover-elevate gap-2" 
                    disabled={!product.inStock || addToCartMutation.isPending}
                    onClick={() => handleAddToCart(product.id)}
                  >
                    <Plus className="h-4 w-4" /> Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle className="font-serif text-2xl">Your Side Cart</SheetTitle>
              <SheetDescription>Review the products you just added.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {cart?.items?.length ? (
                cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                      <p className="text-sm font-semibold text-primary">₹{(item.product.price * item.quantity).toFixed(0)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-60 flex-col items-center justify-center text-center text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 text-primary/25" />
                  <p className="mt-3 font-medium text-foreground">Your cart is empty</p>
                  <p className="text-sm">Add a product to see it here.</p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-primary">₹{cart?.total?.toFixed(0) ?? "0"}</span>
              </div>
              <Button className="w-full rounded-xl h-12" onClick={() => setIsCartOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
