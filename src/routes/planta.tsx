import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Thermometer, Gauge, Activity, Wrench, Cpu } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { useFactory, machineSpec, fmtTime } from "@/lib/factory-store";
import { PHASES } from "@/lib/factory-data";
import { PageHeader, Panel, Bar, Pill, statusTone, healthTone, nf, Kpi } from "@/components/factory/ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/planta")({
  head: () => pageMeta("Monitor de planta", "Temperatura, presión, vibración y salud de cada máquina con detección automática de fallos."),
  component: Plant,
});

function Plant() {
  const s = useFactory();
  const [phase, setPhase] = useState("all");
  const list = s.machines.filter((m) => phase === "all" || machineSpec(m.id).phase === phase);
  const fails = s.machines.filter((m) => m.status === "fallo").length;
  const warn = s.machines.filter((m) => m.status === "advertencia").length;
  const maint = s.machines.filter((m) => m.status === "mantenimiento").length;
  const avgHealth = s.machines.reduce((a, m) => a + m.health, 0) / s.machines.length;

  return (
    <div>
      <PageHeader title="Monitor de planta" subtitle="Parámetros de control de cada máquina en tiempo real. Los fallos se detectan automáticamente y generan avisos para los robots de mantenimiento.">
        <Tabs value={phase} onValueChange={setPhase}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Todas</TabsTrigger>
            {PHASES.map((p) => <TabsTrigger key={p.name} value={p.name}>{p.name}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Salud media" value={`${nf(avgHealth, 1)}%`} icon={Activity} tone={healthTone(avgHealth)} />
        <Kpi label="Fallos activos" value={fails} icon={Cpu} tone={fails ? "danger" : "success"} />
        <Kpi label="Advertencias" value={warn} icon={Gauge} tone={warn ? "warning" : "success"} />
        <Kpi label="En mantenimiento" value={maint} icon={Wrench} tone="info" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((m) => {
          const sp = machineSpec(m.id);
          const dev = Math.abs(m.temp - sp.tempNominal) / Math.max(4, Math.abs(sp.tempNominal) * 0.03);
          const border = m.status === "fallo" ? "border-destructive" : m.status === "advertencia" ? "border-warning" : "";
          return (
            <div key={m.id} className={`panel p-4 ${border}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="tabular text-xs text-muted-foreground">{m.id} · {sp.zone}</div>
                  <div className="font-display font-semibold">{sp.name}</div>
                </div>
                <Pill tone={statusTone(m.status)} pulse={m.status === "fallo"}>{m.status}</Pill>
              </div>
              <div className="tabular mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-background/60 p-2">
                  <Thermometer className="mx-auto h-3.5 w-3.5 text-info" />
                  <div className={`text-sm ${dev > 1 ? "text-warning" : ""}`}>{nf(m.temp, 1)}°</div>
                  <div className="text-[10px] text-muted-foreground">nom. {sp.tempNominal}°</div>
                </div>
                <div className="rounded bg-background/60 p-2">
                  <Gauge className="mx-auto h-3.5 w-3.5 text-primary" />
                  <div className="text-sm">{nf(m.pressure, 2)}</div>
                  <div className="text-[10px] text-muted-foreground">bar</div>
                </div>
                <div className="rounded bg-background/60 p-2">
                  <Activity className="mx-auto h-3.5 w-3.5 text-accent" />
                  <div className={`text-sm ${m.vibration > 1.4 ? "text-warning" : ""}`}>{nf(m.vibration, 2)}</div>
                  <div className="text-[10px] text-muted-foreground">mm/s</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Salud (gemelo digital)</span><span className="tabular">{nf(m.health)}%</span></div>
                <Bar value={m.health} tone={healthTone(m.health)} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular">{nf(m.cycles)} ciclos</span>
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={m.status === "mantenimiento" || m.status === "fallo"}
                  onClick={() => { s.scheduleMaintenance(m.id); toast.success(`Mantenimiento solicitado para ${m.id}`); }}>
                  <Wrench className="mr-1 h-3 w-3" /> Programar
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="Temperatura media de salas (°C)" icon={Thermometer} className="mt-4">
        <div className="h-56">
          {s.tempHistory.length < 2 ? (
            <p className="text-sm text-muted-foreground">Recopilando datos…</p>
          ) : (
            <ResponsiveContainer>
              <LineChart data={s.tempHistory.map((t) => ({ ...t, h: fmtTime(t.m) }))}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                <Line dataKey="avg" stroke="var(--info)" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>
    </div>
  );
}
