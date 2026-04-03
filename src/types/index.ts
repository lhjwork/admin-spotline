// 공통 타입 정의
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  status?: number;
}

export type AdminRole = "super_admin" | "admin" | "moderator";

export interface Admin {
  id: string; // VERSION002에서 id로 변경
  username: string;
  email: string;
  role: AdminRole;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  admin: Admin;
  token: string;
  expiresIn: string;
}
