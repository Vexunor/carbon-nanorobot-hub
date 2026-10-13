import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, Clock, Layers } from "lucide-react";
import { useFactory, currentShift, supplierSpec } from "@/lib/factory-store";
import { DAILY_TARGET, MATERIALS, MODELS, PHASES, SHIFTS } from "@/lib/factory-data";
import { PageHeader, Panel, Bar, Pill, nf, Kpi } from "@/components/factory/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/planificacion")({
  head: () => pageMeta("Planificación de producción", "Plan de fabricación de 1000 robots al día por turno y modelo, con tiempos de montaje y avance porcentual."),
  component: Planning,
});

function Planning() {
  const s = useFactory();
  const [shift, setShift] = useState("all");
  const [model, setModel] = useState("all");
  const [phase, setPhase] = useState("all");
  const cur = currentShift(s.minute);

  // Avance por turno: lo producido se reparte cronológicamente
  const perShift = SHIFTS.map((sh) => s.hourly.slice(sh.from / 60, sh.to / 60).reduce((a, b) => a + b, 0));
  const shiftTarget = DAILY_TARGET / 3;
  const orders = SHIFTS.flatMap((sh, i) =>
    MODELS.map((m) => {
      const qty = Math.round(shiftTarget * m.share);
      const done = Math.min(qty, Math.floor(perShift[i] * m.share));
      const status = done >= qty ? "completada" : sh.id === cur.id ? "en curso" : s.minute < sh.from ? "programada" : "retrasada";
      return { id: `OF-${s.day}${sh.id}${m.id.slice(0, 2).toUpperCase()}`, shift: sh, model: m, qty, done, status };
    }),
  ).filter((o) => (shift === "all" || String(o.shift.id) === shift) && (model === "all" || o.model.id === model));

  const totalMin = MATERIALS.reduce((a, m) => a + m.assemblyMin, 0);
  const pieces = MATERIALS.filter((m) => phase === "all" || m.phase === phase);

  return (
    <div>
      <PageHeader title="Planificación de producción" subtitle="Plan diario de 1000 robots repartido en 3 turnos de 8 h y 3 modelos. Cada pieza muestra su tiempo de elaboración y el porcentaje completado del día.">
        <Select value={shift} onValueChange={setShift}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los turnos</SelectItem>
            {SHIFTS.map((x) => <SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los modelos</SelectItem>
            {MODELS.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Objetivo diario" value={nf(DAILY_TARGET)} icon={CalendarClock} hint="≈ 41,7 robots/hora" />
        <Kpi label="Takt time" value="86,4 s" icon={Clock} hint="1 robot cada 86,4 segundos" tone="info" />
        <Kpi label="Ciclo por robot" value={`${PHASES.reduce((a, p) => a + p.minutes, 0)} min`} icon={Layers} hint="Suma de las 4 fases" tone="warning" />
        <Kpi label="Montaje de piezas" value={`${nf(totalMin, 1)} min`} icon={Clock} hint="Tiempo total de piezas/robot" tone="success" />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {MODELS.map((m) => {
          const qty = Math.round(DAILY_TARGET * m.share);
          const done = Math.floor(s.produced * m.share);
          return (
            <div key={m.id} className="panel p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg font-semibold">{m.name}</span>
                <span className="tabular text-sm text-primary">{nf(done)} / {qty}</span>
              </div>
              <p className="text-xs text-muted-foreground">{m.desc} · {Math.round(m.share * 100)}% del plan</p>
              <Bar value={(done / qty) * 100} className="mt-3" />
            </div>
          );
        })}
      </div>

      <Panel title="Órdenes de fabricación" icon={CalendarClock} className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead><TableHead>Turno</TableHead><TableHead>Modelo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Hechos</TableHead>
              <TableHead className="w-[28%]">Avance</TableHead><TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const pct = (o.done / o.qty) * 100;
              return (
                <TableRow key={o.id}>
                  <TableCell className="tabular text-xs">{o.id}</TableCell>
                  <TableCell className="text-xs">{o.shift.name}</TableCell>
                  <TableCell className="font-medium">{o.model.name}</TableCell>
                  <TableCell className="tabular text-right">{o.qty}</TableCell>
                  <TableCell className="tabular text-right">{o.done}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bar value={pct} tone={pct >= 100 ? "success" : o.status === "retrasada" ? "danger" : "primary"} />
                      <span className="tabular w-12 text-right text-xs">{nf(pct, 0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Pill tone={o.status === "completada" ? "success" : o.status === "en curso" ? "info" : o.status === "retrasada" ? "danger" : "muted"} pulse={o.status === "en curso"}>{o.status}</Pill>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>

      <Panel
        title="Tiempos de elaboración y montaje por pieza"
        icon={Clock}
        className="mt-4"
        action={
          <Select value={phase} onValueChange={setPhase}>
            <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fases</SelectItem>
              {PHASES.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pieza</TableHead><TableHead>Proveedor</TableHead><TableHead>Fase</TableHead>
              <TableHead className="text-right">Por robot</TableHead><TableHead className="text-right">Min/robot</TableHead>
              <TableHead className="text-right">% del ciclo</TableHead><TableHead className="w-[24%]">Montado hoy (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pieces.map((m) => {
              const ms = s.materials.find((x) => x.id === m.id)!;
              const pct = (ms.consumed / (m.perRobot * DAILY_TARGET)) * 100;
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{supplierSpec(m.supplierId).name}</TableCell>
                  <TableCell className="text-xs">{m.phase}</TableCell>
                  <TableCell className="tabular text-right text-xs">{m.perRobot} {m.unit}</TableCell>
                  <TableCell className="tabular text-right">{nf(m.assemblyMin, 1)}</TableCell>
                  <TableCell className="tabular text-right text-accent">{nf((m.assemblyMin / totalMin) * 100, 1)}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bar value={pct} tone="success" />
                      <span className="tabular w-12 text-right text-xs">{nf(pct, 1)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}
