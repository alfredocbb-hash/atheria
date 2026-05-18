import type { ComponentType } from "react";
import {
  FileText,
  Gauge,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { AdminDashboard } from "@/routes/_authenticated/admin.index";
import { AdminUsersPage } from "@/routes/_authenticated/admin.usuarios";
import { SociosPage } from "@/routes/_authenticated/admin.socios";
import { SuministrosPage } from "@/routes/_authenticated/admin.suministros";
import { FacturacionPage } from "@/routes/_authenticated/admin.facturacion";
import { TarifasPage } from "@/routes/_authenticated/admin.tarifas";
import { ReclamosPage } from "@/routes/_authenticated/admin.reclamos";
import { AuditPage } from "@/routes/_authenticated/admin.auditoria";

export type ModuleKey =
  | "dashboard"
  | "usuarios"
  | "socios"
  | "suministros"
  | "facturacion"
  | "tarifas"
  | "reclamos"
  | "auditoria";

export interface ModuleDef {
  key: ModuleKey;
  title: string;
  icon: LucideIcon;
  routeTo: string;
  Component: ComponentType;
  /** Pinned tabs can't be closed (e.g. Dashboard). */
  pinned?: boolean;
  adminOnly?: boolean;
}

export const MODULE_REGISTRY: Record<ModuleKey, ModuleDef> = {
  dashboard: {
    key: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    routeTo: "/admin",
    Component: AdminDashboard,
    pinned: true,
  },
  usuarios: {
    key: "usuarios",
    title: "Usuarios y Roles",
    icon: ShieldCheck,
    routeTo: "/admin/usuarios",
    Component: AdminUsersPage,
    adminOnly: true,
  },
  socios: {
    key: "socios",
    title: "Socios",
    icon: Users,
    routeTo: "/admin/socios",
    Component: SociosPage,
  },
  suministros: {
    key: "suministros",
    title: "Suministros",
    icon: Gauge,
    routeTo: "/admin/suministros",
    Component: SuministrosPage,
  },
  facturacion: {
    key: "facturacion",
    title: "Facturación",
    icon: Receipt,
    routeTo: "/admin/facturacion",
    Component: FacturacionPage,
  },
  tarifas: {
    key: "tarifas",
    title: "Tarifas",
    icon: Wallet,
    routeTo: "/admin/tarifas",
    Component: TarifasPage,
  },
  reclamos: {
    key: "reclamos",
    title: "Reclamos",
    icon: Wrench,
    routeTo: "/admin/reclamos",
    Component: ReclamosPage,
  },
  auditoria: {
    key: "auditoria",
    title: "Auditoría",
    icon: FileText,
    routeTo: "/admin/auditoria",
    Component: AuditPage,
    adminOnly: true,
  },
};

export const DEFAULT_TAB: ModuleKey = "dashboard";