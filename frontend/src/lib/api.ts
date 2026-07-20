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

function fallbackMessageForStatus(status: number): string {
  if (status === 0) return "Unable to reach the server. Please check your connection and try again.";
  if (status === 400 || status === 422) return "Please check the information you entered and try again.";
  if (status === 401) return "Email or password is incorrect.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested service could not be found.";
  if (status >= 500) return "Invalid Credentials";
  return "Something went wrong. Please try again.";
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
      const status = error.response?.status ?? 0;
      throw new ApiError(
        status,
        errorMessage(payload, fallbackMessageForStatus(status)),
        payload,
      );
    }
    throw error;
  }
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    return errorMessage(error.response?.data, fallbackMessageForStatus(status));
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
