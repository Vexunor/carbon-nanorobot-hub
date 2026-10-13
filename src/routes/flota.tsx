import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, BatteryCharging, Wrench, Truck, Sparkles, Shuffle, MapPin } from "lucide-react";
import { useFactory } from "@/lib/factory-store";
import { FLEET_TYPES, type FleetType } from "@/lib/factory-data";
import { PageHeader, Pill, statusTone, Bar, Kpi, nf } from "@/components/factory/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/flota")({
  head: () => pageMeta("Flota de servicio", "Robots de mantenimiento, logística, limpieza y distribución interna: batería, tarea y ubicación."),
  component: Fleet,
});

const ICON: Record<FleetType, typeof Bot> = { Mantenimiento: Wrench, Logística: Truck, Limpieza: Sparkles, Distribución: Shuffle };

function Fleet() {
  const s = useFactory();
  const [type, setType] = useState("all");
  const list = s.fleet.filter((f) => type === "all" || f.type === type);
  return (
    <div>
      <PageHeader title="Flota de servicio" subtitle="Robots autónomos que atienden los avisos de la planta. Se recargan solos cuando su batería baja del 25%.">
        <Tabs value={type} onValueChange={setType}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {FLEET_TYPES.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {FLEET_TYPES.map((t) => {
          const g = s.fleet.filter((f) => f.type === t);
          const Icon = ICON[t];
          return <Kpi key={t} label={t} value={`${g.filter((f) => f.status === "trabajando").length}/${g.length}`} icon={Icon} hint={`${g.reduce((a, f) => a + f.tasksDone, 0)} tareas completadas`} />;
        })}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((f) => {
          const Icon = ICON[f.type];
          const task = s.alerts.find((a) => a.id === f.alertId);
          return (
            <div key={f.id} className="panel p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-secondary"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><div className="tabular font-semibold">{f.id}</div><div className="text-xs text-muted-foreground">{f.type}</div></div>
                </div>
                <Pill tone={statusTone(f.status)} pulse={f.status === "trabajando"}>{f.status}</Pill>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <BatteryCharging className={`h-4 w-4 ${f.battery < 25 ? "text-destructive" : "text-success"}`} />
                <Bar value={f.battery} tone={f.battery < 25 ? "danger" : f.battery < 50 ? "warning" : "success"} />
                <span className="tabular w-10 text-right">{nf(f.battery)}%</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {f.zone}</div>
              <div className="mt-2 min-h-[2.5rem] rounded bg-background/60 p-2 text-xs">
                {task ? task.title : f.status === "cargando" ? "Recargando en estación" : "En espera de avisos"}
              </div>
              <div className="tabular mt-2 text-right text-[11px] text-muted-foreground">{f.tasksDone} tareas hoy</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
