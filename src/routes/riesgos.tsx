import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck, Activity, Wrench } from "lucide-react";
import { useFactory, machineSpec } from "@/lib/factory-store";
import { PageHeader, Panel, Kpi, Bar, Pill, nf } from "@/components/factory/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/riesgos")({
  head: () => pageMeta("Predicción de averías", "Riesgo de avería de cada máquina, tiempo estimado hasta el fallo y soluciones preparadas."),
  component: Risks,
});

const FIX: Record<string, { cause: string; fix: string; parts: string }> = {
  "Síntesis": { cause: "Sobretemperatura o pérdida de vacío en el reactor", fix: "Cambiar juntas de vacío y recalibrar el termopar; purgar con argón.", parts: "Juntas de vacío, termopar tipo K" },
  "Autoensamblaje": { cause: "Obstrucción del nano-inyector o deriva del campo magnético", fix: "Limpieza ultrasónica de boquillas y recalibrado de bobinas.", parts: "Boquillas de inyección, bobina de recambio" },
  "Integración": { cause: "Desalineación del brazo o del emisor láser", fix: "Realinear con láser de referencia y cambiar reductora armónica.", parts: "Reductora armónica, óptica láser" },
  "Control de calidad": { cause: "Degradación del tubo de rayos X o error de firmware", fix: "Cambiar tubo emisor y reinstalar firmware cifrado.", parts: "Tubo de rayos X, módulo cuántico" },
};

function Risks() {
  const machines = useFactory((s) => s.machines);
  const [phase, setPhase] = useState("all");
  const rows = machines.map((m) => {
    const sp = machineSpec(m.id);
    const wear = (100 - m.health) / 100;
    const risk = m.status === "fallo" ? 100 : Math.min(99, Math.round(wear * 70 + Math.max(0, m.vibration - 0.6) * 15 + (m.status === "advertencia" ? 12 : 0)));
    const eta = m.status === "fallo" ? 0 : Math.max(0, Math.round((m.health - 30) / 0.035 / 60));
    return { m, sp, risk, eta, ...FIX[sp.phase] };
  }).filter((r) => phase === "all" || r.sp.phase === phase).sort((a, b) => b.risk - a.risk);
  const high = rows.filter((r) => r.risk >= 50).length;
  const avg = rows.length ? rows.reduce((a, r) => a + r.risk, 0) / rows.length : 0;
  const tone = (r: number) => (r >= 70 ? "danger" : r >= 40 ? "warning" : "success") as const;

  return (
    <div>
      <PageHeader title="Predicción de averías" subtitle="El gemelo digital calcula el riesgo de avería de cada máquina según su desgaste y vibración, y propone la solución y las piezas para tenerlas preparadas.">
        <Select value={phase} onValueChange={setPhase}>
          <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fases</SelectItem>
            {Object.keys(FIX).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Máquinas analizadas" value={rows.length} icon={Activity} />
        <Kpi label="Riesgo alto (≥50%)" value={high} icon={AlertTriangle} tone={high ? "danger" : "success"} />
        <Kpi label="Riesgo medio" value={`${nf(avg, 0)}%`} icon={ShieldCheck} tone={avg > 40 ? "warning" : "success"} />
        <Kpi label="Acción recomendada" value={high ? "Revisar ya" : "Sin urgencias"} icon={Wrench} tone={high ? "warning" : "success"} />
      </div>
      <Panel title="Riesgos y soluciones" icon={AlertTriangle} className="mt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Máquina</TableHead><TableHead className="w-[16%]">Riesgo</TableHead><TableHead>Fallo en</TableHead>
              <TableHead>Causa probable</TableHead><TableHead>Solución preparada</TableHead><TableHead>Piezas a reservar</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.m.id}>
                  <TableCell><div className="font-medium">{r.m.id}</div><div className="text-xs text-muted-foreground">{r.sp.name} · {r.sp.phase}</div></TableCell>
                  <TableCell><div className="flex items-center gap-2"><Pill tone={tone(r.risk)}>{r.risk}%</Pill></div><Bar value={r.risk} tone={tone(r.risk)} className="mt-1" /></TableCell>
                  <TableCell className="tabular text-sm">{r.eta === 0 ? "Ahora" : `~${r.eta} h`}</TableCell>
                  <TableCell className="text-sm">{r.cause}</TableCell>
                  <TableCell className="text-sm">{r.fix}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.parts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
