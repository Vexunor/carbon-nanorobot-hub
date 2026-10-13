import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ScanLine, Leaf, Recycle, Factory, Wind } from "lucide-react";
import { useFactory } from "@/lib/factory-store";
import { PageHeader, Panel, Kpi, Bar, nf } from "@/components/factory/ui";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/calidad")({
  head: () => pageMeta("Calidad y sostenibilidad", "Protocolos de cero defectos, inspección atómica y huella de carbono negativa de la planta."),
  component: Quality,
});

const PROTOCOLS = [
  { t: "Inspección atómica", d: "Escáneres de refracción de rayos X detectan micro-fisuras en las nanocélulas.", icon: ScanLine },
  { t: "Contención ambiental", d: "Salas limpias con presión negativa y filtrado HEPA avanzado evitan fugas de polvo de nanocarbono.", icon: Wind },
  { t: "Seguridad del firmware", d: "Cifrado cuántico antes de activar las funciones autónomas de cada robot.", icon: ShieldCheck },
  { t: "Pruebas de fatiga", d: "Verificación de resiliencia y flexibilidad del carbono sintético en condiciones extremas.", icon: Factory },
];

function Quality() {
  const s = useFactory();
  const rate = s.inspected ? (s.defects / s.inspected) * 100 : 0;
  const net = s.co2Captured - s.co2Emitted;
  return (
    <div>
      <PageHeader title="Calidad y sostenibilidad" subtitle="Protocolos de cero defectos y balance ambiental: la fábrica captura más carbono del que emite y recicla el 100% de las nanocélulas de robots obsoletos." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Inspeccionados" value={nf(s.inspected)} icon={ScanLine} />
        <Kpi label="Defectos" value={nf(s.defects)} icon={ShieldCheck} tone="warning" />
        <Kpi label="Tasa defectos" value={`${nf(rate, 2)}%`} icon={ShieldCheck} tone={rate < 0.5 ? "success" : "warning"} hint="Objetivo < 0,5%" />
        <Kpi label="CO₂ capturado" value={`${nf(s.co2Captured / 1000, 2)} t`} icon={Leaf} tone="success" />
        <Kpi label="CO₂ emitido" value={`${nf(s.co2Emitted / 1000, 2)} t`} icon={Factory} tone="danger" />
        <Kpi label="Reciclado" value={`${nf(s.recycled, 1)} rob.`} icon={Recycle} tone="info" hint="Robots disueltos y reutilizados" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Balance de carbono" icon={Leaf}>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Capturado de la atmósfera</span><span className="tabular text-success">{nf(s.co2Captured)} kg</span></div>
              <Bar value={100} tone="success" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>Emitido por la planta</span><span className="tabular text-destructive">{nf(s.co2Emitted)} kg</span></div>
              <Bar value={(s.co2Emitted / Math.max(1, s.co2Captured)) * 100} tone="danger" />
            </div>
            <div className="rounded border border-success/30 bg-success/10 p-3 text-sm">
              Huella neta: <span className="tabular font-semibold text-success">−{nf(net)} kg CO₂</span> · carbono negativo
            </div>
          </div>
        </Panel>
        <Panel title="Protocolos de cero defectos" icon={ShieldCheck}>
          <ul className="space-y-3">
            {PROTOCOLS.map((p) => (
              <li key={p.t} className="flex gap-3">
                <p.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div><div className="font-medium">{p.t}</div><div className="text-sm text-muted-foreground">{p.d}</div></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
