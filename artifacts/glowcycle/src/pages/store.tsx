import { useState } from "react";
import { Link } from "wouter";
import { useGetProducts, getGetProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Plus, MapPinned } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartDrawer } from "@/components/cart-drawer";

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
  const { addItem, isUpdating, canUseCart } = useCartDrawer();

  const queryParams = selectedCategory === "all" ? undefined : { category: selectedCategory };
  const { data: products, isLoading } = useGetProducts(queryParams, {
    query: { queryKey: getGetProductsQueryKey(queryParams) },
  });

  const handleAddToCart = async (productId: number) => {
    await addItem(productId, 1, { openDrawer: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-3 text-3xl font-serif font-bold text-foreground md:text-4xl">
          <ShoppingBag className="h-8 w-8 text-primary" />
          Period Care Store
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Curated wellness products for every phase of your cycle.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/store-locator">
            <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
              <MapPinned className="mr-2 h-4 w-4" />
              Find a store
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300",
              selectedCategory === category.value
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary"
            )}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[350px] rounded-[2rem]" />
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="rounded-[2rem] border border-border/50 bg-card/50 py-20 text-center backdrop-blur-sm">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-xl font-serif font-medium text-foreground">No products found</h3>
          <p className="mt-2 text-muted-foreground">Try selecting a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <Card className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-primary/10 bg-card/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                {product.imageUrl ? (
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <Badge variant="secondary" className="text-sm">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative flex h-48 items-center justify-center bg-primary/5 transition-colors group-hover:bg-primary/10">
                    <ShoppingBag className="h-12 w-12 text-primary/20" />
                    {!product.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                        <Badge variant="secondary" className="text-sm">
                          Out of Stock
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <CardHeader className="flex-none pb-2">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-background/50 text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                      {product.category}
                    </Badge>
                    <span className="text-lg font-bold text-primary">{"\u20B9"}{product.price.toFixed(0)}</span>
                  </div>
                  <CardTitle className="font-serif text-lg line-clamp-1" title={product.name}>
                    {product.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    className="w-full gap-2 rounded-xl hover-elevate"
                    disabled={!product.inStock || isUpdating || !canUseCart}
                    onClick={() => {
                      void handleAddToCart(product.id).catch(() => undefined);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
