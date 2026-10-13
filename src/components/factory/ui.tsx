import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-foreground md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const tones = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  muted: "text-muted-foreground",
} as const;
export type Tone = keyof typeof tones;

export function Kpi({ label, value, hint, icon: Icon, tone = "primary", children }: { label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: Tone; children?: ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", tones[tone])} />
      </div>
      <div className={cn("tabular mt-2 text-2xl font-semibold", tones[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      {children}
    </div>
  );
}

export function Panel({ title, icon: Icon, action, children, className }: { title: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </h2>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

const pill: Record<string, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-info/15 text-info border-info/30",
  primary: "bg-primary/15 text-primary border-primary/30",
  muted: "bg-muted text-muted-foreground border-border",
};
export function Pill({ tone, children, pulse }: { tone: keyof typeof pill; children: ReactNode; pulse?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium", pill[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse && "pulse-dot")} />
      {children}
    </span>
  );
}

export const statusTone = (s: string): keyof typeof pill =>
  ({ operativa: "success", disponible: "success", resuelta: "success", recibido: "success",
     advertencia: "warning", "en curso": "info", trabajando: "info", "en tránsito": "info",
     mantenimiento: "warning", cargando: "warning", pendiente: "warning", bajo: "warning",
     fallo: "danger", crítica: "danger", crítico: "danger", alta: "warning", media: "info", baja: "muted" } as Record<string, keyof typeof pill>)[s] ?? "muted";

export function Bar({ value, tone = "primary", className }: { value: number; tone?: Tone; className?: string }) {
  const bg = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-destructive", info: "bg-info", muted: "bg-muted-foreground" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all duration-700", bg)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export const healthTone = (h: number): Tone => (h >= 70 ? "success" : h >= 45 ? "warning" : "danger");
export const nf = (n: number, d = 0) => n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });
