import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Wrench, BellRing, CheckCircle2, Zap, Plus, Clock } from "lucide-react";
import { useFactory, machineSpec, fmtTime, type Priority } from "@/lib/factory-store";
import { FLEET_TYPES, ZONES, type FleetType } from "@/lib/factory-data";
import { PageHeader, Panel, Pill, statusTone, Bar, healthTone, nf, Kpi } from "@/components/factory/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/mantenimiento")({
  head: () => pageMeta("Mantenimiento y avisos", "Cola de avisos asignados automáticamente a robots de mantenimiento, logística, limpieza y distribución."),
  component: Maintenance,
});

function NewAlert() {
  const create = useFactory((s) => s.createAlert);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FleetType>("Limpieza");
  const [prio, setPrio] = useState<Priority>("media");
  const [zone, setZone] = useState(ZONES[2]);
  const [title, setTitle] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Nuevo aviso</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Crear aviso manual</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Descripción del aviso" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          <div className="grid grid-cols-3 gap-2">
            <Select value={type} onValueChange={(v) => setType(v as FleetType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FLEET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={prio} onValueChange={(v) => setPrio(v as Priority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(["crítica", "alta", "media", "baja"] as Priority[]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!title.trim()} onClick={() => { create(type, prio, title.trim(), `Aviso creado por operador en ${zone}`, zone); setOpen(false); setTitle(""); toast.success("Aviso enviado a la flota"); }}>
            Enviar a la flota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Maintenance() {
  const s = useFactory();
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("open");
  const alerts = s.alerts.filter((a) =>
    (type === "all" || a.type === type) && (status === "all" || (status === "open" ? a.status !== "resuelta" : a.status === status)));
  const needing = [...s.machines].sort((a, b) => a.health - b.health).slice(0, 6);
  const resolved = s.alerts.filter((a) => a.status === "resuelta" && a.resolved !== undefined);
  const mttr = resolved.length ? resolved.reduce((a, x) => a + (x.resolved! - x.created + 1440) % 1440, 0) / resolved.length : 0;

  return (
    <div>
      <PageHeader title="Mantenimiento y avisos" subtitle="Todos los avisos se asignan automáticamente al robot disponible más adecuado según su tipo, prioridad y batería. Puedes forzar, resolver o crear avisos.">
        <NewAlert />
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Pendientes" value={s.alerts.filter((a) => a.status === "pendiente").length} icon={BellRing} tone="warning" />
        <Kpi label="En curso" value={s.alerts.filter((a) => a.status === "en curso").length} icon={Zap} tone="info" />
        <Kpi label="Resueltos" value={resolved.length} icon={CheckCircle2} tone="success" />
        <Kpi label="Tiempo medio resolución" value={`${nf(mttr)} min`} icon={Clock} />
      </div>

      <Panel title="Máquinas que requieren mantenimiento" icon={Wrench} className="mt-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {needing.map((m) => (
            <div key={m.id} className="rounded border bg-background/60 p-3">
              <div className="flex items-center justify-between text-xs"><span className="tabular">{m.id}</span><Pill tone={statusTone(m.status)}>{m.status}</Pill></div>
              <div className="mt-1 truncate text-sm">{machineSpec(m.id).name}</div>
              <Bar value={m.health} tone={healthTone(m.health)} className="mt-2" />
              <div className="tabular mt-1 text-xs text-muted-foreground">Salud {nf(m.health)}%</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Cola de avisos"
        icon={BellRing}
        className="mt-4"
        action={
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {FLEET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abiertos</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="en curso">En curso</SelectItem>
                <SelectItem value="resuelta">Resueltos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay avisos con este filtro. La planta funciona con normalidad.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead><TableHead>Prioridad</TableHead><TableHead>Tipo</TableHead><TableHead>Aviso</TableHead>
                <TableHead>Zona</TableHead><TableHead>Robot</TableHead><TableHead className="w-[12%]">Progreso</TableHead><TableHead>Estado</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.slice(0, 60).map((a) => {
                const prog = a.status === "resuelta" ? 100 : a.started !== undefined ? Math.min(100, ((s.minute - a.started + 1440) % 1440) / a.duration * 100) : 0;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="tabular text-xs">{fmtTime(a.created)}</TableCell>
                    <TableCell><Pill tone={statusTone(a.priority)}>{a.priority}</Pill></TableCell>
                    <TableCell className="text-xs">{a.type}</TableCell>
                    <TableCell><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-muted-foreground">{a.detail}</div></TableCell>
                    <TableCell className="text-xs">{a.zone}</TableCell>
                    <TableCell className="tabular text-xs text-primary">{a.robotId ?? "—"}</TableCell>
                    <TableCell><Bar value={prog} tone={a.status === "resuelta" ? "success" : "info"} /></TableCell>
                    <TableCell><Pill tone={statusTone(a.status)} pulse={a.status === "en curso"}>{a.status}</Pill></TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {a.status === "pendiente" && <Button size="sm" variant="outline" className="mr-1 h-7 text-xs" onClick={() => s.assignAlert(a.id)}>Forzar</Button>}
                      {a.status !== "resuelta" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { s.resolveAlert(a.id); toast.success("Aviso resuelto"); }}>Resolver</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
