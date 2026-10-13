import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, Warehouse, PackageCheck, Boxes } from "lucide-react";
import { useFactory, materialSpec, supplierSpec } from "@/lib/factory-store";
import { DAILY_TARGET, MATERIALS, PHASES, SUPPLIERS } from "@/lib/factory-data";
import { PageHeader, Panel, Bar, Pill, nf, Kpi } from "@/components/factory/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/almacen")({
  head: () => pageMeta("Almacén logístico", "Diagrama móvil de recepción de materiales de proveedores y distribución interna a las líneas."),
  component: WarehousePage,
});

const SUP_Y = (i: number) => 30 + i * 42;
const DOCK_Y = [70, 170, 270, 370];
const ZONE_Y: Record<string, number> = { Síntesis: 60, Autoensamblaje: 160, Integración: 260, "Control de calidad": 360 };

function WarehousePage() {
  const s = useFactory();
  const [filter, setFilter] = useState("all");
  const dist = s.fleet.filter((f) => f.type === "Distribución" && f.status === "trabajando");
  const totalTransit = s.shipments.length;
  const arrivedToday = s.materials.reduce((a, m) => a + m.deliveries, 0);
  const coverage = Math.min(...s.materials.map((ms) => (ms.received - ms.consumed) / materialSpec(ms.id).perRobot));

  const rows = MATERIALS.filter((m) => filter === "all" || m.supplierId === filter);

  return (
    <div>
      <PageHeader title="Almacén logístico" subtitle="Recepción de materiales de laboratorios y fábricas proveedoras, almacenamiento en atmósfera inerte y distribución interna a cada fase de producción.">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[230px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {SUPPLIERS.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Envíos en tránsito" value={totalTransit} icon={Truck} />
        <Kpi label="Entregas recibidas hoy" value={arrivedToday} icon={PackageCheck} tone="success" />
        <Kpi label="Cobertura de stock" value={`${nf(Math.max(0, coverage))} robots`} icon={Boxes} tone={coverage < 60 ? "danger" : coverage < 150 ? "warning" : "success"} hint="Material más limitante" />
        <Kpi label="Robots distribuyendo" value={dist.length} icon={Warehouse} tone="info" />
      </div>

      <Panel title="Diagrama móvil del flujo logístico" icon={Truck} className="mt-4">
        <div className="overflow-x-auto">
          <svg viewBox="0 0 1000 450" className="min-w-[760px] w-full">
            <defs>
              <linearGradient id="stock" x1="0" x2="0" y1="1" y2="0">
                <stop offset="0" stopColor="var(--primary)" stopOpacity="0.9" />
                <stop offset="1" stopColor="var(--primary)" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Columnas */}
            {[["PROVEEDORES", 70], ["MUELLES", 350], ["ALMACÉN INERTE (Ar)", 560], ["LÍNEAS", 880]].map(([t, x]) => (
              <text key={t} x={x} y={14} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)" letterSpacing="2">{t}</text>
            ))}
            {SUPPLIERS.map((sp, i) => (
              <g key={sp.id} opacity={filter === "all" || filter === sp.id ? 1 : 0.25}>
                <rect x={5} y={SUP_Y(i) - 13} width={135} height={26} rx={4} fill="var(--secondary)" stroke="var(--border)" />
                <text x={12} y={SUP_Y(i) + 4} fontSize="10" fill="var(--foreground)">{sp.name.length > 21 ? sp.name.slice(0, 20) + "…" : sp.name}</text>
                <path d={`M140 ${SUP_Y(i)} C 230 ${SUP_Y(i)}, 230 ${DOCK_Y[i % 4]}, 320 ${DOCK_Y[i % 4]}`} fill="none" stroke="var(--border)" strokeWidth={1} />
              </g>
            ))}
            {DOCK_Y.map((y, i) => (
              <g key={i}>
                <rect x={320} y={y - 25} width={60} height={50} rx={4} fill="var(--card)" stroke="var(--accent)" />
                <text x={350} y={y + 4} textAnchor="middle" fontSize="11" fill="var(--accent)">M{i + 1}</text>
                <line x1={380} y1={y} x2={450} y2={ZONE_Y[PHASES[i].name]} stroke="var(--accent)" strokeOpacity={0.4} className="dash-flow" />
              </g>
            ))}
            {/* Envíos en movimiento */}
            {s.shipments.map((sh) => {
              const m = materialSpec(sh.materialId);
              const si = SUPPLIERS.findIndex((x) => x.id === m.supplierId);
              if (filter !== "all" && filter !== m.supplierId) return null;
              const t = Math.min(1, sh.progress);
              const y0 = SUP_Y(si), y1 = DOCK_Y[si % 4];
              const x = 140 + t * 180;
              const ease = t * t * (3 - 2 * t);
              const y = y0 + (y1 - y0) * ease;
              const drone = supplierSpec(m.supplierId).vehicle === "Dron de carga";
              return (
                <g key={sh.id} transform={`translate(${x} ${y})`} style={{ transition: "transform 1s linear" }}>
                  {drone ? <polygon points="0,-6 7,4 -7,4" fill="var(--info)" /> : <rect x={-7} y={-4} width={14} height={8} rx={2} fill="var(--accent)" />}
                  <title>{`${m.name} · ${sh.qty} ${m.unit} · ${Math.round(t * 100)}%`}</title>
                </g>
              );
            })}
            {/* Almacén */}
            {MATERIALS.map((m, i) => {
              const ms = s.materials.find((x) => x.id === m.id)!;
              const stock = Math.max(0, ms.received - ms.consumed);
              const ratio = Math.min(1, stock / (m.perRobot * 300));
              const col = i % 5, row = Math.floor(i / 5);
              const x = 455 + col * 42, y = 50 + row * 190;
              return (
                <g key={m.id} opacity={filter === "all" || filter === m.supplierId ? 1 : 0.25}>
                  <rect x={x} y={y} width={34} height={150} rx={3} fill="var(--background)" stroke="var(--border)" />
                  <rect x={x + 2} y={y + 148 - 146 * ratio} width={30} height={146 * ratio} rx={2} fill={ratio < 0.15 ? "var(--destructive)" : "url(#stock)"} style={{ transition: "all 1s" }} />
                  <text x={x + 17} y={y + 165} textAnchor="middle" fontSize="8" fill="var(--muted-foreground)">{m.id.replace("m-", "").toUpperCase()}</text>
                  <title>{`${m.name}: ${nf(stock)} ${m.unit}`}</title>
                </g>
              );
            })}
            {/* Líneas de producción */}
            {PHASES.map((p) => (
              <g key={p.name}>
                <rect x={810} y={ZONE_Y[p.name] - 30} width={180} height={60} rx={4} fill="var(--secondary)" stroke="var(--primary)" />
                <text x={900} y={ZONE_Y[p.name] + 4} textAnchor="middle" fontSize="12" fill="var(--primary)">{p.name}</text>
                <path id={`route-${p.name.length}`} d={`M670 ${ZONE_Y[p.name]} L810 ${ZONE_Y[p.name]}`} stroke="var(--primary)" strokeOpacity={0.35} className="dash-flow" fill="none" />
              </g>
            ))}
            {/* Robots de distribución interna */}
            {dist.map((d, i) => {
              const y = ZONE_Y[PHASES[i % 4].name];
              return (
                <circle key={d.id} r={5} fill="var(--success)">
                  <animateMotion dur={`${2 + (i % 3)}s`} repeatCount="indefinite" path={`M670 ${y} L805 ${y} L670 ${y}`} />
                  <title>{d.id}</title>
                </circle>
              );
            })}
          </svg>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-accent" /> Camión / Hyperloop</span>
          <span className="flex items-center gap-1"><span className="h-0 w-0 border-x-4 border-b-[7px] border-x-transparent border-b-info" /> Dron de carga</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Robot de distribución</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-destructive" /> Stock crítico</span>
        </div>
      </Panel>

      <Panel title="Recepciones necesarias para 1000 robots" icon={PackageCheck} className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead><TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Necesario/día</TableHead><TableHead className="text-right">Recibido</TableHead>
              <TableHead className="text-right">En tránsito</TableHead><TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[18%]">% recibido</TableHead><TableHead>Próxima ETA</TableHead><TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const ms = s.materials.find((x) => x.id === m.id)!;
              const need = m.perRobot * DAILY_TARGET;
              const stock = ms.received - ms.consumed;
              const next = s.shipments.filter((x) => x.materialId === m.id).sort((a, b) => b.progress - a.progress)[0];
              const eta = next ? Math.ceil((1 - next.progress) * next.travel) : null;
              const st = stock < m.perRobot * 40 ? "crítico" : stock < m.perRobot * 120 ? "bajo" : "recibido";
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{supplierSpec(m.supplierId).name}</TableCell>
                  <TableCell className="tabular text-right">{nf(need)} {m.unit}</TableCell>
                  <TableCell className="tabular text-right">{nf(ms.received)}</TableCell>
                  <TableCell className="tabular text-right text-info">{nf(ms.inTransit)}</TableCell>
                  <TableCell className="tabular text-right">{nf(stock)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2"><Bar value={(ms.received / need) * 100} /><span className="tabular w-10 text-right text-xs">{nf((ms.received / need) * 100)}%</span></div>
                  </TableCell>
                  <TableCell className="tabular text-xs">{eta !== null ? `${eta} min` : "—"}</TableCell>
                  <TableCell><Pill tone={st === "crítico" ? "danger" : st === "bajo" ? "warning" : "success"}>{st === "recibido" ? "OK" : st}</Pill></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}
