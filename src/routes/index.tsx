import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Factory, Gauge, Thermometer, TriangleAlert, Activity, ArrowRight, ScrollText } from "lucide-react";
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { useFactory, fmtTime, machineSpec } from "@/lib/factory-store";
import { DAILY_TARGET, PHASES } from "@/lib/factory-data";
import { PageHeader, Kpi, Panel, Bar, Pill, nf } from "@/components/factory/ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => pageMeta("Panel general", "Producción en vivo, alertas y estado de la fábrica de robots con nanocélulas de carbono."),
  component: Dashboard,
});

function Dashboard() {
  const s = useFactory();
  const produced = Math.round(s.produced);
  const expected = (DAILY_TARGET * s.minute) / 1440;
  const onPlan = expected ? (s.produced / expected) * 100 : 100;
  const ops = s.machines.filter((m) => m.status === "operativa" || m.status === "advertencia").length;
  const oee = (ops / s.machines.length) * Math.min(1, onPlan / 100) * (1 - s.defects / Math.max(1, s.inspected)) * 100;
  const cool = s.machines.filter((m) => machineSpec(m.id).tempNominal < 100);
  const avgTemp = cool.reduce((a, m) => a + m.temp, 0) / cool.length;
  const open = s.alerts.filter((a) => a.status !== "resuelta");
  const working = s.fleet.filter((f) => f.status === "trabajando").length;
  const hour = Math.floor(s.minute / 60);
  const data = s.hourly.map((v, h) => ({ h: `${String(h).padStart(2, "0")}h`, v: Math.round(v), cur: h === hour }));

  return (
    <div>
      <PageHeader title="Panel general" subtitle="Vista en tiempo real de la planta de manufactura molecular: producción diaria, eficiencia, temperatura y avisos atendidos automáticamente." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi label="Robots hoy" value={nf(produced)} icon={Factory} hint={`Objetivo ${DAILY_TARGET}`}>
          <Bar value={(produced / DAILY_TARGET) * 100} className="mt-2" />
        </Kpi>
        <Kpi label="Vs. plan" value={`${nf(onPlan, 1)}%`} icon={Activity} tone={onPlan >= 98 ? "success" : onPlan >= 90 ? "warning" : "danger"} hint={`Previstos ${nf(expected)} a las ${fmtTime(s.minute)}`} />
        <Kpi label="OEE" value={`${nf(oee, 1)}%`} icon={Gauge} tone={oee > 80 ? "success" : "warning"} hint={`${ops}/${s.machines.length} máquinas activas`} />
        <Kpi label="Temp. media salas" value={`${nf(avgTemp, 1)} °C`} icon={Thermometer} tone="info" hint="Excluye reactores CVD" />
        <Kpi label="Avisos abiertos" value={open.length} icon={TriangleAlert} tone={open.some((a) => a.priority === "crítica") ? "danger" : "warning"} hint={`${open.filter((a) => a.status === "en curso").length} en curso`} />
        <Kpi label="Robots servicio" value={`${working}/${s.fleet.length}`} icon={Bot} tone="primary" hint="trabajando ahora" />
      </div>

      <Panel title="Flujo de manufactura" className="mt-4">
        <div className="grid gap-3 md:grid-cols-4">
          {PHASES.map((p, i) => {
            const ms = s.machines.filter((m) => machineSpec(m.id).phase === p.name);
            const bad = ms.filter((m) => m.status === "fallo" || m.status === "mantenimiento").length;
            const wip = Math.round((p.minutes * DAILY_TARGET) / 1440 * (bad ? 0.7 : 1));
            return (
              <div key={p.name} className="relative rounded border bg-background/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">FASE {i + 1}</span>
                  <Pill tone={bad ? "warning" : "success"} pulse={!!bad}>{bad ? `${bad} parada` : "Fluida"}</Pill>
                </div>
                <div className="font-display mt-1 text-lg font-semibold">{p.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                <div className="tabular mt-2 flex justify-between text-xs">
                  <span>{p.minutes} min/robot</span><span className="text-primary">{wip} en proceso</span>
                </div>
                {i < 3 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary md:block" />}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Producción por hora" icon={Activity} className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="h" stroke="var(--muted-foreground)" fontSize={10} interval={1} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6 }} formatter={(v: number) => [`${v} robots`, "Producidos"]} />
                <ReferenceLine y={DAILY_TARGET / 24} stroke="var(--accent)" strokeDasharray="4 4" label={{ value: "Objetivo 42/h", fill: "var(--accent)", fontSize: 10, position: "insideTopRight" }} />
                <RBar dataKey="v" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Registro de eventos" icon={ScrollText} action={<Link to="/mantenimiento" className="text-xs text-primary">Ver avisos →</Link>}>
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-xs">
            {s.log.slice(0, 30).map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular text-muted-foreground">{fmtTime(l.t)}</span>
                <span className={l.kind === "error" ? "text-destructive" : l.kind === "warn" ? "text-warning" : l.kind === "ok" ? "text-success" : "text-foreground"}>{l.msg}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
