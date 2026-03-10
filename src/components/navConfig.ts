import { Home, Users, Calendar, Receipt, CreditCard, ListTodo, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

export const mainNavItems: NavItem[] = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/patients", icon: Users, label: "Pazienti" },
  { path: "/calendar", icon: Calendar, label: "Agenda" },
  { path: "/invoices", icon: Receipt, label: "Fatture" },
  { path: "/payments", icon: CreditCard, label: "Pagamenti" },
  { path: "/tasks", icon: ListTodo, label: "Attività" },
];

export const bottomNavItems: NavItem[] = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/patients", icon: Users, label: "Pazienti" },
  { path: "/calendar", icon: Calendar, label: "Agenda" },
  { path: "/profile", icon: User, label: "Profilo" },
];

export const moreNavItems: NavItem[] = [
  { path: "/invoices", icon: Receipt, label: "Fatture" },
  { path: "/payments", icon: CreditCard, label: "Pagamenti" },
  { path: "/tasks", icon: ListTodo, label: "Attività" },
];

export const profileNavItem: NavItem = { path: "/profile", icon: User, label: "Profilo" };
