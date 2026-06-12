export type AuthRole = "admin" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: AuthRole;
}
