import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Recycle, Trash2, PackageCheck, Search } from "lucide-react";
import { useFactory } from "@/lib/factory-store";
import { PageHeader, Panel, Kpi, Pill, nf } from "@/components/factory/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/trazabilidad")({
  head: () => pageMeta("Trazabilidad de piezas", "Rastreo de piezas reutilizadas de modelos VEX antiguos y piezas desechadas tras control de calidad."),
  component: Trace,
});

const PARTS = ["Servoarticulación", "Matriz de sensores", "Chip NX-Core", "Batería", "Placa de fibra de carbono", "Nano-actuador", "Reductora armónica", "Cámara de visión"];
const FROM = ["VEX-1", "VEX-2", "VEX-3", "VEX-4"];
const TO = ["VEX-5", "VEX-6", "VEX-7", "VEX-7", "VEX-7"];
const REASONS = ["Micro-fisura en rayos X", "Corrosión en contactos", "Fatiga del material", "Capacidad de batería < 80%", "Holgura fuera de tolerancia"];
const ZONES = ["Nave de Integración", "Sala Limpia B", "Laboratorio QA"];

// Generador determinista para que servidor y navegador muestren lo mismo
const rnd = (i: number) => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x); };

type Part = { id: string; part: string; from: string; to: string; status: "Reutilizada" | "Desechada"; reason?: string; zone: string; time: string; health: number };

function build(day: number): Part[] {
  return Array.from({ length: 60 }, (_, i) => {
    const r = rnd(i + day * 100);
    const bad = r < 0.18;
    const health = bad ? Math.round(40 + rnd(i * 3) * 30) : Math.round(82 + rnd(i * 5) * 18);
    return {
      id: `PZ-${day}${String(1000 + i * 7).slice(-4)}`,
      part: PARTS[Math.floor(rnd(i * 2) * PARTS.length)],
      from: FROM[Math.floor(rnd(i * 4) * FROM.length)],
      to: bad ? "—" : TO[Math.floor(rnd(i * 6) * TO.length)],
      status: bad ? "Desechada" : "Reutilizada",
      reason: bad ? REASONS[Math.floor(rnd(i * 8) * REASONS.length)] : undefined,
      zone: ZONES[Math.floor(rnd(i * 9) * ZONES.length)],
      time: `${String(Math.floor(rnd(i * 11) * 24)).padStart(2, "0")}:${String(Math.floor(rnd(i * 13) * 60)).padStart(2, "0")}`,
      health,
    };
  });
}

function Trace() {
  const day = useFactory((s) => s.day);
  const recycled = useFactory((s) => s.recycled);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const all = useMemo(() => build(day), [day]);
  const ok = all.filter((p) => p.status === "Reutilizada").length;
  const ql = q.toLowerCase();
  const rows = all.filter((p) => (st === "all" || p.status === st) && (!ql || `${p.id} ${p.part} ${p.from} ${p.to} ${p.reason ?? ""}`.toLowerCase().includes(ql)));

  return (
    <div>
      <PageHeader title="Trazabilidad de piezas" subtitle="Cada pieza de los VEX desmontados tiene un código. Aquí ves de qué robot viene, a qué modelo nuevo va y cuáles se desecharon tras el control de calidad y por qué." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Piezas rastreadas hoy" value={all.length} icon={Search} />
        <Kpi label="Reutilizadas" value={ok} icon={PackageCheck} tone="success" hint={`${nf((ok / all.length) * 100, 0)}% del total`} />
        <Kpi label="Desechadas" value={all.length - ok} icon={Trash2} tone="danger" hint="Van a reciclaje de nanocarbono" />
        <Kpi label="Material reciclado" value={`${nf(recycled, 1)} kg`} icon={Recycle} tone="info" />
      </div>
      <Panel title="Registro de piezas" icon={Recycle} className="mt-4" action={
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código, pieza, modelo…" className="h-8 w-[200px] text-xs" aria-label="Buscar pieza" />
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Reutilizada">Reutilizadas</SelectItem>
              <SelectItem value="Desechada">Desechadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Código</TableHead><TableHead>Pieza</TableHead><TableHead>Origen</TableHead><TableHead>Destino</TableHead>
              <TableHead className="text-right">Estado %</TableHead><TableHead>Resultado</TableHead><TableHead>Motivo / Zona</TableHead><TableHead>Hora</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="tabular font-medium">{p.id}</TableCell>
                  <TableCell>{p.part}</TableCell>
                  <TableCell>{p.from}</TableCell>
                  <TableCell>{p.to}</TableCell>
                  <TableCell className="tabular text-right">{p.health}%</TableCell>
                  <TableCell><Pill tone={p.status === "Reutilizada" ? "success" : "danger"}>{p.status}</Pill></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.reason ?? "Apta"} · {p.zone}</TableCell>
                  <TableCell className="tabular text-xs">{p.time}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground">Sin resultados</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  );
}
