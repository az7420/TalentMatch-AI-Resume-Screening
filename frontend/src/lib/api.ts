/**
 * TalentMatch AI – API Client
 * Centralized Axios instance with JWT auth, error handling, and request logging
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─────────────────────────────────────────
// Request Interceptor – Attach JWT Token
// ─────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("talentmatch_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────
// Response Interceptor – Error Handling
// ─────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid – redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("talentmatch_token");
        localStorage.removeItem("talentmatch_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────
export interface APIError {
  detail: string | { msg: string; type: string }[];
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as APIError;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) return data.detail[0]?.msg || "Validation error";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

// ─────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string; company?: string }) =>
    apiClient.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    apiClient.post("/auth/login", data),

  getProfile: () =>
    apiClient.get("/auth/me"),

  updateProfile: (data: { name?: string; company?: string }) =>
    apiClient.put("/auth/me", null, { params: data }),
};

// ─────────────────────────────────────────
// Job Description API
// ─────────────────────────────────────────
export const jdAPI = {
  create: (data: { title: string; content: string }) =>
    apiClient.post("/jd/", data),

  uploadFile: (formData: FormData) =>
    apiClient.post("/jd/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  list: (skip = 0, limit = 20) =>
    apiClient.get("/jd/", { params: { skip, limit } }),

  get: (id: number) =>
    apiClient.get(`/jd/${id}`),

  delete: (id: number) =>
    apiClient.delete(`/jd/${id}`),
};

// ─────────────────────────────────────────
// Resume API
// ─────────────────────────────────────────
export const resumeAPI = {
  upload: (formData: FormData, onUploadProgress?: (progress: number) => void) =>
    apiClient.post("/resumes/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    }),

  list: (jdId: number, skip = 0, limit = 50) =>
    apiClient.get(`/resumes/${jdId}/list`, { params: { skip, limit } }),

  delete: (candidateId: number) =>
    apiClient.delete(`/resumes/${candidateId}`),

  downloadUrl: (candidateId: number) =>
    `${BASE_URL}${API_PREFIX}/resumes/download/${candidateId}`,
};

// ─────────────────────────────────────────
// Analysis API
// ─────────────────────────────────────────
export const analysisAPI = {
  runAnalysis: (jdId: number, candidateIds?: number[]) =>
    apiClient.post(`/analyze/${jdId}`, null, {
      params: candidateIds ? { candidate_ids: candidateIds } : undefined,
    }),

  getCandidates: (
    jdId: number,
    params?: {
      search?: string;
      min_score?: number;
      max_score?: number;
      min_experience?: number;
      max_experience?: number;
      education?: string;
      recommendation?: string;
      sort_by?: string;
      skip?: number;
      limit?: number;
    }
  ) => apiClient.get(`/analyze/candidates/${jdId}`, { params }),

  getCandidateDetail: (candidateId: number) =>
    apiClient.get(`/analyze/candidate/${candidateId}`),
};

// ─────────────────────────────────────────
// Analytics API
// ─────────────────────────────────────────
export const analyticsAPI = {
  get: (jdId: number) =>
    apiClient.get(`/analytics/${jdId}`),
};

// ─────────────────────────────────────────
// Export API
// ─────────────────────────────────────────
export const exportAPI = {
  csvUrl: (jdId: number) =>
    `${BASE_URL}${API_PREFIX}/export/csv/${jdId}`,

  excelUrl: (jdId: number) =>
    `${BASE_URL}${API_PREFIX}/export/excel/${jdId}`,

  downloadWithAuth: async (url: string, filename: string) => {
    const token = localStorage.getItem("talentmatch_token");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
