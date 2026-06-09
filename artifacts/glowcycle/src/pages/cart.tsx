import { useState } from "react";
import { useGetCart, useRemoveCartItem, useCheckout, useClearCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Trash2, ShoppingBag, CreditCard, ArrowRight, MapPin, Phone, User, ChevronLeft, CheckCircle2, Package, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Step = "cart" | "checkout" | "confirmed";

interface OrderResult {
  orderId: string;
  total: number;
  itemCount: number;
  address: string;
  paymentMethod: string;
}

interface CheckoutForm {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "cod" | "upi";
}

const PAYMENT_OPTIONS = [
  { value: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives" },
  { value: "upi", label: "UPI / GPay / PhonePe", desc: "Instant payment via UPI" },
];

export default function Cart() {
  const [step, setStep] = useState<Step>("cart");
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    name: "", phone: "", addressLine: "", city: "", state: "", pincode: "", paymentMethod: "cod",
  });
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});

  const { data: cart, isLoading } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const removeItemMutation = useRemoveCartItem();
  const checkoutMutation = useCheckout();
  const clearCartMutation = useClearCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRemove = (itemId: number) => {
    removeItemMutation.mutate({ itemId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Item removed" });
      },
      onError: () => toast({ title: "Error removing item", variant: "destructive" }),
    });
  };

  const handleClearCart = () => {
    clearCartMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Cart cleared" });
      },
    });
  };

  const validate = (): boolean => {
    const e: Partial<CheckoutForm> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) e.phone = "Enter a valid 10-digit phone number";
    if (!form.addressLine.trim()) e.addressLine = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = () => {
    if (!validate()) return;
    checkoutMutation.mutate(undefined, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        setOrderResult({
          orderId: data.orderId,
          total: data.total,
          itemCount: cart?.items?.length ?? 0,
          address: `${form.addressLine}, ${form.city}, ${form.state} - ${form.pincode}`,
          paymentMethod: form.paymentMethod === "cod" ? "Cash on Delivery" : "UPI Payment",
        });
        setStep("confirmed");
      },
      onError: () => toast({ title: "Order failed. Please try again.", variant: "destructive" }),
    });
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
      <AnimatePresence mode="wait">

        {/* ─── STEP: CART ─── */}
        {step === "cart" && (
          <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-primary" />
                Your Cart
              </h1>
            </div>

            {isEmpty ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-[2rem] border border-border/50">
                <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30 mb-6" />
                <h3 className="text-2xl font-serif font-medium text-foreground">Your cart is empty</h3>
                <p className="text-muted-foreground mt-2 mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/store">
                  <Button size="lg" className="rounded-full shadow-md px-8">Explore Store</Button>
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
                    <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}>
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
                            <p className="font-bold text-primary whitespace-nowrap">₹{(item.product.price * item.quantity).toFixed(0)}</p>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2" onClick={() => handleRemove(item.id)} disabled={removeItemMutation.isPending}>
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
                    <CardContent className="space-y-3">
                      {cart.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                          <span className="line-clamp-1 mr-2">{item.product.name} x{item.quantity}</span>
                          <span className="shrink-0">₹{(item.product.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-muted-foreground pt-2 border-t border-border">
                        <span>Shipping</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">₹{cart.total.toFixed(0)}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20" onClick={() => setStep("checkout")}>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Checkout
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
          </motion.div>
        )}

        {/* ─── STEP: CHECKOUT FORM ─── */}
        {step === "checkout" && (
          <motion.div key="checkout" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}>
            <button onClick={() => setStep("cart")} className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Cart
            </button>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-8 flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              Delivery Details
            </h1>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {/* Contact */}
                <Card className="rounded-[2rem] border-primary/10 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" /> Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={cn("mt-1 rounded-xl", errors.name && "border-destructive")} />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="10-digit mobile number" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/, "") }))} className={cn("mt-1 rounded-xl", errors.phone && "border-destructive")} />
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Address */}
                <Card className="rounded-[2rem] border-primary/10 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address / Flat No.</Label>
                      <Input id="address" placeholder="House no, street, area, landmark" value={form.addressLine} onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))} className={cn("mt-1 rounded-xl", errors.addressLine && "border-destructive")} />
                      {errors.addressLine && <p className="text-destructive text-xs mt-1">{errors.addressLine}</p>}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={cn("mt-1 rounded-xl", errors.city && "border-destructive")} />
                        {errors.city && <p className="text-destructive text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={cn("mt-1 rounded-xl", errors.state && "border-destructive")} />
                        {errors.state && <p className="text-destructive text-xs mt-1">{errors.state}</p>}
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input id="pincode" placeholder="6-digit pin" maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/, "") }))} className={cn("mt-1 rounded-xl", errors.pincode && "border-destructive")} />
                        {errors.pincode && <p className="text-destructive text-xs mt-1">{errors.pincode}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment */}
                <Card className="rounded-[2rem] border-primary/10 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {PAYMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, paymentMethod: opt.value as "cod" | "upi" }))}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border-2 transition-all duration-200",
                          form.paymentMethod === opt.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", form.paymentMethod === opt.value ? "border-primary" : "border-muted-foreground")}>
                            {form.paymentMethod === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Summary sidebar */}
              <div>
                <Card className="rounded-[2rem] border-primary/10 shadow-md sticky top-24 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cart?.items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                        <span className="line-clamp-1 mr-2">{item.product.name} x{item.quantity}</span>
                        <span className="shrink-0">₹{(item.product.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-muted-foreground pt-2 border-t border-border">
                      <span>Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">₹{cart?.total?.toFixed(0)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20" onClick={handlePlaceOrder} disabled={checkoutMutation.isPending}>
                      {checkoutMutation.isPending ? "Placing Order..." : "Place Order"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP: ORDER CONFIRMED ─── */}
        {step === "confirmed" && orderResult && (
          <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto text-center py-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}>
              <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">Order Placed!</h1>
            <p className="text-muted-foreground text-lg mb-8">Your period care is on its way.</p>

            <Card className="rounded-[2rem] border-primary/10 shadow-md text-left mb-8">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <Package className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="font-bold text-primary text-lg tracking-wider">{orderResult.orderId}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{orderResult.itemCount} item{orderResult.itemCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-bold text-primary text-base">₹{orderResult.total.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium">{orderResult.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery to</span>
                    <span className="font-medium text-right max-w-[55%]">{orderResult.address}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Estimated Delivery</span>
                    <span className="font-medium text-green-600">3 – 5 business days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/tracking/${orderResult.orderId}`}>
                <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary/5">
                  <MapPinned className="mr-2 h-4 w-4" />
                  Track Order
                </Button>
              </Link>
              <Link href="/store">
                <Button size="lg" className="rounded-full px-8 shadow-md">Continue Shopping</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary/5">Go to Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
