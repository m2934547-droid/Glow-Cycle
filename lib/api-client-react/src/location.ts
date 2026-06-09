import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import * as zod from "zod";
import { customFetch } from "./custom-fetch";
import {
  Address,
  AddressBody,
  AddressParams,
  AdminOrderSearchQuery,
  AdminOrderSearchResponse,
  CreateTrackingEventBody,
  GeoReverseQuery,
  GeoReverseResponse,
  GeoSearchQuery,
  GeoSearchResponse,
  GetAddressesResponse,
  GetOrderTrackingParams,
  GetTrackingHistoryResponse,
  GetStoresResponse,
  NearestStoreQuery,
  NearestStoreResponse,
  TrackingEvent,
} from "@workspace/api-zod";

type SecondParameter<T extends (...args: any[]) => any> = T extends (first: any, ...args: infer P) => any ? P[0] : never;

async function fetchAndParse<T>(url: string, request?: RequestInit, parser?: { parse(data: unknown): T }): Promise<T> {
  const data = await customFetch<unknown>(url, request);
  return parser ? parser.parse(data) : (data as T);
}

export const getGetAddressesUrl = () => `/api/addresses`;
export const getGetAddressesQueryKey = () => [`/api/addresses`] as const;
export const getGetAddressesQueryOptions = <TData = Awaited<ReturnType<typeof getAddresses>>, TError = Error>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getAddresses>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetAddressesQueryKey();
  const queryFn = ({ signal }: { signal: AbortSignal }) => getAddresses({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getAddresses>>, TError, TData> & { queryKey: readonly unknown[] };
};
export const getAddresses = async (options?: RequestInit): Promise<zod.infer<typeof GetAddressesResponse>> =>
  fetchAndParse(getGetAddressesUrl(), { ...options, method: "GET" }, GetAddressesResponse);
export function useGetAddresses<TData = Awaited<ReturnType<typeof getAddresses>>, TError = Error>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getAddresses>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  return useQuery(getGetAddressesQueryOptions<TData, TError>(options));
}

export const getCreateAddressUrl = () => `/api/addresses`;
export const createAddress = async (data: zod.infer<typeof AddressBody>, options?: RequestInit): Promise<zod.infer<typeof Address>> => {
  return fetchAndParse(getCreateAddressUrl(), { ...options, method: "POST", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, body: JSON.stringify(data) }, Address);
};
export function useCreateAddress<TContext = unknown>(options?: UseMutationOptions<Awaited<ReturnType<typeof createAddress>>, Error, zod.infer<typeof AddressBody>, TContext>) {
  return useMutation({
    mutationFn: (data) => createAddress(data),
    ...options,
  });
}

export const getUpdateAddressUrl = (addressId: number) => `/api/addresses/${addressId}`;
export const updateAddress = async (addressId: number, data: zod.infer<typeof AddressBody>, options?: RequestInit): Promise<zod.infer<typeof Address>> => {
  return fetchAndParse(getUpdateAddressUrl(addressId), { ...options, method: "PUT", headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }, body: JSON.stringify(data) }, Address);
};
export function useUpdateAddress<TContext = unknown>(options?: UseMutationOptions<Awaited<ReturnType<typeof updateAddress>>, Error, { addressId: number; data: zod.infer<typeof AddressBody> }, TContext>) {
  return useMutation({
    mutationFn: ({ addressId, data }) => updateAddress(addressId, data),
    ...options,
  });
}

export const getDeleteAddressUrl = (addressId: number) => `/api/addresses/${addressId}`;
export const deleteAddress = async (addressId: number, options?: RequestInit): Promise<{ message: string }> =>
  fetchAndParse<{ message: string }>(getDeleteAddressUrl(addressId), { ...options, method: "DELETE" });
export function useDeleteAddress<TContext = unknown>(options?: UseMutationOptions<Awaited<ReturnType<typeof deleteAddress>>, Error, number, TContext>) {
  return useMutation({
    mutationFn: (addressId) => deleteAddress(addressId),
    ...options,
  });
}

