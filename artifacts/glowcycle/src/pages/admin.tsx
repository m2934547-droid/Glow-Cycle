import { useState } from "react";
import { 
  useAdminGetUsers, 
  useAdminGetStats, 
  useAdminDeleteUser, 
  useGetProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getAdminGetUsersQueryKey, 
  getAdminGetStatsQueryKey,
  getGetProductsQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, ShoppingBag, Trash2, Shield, Settings, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().min(10, "Description required"),
  price: z.coerce.number().min(0, "Invalid price"),
  category: z.string().min(2, "Category required"),
  imageUrl: z.string().optional(),
  inStock: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const { data: stats, isLoading: isStatsLoading } = useAdminGetStats({ query: { queryKey: getAdminGetStatsQueryKey() } });
  const { data: users, isLoading: isUsersLoading } = useAdminGetUsers({ query: { queryKey: getAdminGetUsersQueryKey() } });
  const { data: products, isLoading: isProductsLoading } = useGetProducts(undefined, { query: { queryKey: getGetProductsQueryKey() } });

  const deleteUserMutation = useAdminDeleteUser();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", description: "", price: 0, category: "", imageUrl: "", inStock: true },
  });

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(
        { userId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
            toast({ title: "User deleted" });
          },
        }
      );
    }
  };

  const handleOpenProductDialog = (product?: any) => {
    if (product) {
      setEditingProductId(product.id);
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || "",
        inStock: product.inStock,
      });
    } else {
      setEditingProductId(null);
      form.reset({ name: "", description: "", price: 0, category: "", imageUrl: "", inStock: true });
    }
    setIsProductDialogOpen(true);
  };

  const onSaveProduct = (data: ProductFormValues) => {
    if (editingProductId) {
      updateProductMutation.mutate(
        { productId: editingProductId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
            setIsProductDialogOpen(false);
            toast({ title: "Product updated" });
          }
        }
      );
    } else {
      createProductMutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
            setIsProductDialogOpen(false);
            toast({ title: "Product created" });
          }
        }
      );
    }
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Delete this product?")) {
      deleteProductMutation.mutate(
        { productId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
            toast({ title: "Product deleted" });
          }
        }
      );
    }
  };

  if (isStatsLoading || isUsersLoading || isProductsLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          Admin Console
        </h1>
        <p className="text-muted-foreground mt-2">Manage users, products, and view platform metrics.</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border h-12 rounded-xl p-1">
          <TabsTrigger value="dashboard" className="rounded-lg text-base h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-base h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Users</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg text-base h-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 duration-500">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-[2rem] border-primary/10 shadow-sm bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-6">
                  <Users className="h-8 w-8 text-blue-500 mb-4" />
                  <p className="text-3xl font-bold font-serif">{stats.totalUsers}</p>
                  <p className="text-muted-foreground font-medium">Total Users</p>
                </CardContent>
              </Card>
              <Card className="rounded-[2rem] border-primary/10 shadow-sm bg-purple-50 dark:bg-purple-900/20">
                <CardContent className="p-6">
                  <Activity className="h-8 w-8 text-purple-500 mb-4" />
                  <p className="text-3xl font-bold font-serif">{stats.activeUsersThisMonth}</p>
                  <p className="text-muted-foreground font-medium">Active This Month</p>
                </CardContent>
              </Card>
              <Card className="rounded-[2rem] border-primary/10 shadow-sm bg-pink-50 dark:bg-pink-900/20">
                <CardContent className="p-6">
                  <ShoppingBag className="h-8 w-8 text-pink-500 mb-4" />
                  <p className="text-3xl font-bold font-serif">{stats.totalProducts}</p>
                  <p className="text-muted-foreground font-medium">Products in Store</p>
                </CardContent>
              </Card>
              <Card className="rounded-[2rem] border-primary/10 shadow-sm bg-amber-50 dark:bg-amber-900/20">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-amber-500 mb-4" />
                  <p className="text-3xl font-bold font-serif">{stats.totalCycles}</p>
                  <p className="text-muted-foreground font-medium">Cycles Tracked</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="animate-in fade-in-50 duration-500">
          <Card className="rounded-[2rem] border-primary/10 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="font-serif">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Cycles</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{user.cycleCount}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">Admin</span>
                          ) : (
                            <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-medium">User</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.isAdmin} // Prevent deleting other admins easily
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="animate-in fade-in-50 duration-500">
          <Card className="rounded-[2rem] border-primary/10 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-serif">Product Inventory</CardTitle>
              <Button onClick={() => handleOpenProductDialog()} className="rounded-xl shadow-md gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map(product => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                          {product.name}
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>₹{product.price.toFixed(0)}</TableCell>
                        <TableCell>
                          {product.inStock ? (
                            <span className="text-green-600 font-medium text-sm">In Stock</span>
                          ) : (
                            <span className="text-orange-600 font-medium text-sm">Out of Stock</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenProductDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editingProductId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>Fill in the details for the store item.</DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSaveProduct)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="rounded-xl resize-none h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sanitary Pads">Sanitary Pads</SelectItem>
                          <SelectItem value="Tampons">Tampons</SelectItem>
                          <SelectItem value="Menstrual Cups">Menstrual Cups</SelectItem>
                          <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                          <SelectItem value="Heating Pads">Heating Pads</SelectItem>
                          <SelectItem value="Comfort Kits">Comfort Kits</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." className="rounded-xl" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">In Stock</FormLabel>
                      <CardDescription>Is this item currently available for purchase?</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsProductDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" className="rounded-xl px-8 hover-elevate">
                  {editingProductId ? "Save Changes" : "Create Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
