import { z } from "zod";

export const AddressBody = z.object({
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

export const AddressParams = z.object({
  addressId: z.coerce.number().int().positive(),
});

export const Address = AddressBody.extend({
  id: z.number().int(),
  userId: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GetAddressesResponse = z.array(Address);

export const Store = z.object({
  id: z.number().int(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string(),
});

export const GetStoresResponse = z.array(Store);

export const NearestStoreQuery = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export const NearestStoreResponse = z.object({
  store: Store,
  distanceKm: z.number(),
  deliveryZone: z.string(),
});

export const GeoSearchQuery = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

export const GeoSearchResult = z.object({
  displayName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string().optional(),
});

export const GeoSearchResponse = z.array(GeoSearchResult);

export const GeoReverseQuery = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export const GeoReverseResponse = GeoSearchResult;

export const TrackingEvent = z.object({
  id: z.number().int(),
  orderId: z.number().int(),
  title: z.string(),
  description: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string(),
});

export const TrackingStage = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(["complete", "current", "pending"]),
  timestamp: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const TrackingHistoryOrder = z.object({
  id: z.number().int(),
  orderId: z.string(),
  total: z.number(),
  itemCount: z.number(),
  createdAt: z.string(),
});

export const GetOrderTrackingParams = z.object({
  orderId: z.string().min(1),
});

export const GetTrackingHistoryResponse = z.object({
  order: TrackingHistoryOrder,
  currentEvent: TrackingEvent.nullable(),
  events: z.array(TrackingEvent),
  stages: z.array(TrackingStage),
});

export const CreateTrackingEventBody = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export const AdminOrderSearchQuery = z.object({
  q: z.string().optional(),
});

export const AdminOrderSearchResult = z.object({
  id: z.number().int(),
  orderId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  total: z.number(),
  itemCount: z.number(),
  createdAt: z.string(),
  latestTrackingEvent: TrackingEvent.nullable(),
  trackingCount: z.number(),
});

export const AdminOrderSearchResponse = z.array(AdminOrderSearchResult);

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const ChangePasswordResponse = z.object({
  message: z.string(),
});