export const getGetStoresUrl = () => `/api/stores`;
export const getGetStoresQueryKey = () => [`/api/stores`] as const;
export const getGetStoresQueryOptions = <TData = Awaited<ReturnType<typeof getStores>>, TError = Error>(options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getStores>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetStoresQueryKey();
  const queryFn = ({ signal }: { signal: AbortSignal }) => getStores({ signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getStores>>, TError, TData> & { queryKey: readonly unknown[] };
};
export const getStores = async (options?: RequestInit): Promise<zod.infer<typeof GetStoresResponse>> =>
  fetchAndParse(getGetStoresUrl(), { ...options, method: "GET" }, GetStoresResponse);
export function useGetStores<TData = Awaited<ReturnType<typeof getStores>>, TError = Error>(
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getStores>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  return useQuery(getGetStoresQueryOptions<TData, TError>(options));
}

export const getGetNearestStoreUrl = (query: { latitude: number; longitude: number }) =>
  `/api/stores/nearest?${new URLSearchParams({ latitude: String(query.latitude), longitude: String(query.longitude) }).toString()}`;
export const getGetNearestStoreQueryKey = (query: { latitude: number; longitude: number }) => [`/api/stores/nearest`, query.latitude, query.longitude] as const;
export const getGetNearestStoreQueryOptions = <TData = Awaited<ReturnType<typeof getNearestStore>>, TError = Error>(query: { latitude: number; longitude: number }, options?: {
  query?: UseQueryOptions<Awaited<ReturnType<typeof getNearestStore>>, TError, TData>;
  request?: SecondParameter<typeof customFetch>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetNearestStoreQueryKey(query);
  const queryFn = ({ signal }: { signal: AbortSignal }) => getNearestStore(query, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getNearestStore>>, TError, TData> & { queryKey: readonly unknown[] };
};
export const getNearestStore = async (query: { latitude: number; longitude: number }, options?: RequestInit): Promise<zod.infer<typeof NearestStoreResponse>> =>
  fetchAndParse(getGetNearestStoreUrl(query), { ...options, method: "GET" }, NearestStoreResponse);
export function useGetNearestStore<TData = Awaited<ReturnType<typeof getNearestStore>>, TError = Error>(
  query: { latitude: number; longitude: number },
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getNearestStore>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  return useQuery(getGetNearestStoreQueryOptions<TData, TError>(query, options));
}

export const getGeoSearchUrl = (query: { q: string; limit?: number }) =>
  `/api/geo/search?${new URLSearchParams({ q: query.q, ...(query.limit ? { limit: String(query.limit) } : {}) }).toString()}`;
export const getGeoSearchQueryKey = (query: { q: string; limit?: number }) => [`/api/geo/search`, query.q, query.limit ?? null] as const;
export const getGeoSearch = async (query: { q: string; limit?: number }, options?: RequestInit): Promise<zod.infer<typeof GeoSearchResponse>> =>
  fetchAndParse(getGeoSearchUrl(query), { ...options, method: "GET" }, GeoSearchResponse);
export function useGeoSearch<TData = Awaited<ReturnType<typeof getGeoSearch>>, TError = Error>(
  query: { q: string; limit?: number },
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getGeoSearch>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGeoSearchQueryKey(query);
  const queryFn = ({ signal }: { signal: AbortSignal }) => getGeoSearch(query, { signal, ...requestOptions });
  return useQuery({ queryKey, queryFn, enabled: query.q.trim().length > 1, ...queryOptions });
}

export const getGeoReverseUrl = (query: { latitude: number; longitude: number }) =>
  `/api/geo/reverse?${new URLSearchParams({ latitude: String(query.latitude), longitude: String(query.longitude) }).toString()}`;
export const getGeoReverseQueryKey = (query: { latitude: number; longitude: number }) => [`/api/geo/reverse`, query.latitude, query.longitude] as const;
export const getGeoReverse = async (query: { latitude: number; longitude: number }, options?: RequestInit): Promise<zod.infer<typeof GeoReverseResponse>> =>
  fetchAndParse(getGeoReverseUrl(query), { ...options, method: "GET" }, GeoReverseResponse);
export function useGeoReverse<TData = Awaited<ReturnType<typeof getGeoReverse>>, TError = Error>(
  query: { latitude: number; longitude: number },
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getGeoReverse>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGeoReverseQueryKey(query);
  const queryFn = ({ signal }: { signal: AbortSignal }) => getGeoReverse(query, { signal, ...requestOptions });
  return useQuery({ queryKey, queryFn, enabled: Number.isFinite(query.latitude) && Number.isFinite(query.longitude), ...queryOptions });
}

export const getGetOrderTrackingUrl = (orderId: string) => `/api/orders/${orderId}/tracking`;
export const getGetOrderTrackingQueryKey = (orderId: string) => [`/api/orders/${orderId}/tracking`] as const;
export const getGetOrderTrackingQueryOptions = <TData = Awaited<ReturnType<typeof getOrderTracking>>, TError = Error>(
  orderId: string,
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getOrderTracking>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetOrderTrackingQueryKey(orderId);
  const queryFn = ({ signal }: { signal: AbortSignal }) => getOrderTracking(orderId, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getOrderTracking>>, TError, TData> & { queryKey: readonly unknown[] };
};
export const getOrderTracking = async (orderId: string, options?: RequestInit): Promise<zod.infer<typeof GetTrackingHistoryResponse>> =>
  fetchAndParse(getGetOrderTrackingUrl(orderId), { ...options, method: "GET" }, GetTrackingHistoryResponse);
export function useGetOrderTracking<TData = Awaited<ReturnType<typeof getOrderTracking>>, TError = Error>(
  orderId: string,
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getOrderTracking>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  return useQuery(getGetOrderTrackingQueryOptions<TData, TError>(orderId, options));
}

export const createTrackingEvent = async (orderId: string, data: zod.infer<typeof CreateTrackingEventBody>, options?: RequestInit): Promise<zod.infer<typeof TrackingEvent>> =>
  fetchAndParse(`/api/admin/orders/${orderId}/tracking-events`, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    body: JSON.stringify(data),
  }, TrackingEvent);
export function useCreateTrackingEvent<TContext = unknown>(options?: UseMutationOptions<Awaited<ReturnType<typeof createTrackingEvent>>, Error, { orderId: string; data: zod.infer<typeof CreateTrackingEventBody> }, TContext>) {
  return useMutation({
    mutationFn: ({ orderId, data }) => createTrackingEvent(orderId, data),
    ...options,
  });
}

export const getGetAdminOrdersUrl = (query?: { q?: string }) =>
  `/api/admin/orders${query?.q ? `?${new URLSearchParams({ q: query.q }).toString()}` : ""}`;
export const getGetAdminOrdersQueryKey = (query?: { q?: string }) => [`/api/admin/orders`, query?.q ?? null] as const;
export const getGetAdminOrdersQueryOptions = <TData = Awaited<ReturnType<typeof getAdminOrders>>, TError = Error>(
  query?: { q?: string },
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminOrders>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGetAdminOrdersQueryKey(query);
  const queryFn = ({ signal }: { signal: AbortSignal }) => getAdminOrders(query, { signal, ...requestOptions });
  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<Awaited<ReturnType<typeof getAdminOrders>>, TError, TData> & { queryKey: readonly unknown[] };
};
export const getAdminOrders = async (query?: { q?: string }, options?: RequestInit): Promise<zod.infer<typeof AdminOrderSearchResponse>> =>
  fetchAndParse(getGetAdminOrdersUrl(query), { ...options, method: "GET" }, AdminOrderSearchResponse);
export function useGetAdminOrders<TData = Awaited<ReturnType<typeof getAdminOrders>>, TError = Error>(
  query?: { q?: string },
  options?: { query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminOrders>>, TError, TData>; request?: SecondParameter<typeof customFetch> },
) {
  return useQuery(getGetAdminOrdersQueryOptions<TData, TError>(query, options));
}
