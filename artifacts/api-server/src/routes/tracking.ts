import { Router, type IRouter, type Response } from "express";
import { asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { access, mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { db, orderTrackingEventsTable, ordersTable, usersTable } from "@workspace/db";
import { z } from "zod";
import {
  AdminOrderSearchQuery,
  AdminOrderSearchResponse,
  CreateTrackingEventBody,
  GetOrderTrackingParams,
  GetTrackingHistoryResponse,
  TrackingEvent,
} from "@workspace/api-zod";
import { requireAuth } from "./users";
import { requireAdmin } from "../lib/permissions";

const router: IRouter = Router();
const subscribers = new Map<string, Set<Response>>();
const profileImageStorageDir = path.join(process.cwd(), "uploads", "profile-images");
const profileImageManifestPath = path.join(profileImageStorageDir, "manifest.json");
const profileImageBodySchema = z.object({
  imageDataUrl: z.string().min(1),
  fileName: z.string().optional(),
});
const allowedProfileImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxProfileImageBytes = 5 * 1024 * 1024;

type TrackingPayload = {
  order: {
    id: number;
    orderId: string;
    total: number;
    itemCount: number;
    createdAt: string;
  };
  currentEvent: ReturnType<typeof formatEvent> | null;
  events: ReturnType<typeof formatEvent>[];
  stages: Array<{
    title: string;
    description: string;
    status: "complete" | "current" | "pending";
    timestamp?: string;
    latitude?: number;
    longitude?: number;
  }>;
};

function formatEvent(event: typeof orderTrackingEventsTable.$inferSelect) {
  return {
    id: event.id,
    orderId: event.orderId,
    title: event.title,
    description: event.description,
    latitude: event.latitude,
    longitude: event.longitude,
    createdAt: event.createdAt.toISOString(),
  };
}

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    orderId: order.orderId,
    total: order.total,
    itemCount: order.itemCount,
    createdAt: order.createdAt.toISOString(),
  };
}

function buildStages(events: TrackingPayload["events"]) {
  const baseStages = [
    { title: "Order Placed", description: "Order received and queued for processing.", status: "complete" as const },
    { title: "Processing", description: "Order confirmation and warehouse review in progress.", status: events.length >= 1 ? ("complete" as const) : ("current" as const) },
    { title: "Packed", description: "Items packed and prepared for dispatch.", status: events.length >= 2 ? ("complete" as const) : (events.length === 1 ? ("current" as const) : ("pending" as const)) },
    { title: "Dispatched", description: "Shipment handed off to the courier network.", status: events.length >= 3 ? ("complete" as const) : (events.length === 2 ? ("current" as const) : ("pending" as const)) },
  ];

  const eventStages = events.map((event, index) => ({
    title: event.title,
    description: event.description,
    status: index === events.length - 1 ? ("current" as const) : ("complete" as const),
    timestamp: event.createdAt,
    latitude: event.latitude,
    longitude: event.longitude,
  }));

  const finalStages = [
    {
      title: "Out For Delivery",
      description: "Last-mile delivery is underway.",
      status: events.some((event) => /out for delivery/i.test(event.title)) ? ("complete" as const) : ("pending" as const),
    },
    {
      title: "Delivered",
      description: "Package delivered successfully.",
      status: events.some((event) => /delivered/i.test(event.title)) ? ("complete" as const) : ("pending" as const),
    },
  ];

  return [...baseStages, ...eventStages, ...finalStages];
}

async function resolveOrderByCode(orderCode: string) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.orderId, orderCode));
  return order ?? null;
}

async function loadTrackingResponse(orderCode: string, userId: number, isAdmin: boolean): Promise<TrackingPayload | null | "forbidden"> {
  const order = await resolveOrderByCode(orderCode);
  if (!order) return null;
  if (!isAdmin && order.userId !== userId) return "forbidden";

  const events = await db
    .select()
    .from(orderTrackingEventsTable)
    .where(eq(orderTrackingEventsTable.orderId, order.id))
    .orderBy(asc(orderTrackingEventsTable.createdAt));

  const formattedEvents = events.map(formatEvent);
  return {
    order: formatOrder(order),
    currentEvent: formattedEvents.at(-1) ?? null,
    events: formattedEvents,
    stages: buildStages(formattedEvents),
  };
}

