import { useState } from "react";
import { 
  useGetCurrentCycle, 
  useGetCalendarNotes, 
  useCreateCalendarNote, 
  useDeleteCalendarNote,
  getGetCurrentCycleQueryKey,
  getGetCalendarNotesQueryKey
} from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, BookHeart, Trash2, CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const noteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty").max(500, "Note is too long"),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const { data: currentCycle, isLoading: isCycleLoading } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  const { data: notes, isLoading: isNotesLoading } = useGetCalendarNotes({ query: { queryKey: getGetCalendarNotesQueryKey() } });
  
  const createNoteMutation = useCreateCalendarNote();
  const deleteNoteMutation = useDeleteCalendarNote();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsNoteDialogOpen(true);
    form.reset({ note: "" }); // Reset form for new note
  };

  const getDayStatus = (day: Date) => {
    if (!currentCycle) return null;

    const currentPeriodStart = parseISO(currentCycle.lastPeriodStart);
    // Rough estimation for current period end (usually 5 days)
    const currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 4);

    const nextPeriodStart = parseISO(currentCycle.nextPeriodDate);
    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 4);

    const ovulationDate = parseISO(currentCycle.ovulationDate);
    const fertileStart = parseISO(currentCycle.fertileWindowStart);
    const fertileEnd = parseISO(currentCycle.fertileWindowEnd);

    if (isWithinInterval(day, { start: currentPeriodStart, end: currentPeriodEnd }) || 
        isWithinInterval(day, { start: nextPeriodStart, end: nextPeriodEnd })) {
      return 'period';
    }

    if (isSameDay(day, ovulationDate)) {
      return 'ovulation';
    }

    if (isWithinInterval(day, { start: fertileStart, end: fertileEnd })) {
      return 'fertile';
    }

    return null;
  };

  const hasNoteOnDay = (day: Date) => {
    return notes?.find(n => isSameDay(parseISO(n.date), day));
  };

  const onSaveNote = (data: NoteFormValues) => {
    if (!selectedDate) return;
    
    createNoteMutation.mutate(
      { data: { date: format(selectedDate, "yyyy-MM-dd"), note: data.note } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCalendarNotesQueryKey() });
          toast({ title: "Note saved" });
          setIsNoteDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Error saving note", variant: "destructive" });
        }
      }
    );
  };

  const handleDeleteNote = (noteId: number) => {
    deleteNoteMutation.mutate(
      { noteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCalendarNotesQueryKey() });
          toast({ title: "Note deleted" });
          setIsNoteDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Error deleting note", variant: "destructive" });
        }
      }
    );
  };

  if (isCycleLoading || isNotesLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] rounded-[2rem]" />
      </div>
    );
  }

  const selectedNote = selectedDate ? hasNoteOnDay(selectedDate) : undefined;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-2">Track your cycle and journal your feelings.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="rounded-[2rem] border-primary/10 shadow-lg overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="bg-primary/5 pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-2xl font-serif">{format(currentDate, "MMMM yyyy")}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-full">
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Period</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Ovulation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-pink-200" />
                <span className="text-muted-foreground">Fertile Window</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookHeart className="w-3 h-3 text-secondary-foreground" />
                <span className="text-muted-foreground">Journal Note</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {paddingDays.map(i => (
                <div key={`padding-${i}`} className="aspect-square rounded-xl opacity-0" />
              ))}
              
              {daysInMonth.map(day => {
                const status = getDayStatus(day);
                const hasNote = hasNoteOnDay(day);
                const isTodayDay = isToday(day);

                return (
                  <motion.button
                    key={day.toISOString()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "aspect-square rounded-xl relative flex items-center justify-center text-lg font-medium transition-colors hover-elevate border",
                      isTodayDay ? "border-foreground" : "border-transparent",
                      status === 'period' ? "bg-primary text-primary-foreground border-primary" :
                      status === 'ovulation' ? "bg-purple-500 text-white border-purple-500" :
                      status === 'fertile' ? "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900/40 dark:text-pink-100" :
                      "bg-card hover:bg-muted text-foreground border-border/50",
                      hasNote && status !== 'period' && status !== 'ovulation' && "border-b-4 border-b-secondary-foreground"
                    )}
                  >
                    {format(day, "d")}
                    {hasNote && (
                      <BookHeart className={cn(
                        "absolute bottom-1 right-1 w-3 h-3",
                        (status === 'period' || status === 'ovulation') ? "text-white/80" : "text-secondary-foreground"
                      )} />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
            <DialogDescription>
              How are you feeling today? Any symptoms or thoughts?
            </DialogDescription>
          </DialogHeader>

          {selectedNote ? (
            <div className="space-y-4 py-4">
              <div className="bg-secondary/20 p-4 rounded-xl text-foreground">
                <p className="whitespace-pre-wrap">{selectedNote.note}</p>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  disabled={deleteNoteMutation.isPending}
                  className="rounded-full gap-2 hover-elevate"
                >
                  <Trash2 className="h-4 w-4" /> Delete Note
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSaveNote)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your journal entry here..." 
                          className="min-h-[150px] resize-none rounded-xl bg-background/50 focus-visible:ring-primary/20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setIsNoteDialogOpen(false)} className="rounded-xl hover:bg-muted/50">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createNoteMutation.isPending} className="rounded-xl hover-elevate">
                    {createNoteMutation.isPending ? "Saving..." : "Save Note"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
