import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCartQueryKey,
  useAddToCart,
  useClearCart,
  useGetCart,
  useGetMe,
  useRemoveCartItem,
  type Cart,
  type CartItem,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

type CartMutationOptions = {
  openDrawer?: boolean;
  silent?: boolean;
};

type CartDrawerContextValue = {
  canUseCart: boolean;
  openCart: () => void;
  closeCart: () => void;
  isOpen: boolean;
  cart: Cart | undefined;
  cartItemCount: number;
  isUpdating: boolean;
  addItem: (productId: number, quantity?: number, options?: CartMutationOptions) => Promise<Cart | undefined>;
  removeItem: (itemId: number, options?: CartMutationOptions) => Promise<Cart | undefined>;
  adjustQuantity: (item: CartItem, delta: 1 | -1) => Promise<Cart | undefined>;
  clearCart: (options?: CartMutationOptions) => Promise<void>;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

const EMPTY_CART: Cart = { items: [], total: 0 };

const money = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function formatCurrency(value: number) {
  return money.format(Math.round(value));
}

function getEmptyCart(): Cart {
  return { items: [], total: 0 };
}

function CartItemRow({
  item,
  onDecrease,
  onIncrease,
  onRemove,
  isUpdating,
}: {
  item: CartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  isUpdating: boolean;
}) {
  return (
    <article className="group rounded-[20px] border border-[#F3DCE7] bg-white p-4 shadow-[0_8px_22px_rgba(255,92,168,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(255,92,168,0.12)]">
      <div className="flex gap-4">
        <div className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[18px] bg-[#FFEAF3] ring-1 ring-[#F3DCE7]">
          {item.product.imageUrl ? (
            <img
              src={item.product.imageUrl}
              alt={item.product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#FF5CA8]">
              <ShoppingBag className="h-7 w-7" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-serif text-[17px] font-semibold leading-tight text-[#3D2A34]">
                {item.product.name}
              </h3>
              <span className="mt-2 inline-flex items-center rounded-full bg-[#FFEAF3] px-3 py-1 text-[11px] font-medium text-[#FF5CA8]">
                One-time
              </span>
            </div>
            <p className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-[#3D2A34]">
              {"\u20B9"}{formatCurrency(item.product.price * item.quantity)}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-[#8B6F7D]">Qty {item.quantity}</p>
            <button
              type="button"
              onClick={onRemove}
              disabled={isUpdating}
              className="text-sm font-medium text-[#FF5CA8] transition-colors duration-200 hover:text-[#e84c97] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          <div className="mt-4 inline-flex overflow-hidden rounded-full border border-[#F3DCE7] bg-[#FFF7FB] shadow-[0_6px_16px_rgba(255,92,168,0.06)]">
            <button
              type="button"
              onClick={onDecrease}
              disabled={isUpdating}
              aria-label={`Decrease quantity for ${item.product.name}`}
              className="flex h-10 w-10 items-center justify-center text-[#FF5CA8] transition-all duration-200 hover:bg-[#FFEAF3] hover:text-[#e84c97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex h-10 min-w-12 items-center justify-center border-x border-[#F3DCE7] px-4 text-sm font-semibold text-[#3D2A34]">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              disabled={isUpdating}
              aria-label={`Increase quantity for ${item.product.name}`}
              className="flex h-10 w-10 items-center justify-center text-[#FF5CA8] transition-all duration-200 hover:bg-[#FFEAF3] hover:text-[#e84c97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyCartState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#F3DCE7] bg-[#FFF7FB] px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#FF5CA8] shadow-[0_10px_24px_rgba(255,92,168,0.12)]">
        <ShoppingBag className="h-8 w-8" />
      </div>
      <h3 className="font-serif text-[22px] font-semibold text-[#3D2A34]">Your cart is empty</h3>
      <p className="mt-2 max-w-xs text-sm leading-6 text-[#8B6F7D]">
        Add a few GlowCycle essentials and your subtotal will update instantly here.
      </p>
    </div>
  );
}

function CartDrawerShell({
  cart,
  closeCart,
  clearCart,
  adjustQuantity,
  removeItem,
  isUpdating,
}: {
  cart: Cart;
  closeCart: () => void;
  clearCart: () => void;
  adjustQuantity: (item: CartItem, delta: 1 | -1) => void;
  removeItem: (itemId: number) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white text-[#3D2A34]">
      <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#FFEAF3]/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 right-10 h-40 w-40 rounded-full bg-[#FF5CA8]/10 blur-3xl" />

      <header className="sticky top-0 z-20 border-b border-[#F3DCE7] bg-white/95 px-6 py-6 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#FF5CA8]">
              WELLNESS ESSENTIALS
            </p>
            <DialogPrimitive.Title className="mt-2 font-serif text-[30px] font-semibold tracking-tight text-[#3D2A34]">
              YOUR CART
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-[#8B6F7D]">
              Review the products you just added.
            </DialogPrimitive.Description>
          </div>

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close cart drawer"
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF5CA8] text-white shadow-[0_12px_28px_rgba(255,92,168,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff4d9f] hover:shadow-[0_16px_34px_rgba(255,92,168,0.34)]"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogPrimitive.Close>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="scrollbar-premium h-full overflow-y-auto px-6 py-5">
          {cart.items.length === 0 ? (
            <EmptyCartState />
          ) : (
            <div className="space-y-4">
              {cart.items.map((item, index) => (
                <div key={item.id}>
                  <CartItemRow
                    item={item}
                    isUpdating={isUpdating}
                    onDecrease={() => adjustQuantity(item, -1)}
                    onIncrease={() => adjustQuantity(item, 1)}
                    onRemove={() => removeItem(item.id)}
                  />
                  {index < cart.items.length - 1 && (
                    <div className="mx-2 my-4 h-px bg-gradient-to-r from-transparent via-[#F3DCE7] to-transparent" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-[#F3DCE7] bg-white/95 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#8B6F7D]">Subtotal</span>
          <span className="text-[20px] font-semibold text-[#22C55E]">
            {"\u20B9"}{formatCurrency(cart.total)}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <Button asChild className="h-16 w-full rounded-[16px] border border-black bg-white text-[#3D2A34] shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FAFAFA] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            <Link href="/cart" onClick={closeCart}>
              <ShoppingBag className="h-4 w-4" />
              View Cart
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={cart.items.length === 0 || isUpdating}
            onClick={clearCart}
            className="h-16 w-full rounded-[16px] border-[#FF5CA8] bg-white text-[#FF5CA8] shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FFF7FB] hover:text-[#e84c97] hover:shadow-[0_12px_28px_rgba(255,92,168,0.10)]"
          >
            <Trash2 className="h-4 w-4" />
            Clear Cart
          </Button>
        </div>
      </footer>
    </div>
  );
}

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useGetMe();
  const canUseCart = Boolean(user && !user.isAdmin);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cart } = useGetCart({
    query: {
      enabled: canUseCart,
      queryKey: getGetCartQueryKey(),
    },
  });

  const addMutation = useAddToCart();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  useEffect(() => {
    if (!canUseCart) {
      setIsOpen(false);
    }
  }, [canUseCart]);

  const setCachedCart = useCallback((nextCart: Cart) => {
    queryClient.setQueryData(getGetCartQueryKey(), nextCart);
  }, [queryClient]);

  const openCart = useCallback(() => {
    if (!canUseCart) return;
    setIsOpen(true);
  }, [canUseCart]);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const addItem = useCallback(async (productId: number, quantity = 1, options?: CartMutationOptions) => {
    if (!canUseCart) return undefined;

    try {
      const nextCart = await addMutation.mutateAsync({ data: { productId, quantity } });
      setCachedCart(nextCart);

      if (!options?.silent) {
        toast({
          title: "Added to cart",
          description: "Your GlowCycle drawer has been updated.",
        });
      }

      if (options?.openDrawer ?? true) {
        setIsOpen(true);
      }

      return nextCart;
    } catch (error) {
      if (!options?.silent) {
        toast({
          title: "Could not update cart",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
      throw error;
    }
  }, [addMutation, canUseCart, setCachedCart, toast]);

  const removeItem = useCallback(async (itemId: number, options?: CartMutationOptions) => {
    if (!canUseCart) return undefined;

    try {
      const nextCart = await removeMutation.mutateAsync({ itemId });
      setCachedCart(nextCart);

      if (!options?.silent) {
        toast({
          title: "Item removed",
          description: "The cart subtotal has been updated.",
        });
      }

      return nextCart;
    } catch (error) {
      if (!options?.silent) {
        toast({
          title: "Could not remove item",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
      throw error;
    }
  }, [canUseCart, removeMutation, setCachedCart, toast]);

  const adjustQuantity = useCallback(async (item: CartItem, delta: 1 | -1) => {
    if (!canUseCart) return undefined;

    if (delta < 0 && item.quantity <= 1) {
      return removeItem(item.id, { silent: true });
    }

    return addItem(item.productId, delta, { openDrawer: false, silent: true });
  }, [addItem, canUseCart, removeItem]);

  const clearCart = useCallback(async (options?: CartMutationOptions) => {
    if (!canUseCart) return;

    try {
      await clearMutation.mutateAsync();
      setCachedCart(getEmptyCart());

      if (!options?.silent) {
        toast({
          title: "Cart cleared",
          description: "You can start fresh with a new selection.",
        });
      }
    } catch (error) {
      if (!options?.silent) {
        toast({
          title: "Could not clear cart",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
      throw error;
    }
  }, [canUseCart, clearMutation, setCachedCart, toast]);

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isUpdating = addMutation.isPending || removeMutation.isPending || clearMutation.isPending;
  const safeCart = cart ?? EMPTY_CART;

  const contextValue = useMemo<CartDrawerContextValue>(
    () => ({
      canUseCart,
      openCart,
      closeCart,
      isOpen,
      cart: safeCart,
      cartItemCount,
      isUpdating,
      addItem,
      removeItem,
      adjustQuantity,
      clearCart,
    }),
    [addItem, adjustQuantity, canUseCart, cartItemCount, clearCart, closeCart, isOpen, isUpdating, openCart, removeItem, safeCart]
  );

  return (
    <CartDrawerContext.Provider value={contextValue}>
      {children}

      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.55)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-300 data-[state=closed]:duration-300" />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-y-0 right-0 z-50 h-[100dvh] w-[min(100vw,500px)] overflow-hidden border-l border-[#F3DCE7] bg-white p-0 text-[#3D2A34] shadow-[0_30px_80px_rgba(61,42,52,0.24)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full data-[state=open]:duration-300 data-[state=closed]:duration-300 ease-out max-sm:rounded-l-[28px] max-sm:rounded-r-none sm:rounded-l-[32px] sm:rounded-r-none"
            )}
          >
            <CartDrawerShell
              cart={safeCart}
              closeCart={closeCart}
              clearCart={() => {
                void clearCart().catch(() => undefined);
              }}
              adjustQuantity={(item, delta) => {
                void adjustQuantity(item, delta).catch(() => undefined);
              }}
              removeItem={(itemId) => {
                void removeItem(itemId).catch(() => undefined);
              }}
              isUpdating={isUpdating}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);

  if (!context) {
    throw new Error("useCartDrawer must be used within a CartDrawerProvider");
  }

  return context;
}
