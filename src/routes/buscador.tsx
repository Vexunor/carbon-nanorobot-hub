import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useFactory, fmtTime } from "@/lib/factory-store";
import { PageHeader, Panel, Pill, statusTone } from "@/components/factory/ui";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/buscador")({
  head: () => pageMeta("Buscador de sucesos", "Busca sucesos de la fábrica, averías, avisos y las soluciones que se tomaron."),
  component: Finder,
});

type Hit = { key: string; source: string; when: string; title: string; detail: string; solution?: string; tag?: string };

const ARCHIVE: Hit[] = [
  { key: "h1", source: "Histórico", when: "Día -12", title: "Sobrecalentamiento del Reactor CVD β", detail: "Temperatura de 1.010 °C por fallo en el lazo de refrigeración.", solution: "Cambio de bomba de refrigerante y recalibración del sensor térmico. Parada de 42 min.", tag: "resuelta" },
  { key: "h2", source: "Histórico", when: "Día -9", title: "Retraso de envío de chips NX-Core", detail: "El dron de carga de Nvidion se desvió por tormenta.", solution: "Se activó stock de seguridad y se pidió un envío por Hyperloop.", tag: "resuelta" },
  { key: "h3", source: "Histórico", when: "Día -7", title: "Jabalíes en el muelle de carga", detail: "Tres jabalíes entraron por la valla norte.", solution: "Defensa nivel 2: ultrasonidos y luces. Valla reparada.", tag: "resuelta" },
  { key: "h4", source: "Histórico", when: "Día -5", title: "Micro-fisuras en lote de grafeno", detail: "El escáner de rayos X detectó fisuras en 14 robots VEX-6.", solution: "Lote devuelto a Hexa-Graphene; piezas recicladas.", tag: "resuelta" },
  { key: "h5", source: "Histórico", when: "Día -4", title: "Dron no autorizado sobre la planta", detail: "Dron sin identificar fotografiando la Sala Limpia A.", solution: "Defensa nivel 4: láser inutilizó el dron. Aviso a la policía.", tag: "resuelta" },
  { key: "h6", source: "Histórico", when: "Día -3", title: "Desmontaje de 2.000 VEX-3", detail: "Retirada de cuadrúpedos antiguos.", solution: "78% de piezas reutilizadas en VEX-6 y VEX-7.", tag: "resuelta" },
  { key: "h7", source: "Histórico", when: "Día -2", title: "Intento de intrusión en la valla sur", detail: "Dos personas intentaron cortar la valla de noche.", solution: "Defensa nivel 3: megafonía y microondas de disuasión. Huyeron sin heridos.", tag: "resuelta" },
  { key: "h8", source: "Histórico", when: "Día -1", title: "Batería de robot de logística agotada", detail: "LOG-03 se quedó sin carga en la Nave de Integración.", solution: "Remolcado por MNT-02; ajustado el umbral de recarga al 25%.", tag: "resuelta" },
];

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function Finder() {
  const [q, setQ] = useState("");
  const alerts = useFactory((s) => s.alerts);
  const log = useFactory((s) => s.log);
  const day = useFactory((s) => s.day);
  const all = useMemo<Hit[]>(() => [
    ...alerts.map((a) => ({ key: `a${a.id}`, source: `Aviso · ${a.type}`, when: `Día ${day} ${fmtTime(a.created)}`, title: a.title, detail: `${a.detail} · ${a.zone}${a.machineId ? ` · ${a.machineId}` : ""}`, solution: a.status === "resuelta" ? `Resuelta por la flota de ${a.type.toLowerCase()}${a.robotId ? ` (${a.robotId})` : ""}.` : undefined, tag: a.status })),
    ...log.map((l, i) => ({ key: `l${i}`, source: "Registro", when: `Día ${day} ${fmtTime(l.t)}`, title: l.msg, detail: "" })),
    ...ARCHIVE,
  ], [alerts, log, day]);
  const words = norm(q).split(/\s+/).filter(Boolean);
  const hits = words.length ? all.filter((h) => { const t = norm(`${h.title} ${h.detail} ${h.solution ?? ""} ${h.source}`); return words.every((w) => t.includes(w)); }) : all.slice(0, 30);

  return (
    <div>
      <PageHeader title="Buscador de sucesos" subtitle="Encuentra información detallada sobre averías, avisos, intrusiones y las soluciones tomadas. Busca por máquina, zona, proveedor o palabra clave." />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: reactor, dron, jabalíes, VEX-6, batería…" className="pl-9" aria-label="Buscar" />
      </div>
      <Panel title={`${hits.length} resultado${hits.length === 1 ? "" : "s"}`} icon={Search} className="mt-4">
        {hits.length === 0 ? <p className="text-sm text-muted-foreground">Sin resultados.</p> : (
          <ul className="divide-y">
            {hits.map((h) => (
              <li key={h.key} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{h.source}</span><span className="tabular">{h.when}</span>
                  {h.tag && <Pill tone={statusTone(h.tag)}>{h.tag}</Pill>}
                </div>
                <div className="mt-1 font-medium">{h.title}</div>
                {h.detail && <p className="text-sm text-muted-foreground">{h.detail}</p>}
                {h.solution && <p className="mt-1 text-sm"><span className="text-success">Solución:</span> {h.solution}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
