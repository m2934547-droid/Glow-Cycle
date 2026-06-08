import { Router, type IRouter, type Response } from "express";
import { asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db, orderTrackingEventsTable, ordersTable, usersTable } from "@workspace/db";
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
