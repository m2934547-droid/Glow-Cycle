import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, calendarNotesTable } from "@workspace/db";
import { CreateCalendarNoteBody, DeleteCalendarNoteParams } from "@workspace/api-zod";
import { requireAuth } from "./users";

const router: IRouter = Router();

router.get("/calendar/notes", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const notes = await db
    .select()
    .from(calendarNotesTable)
    .where(eq(calendarNotesTable.userId, userId));

  res.json(notes.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

router.post("/calendar/notes", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateCalendarNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(calendarNotesTable)
    .where(eq(calendarNotesTable.userId, userId));

  const match = existing.find(n => n.date === parsed.data.date);

  if (match) {
    const [updated] = await db
      .update(calendarNotesTable)
      .set({ note: parsed.data.note })
      .where(eq(calendarNotesTable.id, match.id))
      .returning();
    res.status(201).json({ ...updated, createdAt: updated.createdAt.toISOString() });
    return;
  }

  const [note] = await db.insert(calendarNotesTable).values({
    userId,
    date: parsed.data.date,
    note: parsed.data.note,
  }).returning();

  res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
});

router.delete("/calendar/notes/:noteId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = DeleteCalendarNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(calendarNotesTable)
    .where(eq(calendarNotesTable.id, params.data.noteId));

  res.json({ message: "Note deleted" });
});

export default router;
