import axios from "axios";
import type {
  AdminAnalytics,
  CollectionCenter,
  Complaint,
  DashboardStats,
  EWasteSubmission,
  Notification,
  Reward,
  SegregationResult,
  User,
  Wallet,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ecotrack_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<{ access_token: string; user: User }>("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; user: User }>("/api/auth/login", data),
  me: () => api.get<User>("/api/auth/me"),
  updateProfile: (data: Partial<User>) => api.put<User>("/api/auth/profile", data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/api/auth/change-password", data),
};

export const aiApi = {
  detectIllegalWaste: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{
      image: string;
      detected_waste: string;
      confidence: number;
      is_illegal_dumping: boolean;
      detections: Complaint["detections"];
    }>("/api/detect-illegal-waste", form);
  },
  segregation: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<SegregationResult>("/api/segregation", form);
  },
};

export const complaintsApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{ items: Complaint[]; total: number }>("/api/complaints", { params }),
  get: (id: string) => api.get<Complaint>(`/api/complaints/${id}`),
  create: (data: object) => api.post<Complaint>("/api/complaints", data),
  update: (id: string, data: object) => api.patch<Complaint>(`/api/complaints/${id}`, data),
};

export const segregationApi = {
  saveHistory: (data: object) => api.post("/api/segregation/history", data),
  getHistory: () => api.get<{ items: SegregationResult[]; total: number }>("/api/segregation/history"),
};

export const ewasteApi = {
  getCenters: () => api.get<CollectionCenter[]>("/api/centers"),
  submit: (data: object) => api.post<EWasteSubmission>("/api/ewaste", data),
  list: (params?: { status?: string }) =>
    api.get<{ items: EWasteSubmission[]; total: number }>("/api/ewaste", { params }),
  verify: (id: string, data: { status: string; points?: number }) =>
    api.patch(`/api/ewaste/${id}/verify`, data),
  createCenter: (data: object) => api.post("/api/centers", data),
};

export const walletApi = {
  get: () => api.get<Wallet>("/api/wallet"),
  getRewards: () => api.get<Reward[]>("/api/rewards"),
  redeem: (reward_id: string) => api.post("/api/rewards/redeem", { reward_id }),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/api/dashboard/stats"),
};

export const adminApi = {
  analytics: () => api.get<AdminAnalytics>("/api/admin/analytics"),
  users: (params?: { search?: string }) => api.get("/api/admin/users", { params }),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  exportComplaints: () => api.get("/api/admin/export/complaints", { responseType: "blob" }),
};

export const notificationsApi = {
  list: () => api.get<{ items: Notification[]; unread_count: number }>("/api/notifications"),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch("/api/notifications/read-all"),
};

export default api;