function broadcast(orderCode: string, payload: unknown) {
  const listeners = subscribers.get(orderCode);
  if (!listeners) return;

  const message = `event: tracking\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const response of listeners) {
    response.write(message);
  }
}

type StoredProfileImage = {
  filename: string;
  url: string;
  mimeType: string;
  updatedAt: string;
};

type ProfileImageManifest = Record<string, StoredProfileImage>;

async function ensureProfileImageStorage() {
  await mkdir(profileImageStorageDir, { recursive: true });
}

async function readProfileImageManifest(): Promise<ProfileImageManifest> {
  try {
    const raw = await readFile(profileImageManifestPath, "utf8");
    const parsed = JSON.parse(raw) as ProfileImageManifest;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeProfileImageManifest(manifest: ProfileImageManifest) {
  await ensureProfileImageStorage();
  await writeFile(profileImageManifestPath, JSON.stringify(manifest, null, 2), "utf8");
}

function parseProfileImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  if (!allowedProfileImageMimeTypes.has(mimeType)) {
    return null;
  }

  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (buffer.length === 0 || buffer.length > maxProfileImageBytes) {
    return null;
  }

  return { mimeType, buffer };
}

function getProfileImageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "bin";
}

router.get("/users/profile/avatar", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const manifest = await readProfileImageManifest();
  const image = manifest[String(userId)] ?? null;

  res.json({
    profileImageUrl: image?.url ?? null,
    updatedAt: image?.updatedAt ?? null,
  });
});

router.post("/users/profile/avatar", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = profileImageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const parsedImage = parseProfileImageDataUrl(parsed.data.imageDataUrl);
  if (!parsedImage) {
    res.status(400).json({ error: "Please upload a valid JPG, PNG, WEBP, or GIF image under 5 MB." });
    return;
  }

  const manifest = await readProfileImageManifest();
  const previousImage = manifest[String(userId)];

  if (previousImage) {
    try {
      await unlink(path.join(profileImageStorageDir, previousImage.filename));
    } catch {
      // Ignore missing files when users replace their image.
    }
  }

  await ensureProfileImageStorage();
  const filename = `user-${userId}-${Date.now()}-${randomUUID()}.${getProfileImageExtension(parsedImage.mimeType)}`;
  const filePath = path.join(profileImageStorageDir, filename);
  await writeFile(filePath, parsedImage.buffer);

  const profileImageUrl = `/api/uploads/profile-images/${filename}`;
  manifest[String(userId)] = {
    filename,
    url: profileImageUrl,
    mimeType: parsedImage.mimeType,
    updatedAt: new Date().toISOString(),
  };
  await writeProfileImageManifest(manifest);

  try {
    const usersTableAny = usersTable as typeof usersTable & Record<string, unknown>;
    if ("profileImageUrl" in usersTableAny) {
      await db
        .update(usersTable)
        .set({ profileImageUrl } as never)
        .where(eq(usersTable.id, userId));
    }
  } catch {
    // The manifest is the durable fallback when the users table does not expose the column.
  }

  res.status(201).json({
    profileImageUrl,
    updatedAt: manifest[String(userId)].updatedAt,
  });
});

router.get("/uploads/profile-images/:filename", async (req, res): Promise<void> => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(profileImageStorageDir, filename);

  try {
    await access(filePath);
  } catch {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  const manifest = await readProfileImageManifest();
  const image = Object.values(manifest).find((entry) => entry.filename === filename);

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.type(image?.mimeType ?? "application/octet-stream");
  res.send(await readFile(filePath));
});

router.get("/orders/:orderId/tracking", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetOrderTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const payload = await loadTrackingResponse(params.data.orderId, userId, !!user?.isAdmin);

  if (payload === null) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (payload === "forbidden") {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(GetTrackingHistoryResponse.parse(payload));
});

router.get("/orders/:orderId/tracking/stream", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const params = GetOrderTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const payload = await loadTrackingResponse(params.data.orderId, userId, !!user?.isAdmin);
  if (payload === null) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (payload === "forbidden") {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const orderCode = params.data.orderId;
  const listeners = subscribers.get(orderCode) ?? new Set<Response>();
  listeners.add(res);
  subscribers.set(orderCode, listeners);

  res.write(`event: tracking\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    const bucket = subscribers.get(orderCode);
    if (bucket) {
      bucket.delete(res);
      if (bucket.size === 0) {
        subscribers.delete(orderCode);
      }
    }
  });
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const parsed = AdminOrderSearchQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const search = parsed.data.q?.trim() ?? "";

  const baseOrderQuery = db
    .select({
      id: ordersTable.id,
      orderId: ordersTable.orderId,
      total: ordersTable.total,
      itemCount: ordersTable.itemCount,
      createdAt: ordersTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(ordersTable)
    .innerJoin(usersTable, eq(usersTable.id, ordersTable.userId));

  const orders = search
    ? await baseOrderQuery
        .where(
        or(
          ilike(ordersTable.orderId, `%${search}%`),
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
        ),
      )
        .orderBy(desc(ordersTable.createdAt))
        .limit(24)
    : await baseOrderQuery.orderBy(desc(ordersTable.createdAt)).limit(24);

  const orderIds = orders.map((order) => order.id);
  const events = orderIds.length
    ? await db
        .select({
          id: orderTrackingEventsTable.id,
          orderId: orderTrackingEventsTable.orderId,
          title: orderTrackingEventsTable.title,
          description: orderTrackingEventsTable.description,
          latitude: orderTrackingEventsTable.latitude,
          longitude: orderTrackingEventsTable.longitude,
          createdAt: orderTrackingEventsTable.createdAt,
        })
        .from(orderTrackingEventsTable)
        .where(inArray(orderTrackingEventsTable.orderId, orderIds))
        .orderBy(desc(orderTrackingEventsTable.createdAt))
    : [];

  const latestByOrder = new Map<number, ReturnType<typeof formatEvent>>();
  const countByOrder = new Map<number, number>();

  for (const event of events) {
    countByOrder.set(event.orderId, (countByOrder.get(event.orderId) ?? 0) + 1);
    if (!latestByOrder.has(event.orderId)) {
      latestByOrder.set(event.orderId, formatEvent(event));
    }
  }

  res.json(
    AdminOrderSearchResponse.parse(
      orders.map((order) => ({
        id: order.id,
        orderId: order.orderId,
        userName: order.userName,
        userEmail: order.userEmail,
        total: order.total,
        itemCount: order.itemCount,
        createdAt: order.createdAt.toISOString(),
        latestTrackingEvent: latestByOrder.get(order.id) ?? null,
        trackingCount: countByOrder.get(order.id) ?? 0,
      })),
    ),
  );
});

router.post("/admin/orders/:orderId/tracking-events", async (req, res): Promise<void> => {
  const userId = await requireAdmin(req, res);
  if (!userId) return;

  const params = GetOrderTrackingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateTrackingEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const order = await resolveOrderByCode(params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [event] = await db
    .insert(orderTrackingEventsTable)
    .values({
      orderId: order.id,
      ...parsed.data,
    })
    .returning();

  if (!event) {
    res.status(500).json({ error: "Failed to create tracking event" });
    return;
  }

  const currentPayload = await loadTrackingResponse(params.data.orderId, userId, true);
  if (currentPayload && currentPayload !== "forbidden") {
    broadcast(params.data.orderId, currentPayload);
  }

  res.status(201).json(TrackingEvent.parse(formatEvent(event)));
});

export default router;
