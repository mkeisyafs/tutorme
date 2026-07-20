import axios, { AxiosHeaders, type AxiosRequestConfig } from "axios";
import { readStoredSession } from "../auth/session";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiRequestOptions extends Omit<AxiosRequestConfig, "data" | "headers" | "url"> {
  body?: unknown;
  headers?: AxiosRequestConfig["headers"];
}

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: configuredBaseUrl,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const session = readStoredSession();
  if (!session?.token) return config;

  const headers = AxiosHeaders.from(config.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + session.token);
  }
  config.headers = headers;
  return config;
});

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (record.error && typeof record.error === "object") {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === "string") return nested.message;
    }
  }
  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, ...requestOptions } = options;

  try {
    const response = await apiClient.request<T>({
      ...requestOptions,
      url: path,
      data: body,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data;
      throw new ApiError(
        error.response?.status ?? 0,
        errorMessage(payload, error.message || "Network request failed."),
        payload,
      );
    }
    throw error;
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message;
  if (axios.isAxiosError(error)) return errorMessage(error.response?.data, error.message || fallback);
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
