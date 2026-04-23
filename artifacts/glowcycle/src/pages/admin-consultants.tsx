import { useState } from "react";
import {
  useGetConsultants,
  useAddConsultant,
  useUpdateConsultant,
  useDeleteConsultant,
  getGetConsultantsQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, Trash2, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const consultantSchema = z.object({
  name: z.string().min(2, "Name required"),
  designation: z.string().min(2, "Designation required"),
  phone: z.string().min(6, "Phone number required"),
  consultancyFee: z.coerce.number().min(0, "Invalid fee"),
  medicineFee: z.coerce.number().min(0, "Invalid fee"),
});

type ConsultantFormValues = z.infer<typeof consultantSchema>;

export default function AdminConsultants() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: consultants, isLoading } = useGetConsultants({
    query: { queryKey: getGetConsultantsQueryKey() },
  });
  const addMutation = useAddConsultant();
  const updateMutation = useUpdateConsultant();
  const deleteMutation = useDeleteConsultant();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ConsultantFormValues>({
    resolver: zodResolver(consultantSchema),
    defaultValues: { name: "", designation: "", phone: "", consultancyFee: 0, medicineFee: 0 },
  });

  const handleOpenDialog = (consultant?: any) => {
    if (consultant) {
      setEditingId(consultant.id);
      form.reset({
        name: consultant.name,
        designation: consultant.designation,
        phone: consultant.phone,
        consultancyFee: consultant.consultancyFee,
        medicineFee: consultant.medicineFee,
      });
    } else {
      setEditingId(null);
      form.reset({ name: "", designation: "", phone: "", consultancyFee: 0, medicineFee: 0 });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ConsultantFormValues) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ consultantId: editingId, data: values });
        toast({ title: "Consultant updated" });
      } else {
        await addMutation.mutateAsync({ data: values });
        toast({ title: "Consultant added" });
      }
      await queryClient.invalidateQueries({ queryKey: getGetConsultantsQueryKey() });
      setIsDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not save", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this consultant?")) return;
    try {
      await deleteMutation.mutateAsync({ consultantId: id });
      await queryClient.invalidateQueries({ queryKey: getGetConsultantsQueryKey() });
      toast({ title: "Consultant removed" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            Manage <span className="text-primary">Consultants</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Add and update health consultants users can contact.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg" className="rounded-full">
          <Plus className="h-4 w-4 mr-2" /> Add Consultant
        </Button>
      </motion.div>

      <Card className="rounded-[2rem] border-primary/10 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Stethoscope className="h-5 w-5 text-primary" /> All Consultants
          </CardTitle>
          <CardDescription>
            {consultants?.length ?? 0} consultant{(consultants?.length ?? 0) === 1 ? "" : "s"} listed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : !consultants || consultants.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No consultants yet. Add your first one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Consultancy</TableHead>
                    <TableHead className="text-right">Medicines</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultants.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.designation}</TableCell>
                      <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                      <TableCell className="text-right">₹{c.consultancyFee.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">₹{c.medicineFee.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingId ? "Edit Consultant" : "Add Consultant"}
            </DialogTitle>
            <DialogDescription>
              {editingId ? "Update the consultant details below." : "Enter the consultant's details and fees."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Dr. Priya Sharma" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="designation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl><Input placeholder="Gynecologist" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="consultancyFee" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultancy Fee (₹)</FormLabel>
                    <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="medicineFee" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine Fee (₹)</FormLabel>
                    <FormControl><Input type="number" min="0" step="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full">Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-full">
                  {editingId ? "Save Changes" : "Add Consultant"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
