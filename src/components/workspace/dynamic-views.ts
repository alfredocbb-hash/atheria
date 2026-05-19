import type { ComponentType } from "react";
import { FileText, Gauge, Pencil, Plus, Receipt, Wallet, Wrench, Users, type LucideIcon } from "lucide-react";
import { SocioNewView } from "./views/socio-new-view";
import { SuministroNewView } from "./views/suministro-new-view";
import { SuministroMetersView } from "./views/suministro-meters-view";
import { TarifaNewView } from "./views/tarifa-new-view";
import { TarifaEditView } from "./views/tarifa-edit-view";
import { LecturaNewView } from "./views/lectura-new-view";
import { FacturaNewView } from "./views/factura-new-view";
import { FacturaDetailView } from "./views/factura-detail-view";
import { ReclamoDetailView } from "./views/reclamo-detail-view";
import { CuadrillaEditView } from "./views/cuadrilla-edit-view";

export interface ViewComponentProps {
  tabId: string;
  payload?: any;
}

export const VIEW_REGISTRY: Record<string, ComponentType<ViewComponentProps>> = {
  "socio.new": SocioNewView,
  "socio.edit": SocioNewView,
  "suministro.new": SuministroNewView,
  "suministro.meters": SuministroMetersView,
  "tarifa.new": TarifaNewView,
  "tarifa.edit": TarifaEditView,
  "lectura.new": LecturaNewView,
  "factura.new": FacturaNewView,
  "factura.detail": FacturaDetailView,
  "reclamo.detail": ReclamoDetailView,
  "cuadrilla.edit": CuadrillaEditView,
};

export const ICONS: Record<string, LucideIcon> = {
  plus: Plus,
  pencil: Pencil,
  gauge: Gauge,
  receipt: Receipt,
  wallet: Wallet,
  wrench: Wrench,
  users: Users,
  file: FileText,
};
