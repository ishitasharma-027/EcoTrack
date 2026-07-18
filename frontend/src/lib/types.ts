export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "citizen" | "admin";
  avatar?: string;
  created_at?: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  user_name?: string;
  image: string;
  detected_waste: string;
  confidence: number;
  location: { lat: number; lng: number; address?: string };
  description?: string;
  detections?: Detection[];
  status: "pending" | "in_progress" | "resolved" | "rejected";
  assigned_worker?: string;
  municipality?: string;
  date: string;
}

export interface Detection {
  class: string;
  confidence: number;
  bbox: { x1: number; y1: number; x2: number; y2: number };
}

export interface SegregationResult {
  category: string;
  confidence: number;
  disposal_bin: string;
  disposal_color: string;
  disposal_guide: string;
  image?: string;
  source?: string;
  all_detections?: Detection[];
}

export interface CollectionCenter {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  map_link: string;
  opening_time: string;
}

export interface EWasteSubmission {
  id: string;
  user_id: string;
  user_name?: string;
  image: string;
  waste_type: string;
  center_id: string;
  center_name: string;
  status: "pending" | "approved" | "rejected";
  points: number;
  verification_date?: string;
  date: string;
}

export interface Wallet {
  points: number;
  transactions: { type: string; amount: number; description: string; date: string }[];
}

export interface Reward {
  id: string;
  name: string;
  points_cost: number;
  icon: string;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  date: string;
}

export interface DashboardStats {
  complaints_total: number;
  complaints_resolved: number;
  complaints_pending: number;
  wallet_points: number;
  recent_complaints: Complaint[];
  waste_distribution: { name: string; value: number }[];
  complaint_trend: { date: string; count: number }[];
}

export interface AdminAnalytics {
  total_users: number;
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  ewaste_submissions: number;
  ewaste_pending: number;
  revenue_saved: number;
  complaint_trend: { date: string; count: number }[];
  waste_distribution: { name: string; value: number }[];
  status_distribution: { name: string; value: number }[];
}
