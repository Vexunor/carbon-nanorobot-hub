import { createFileRoute } from "@tanstack/react-router";
import { Bot, Recycle, Factory, Layers } from "lucide-react";
import { useFactory } from "@/lib/factory-store";
import { VEX_GENERATIONS, DAILY_TARGET } from "@/lib/factory-data";
import { PageHeader, Panel, Kpi, Bar, Pill, nf } from "@/components/factory/ui";
import { pageMeta } from "@/lib/meta";
import v1 from "@/assets/vex-1.jpg";
import v2 from "@/assets/vex-2.jpg";
import v3 from "@/assets/vex-3.jpg";
import v4 from "@/assets/vex-4.jpg";
import v5 from "@/assets/vex-5.jpg";
import v6 from "@/assets/vex-6.jpg";
import v7 from "@/assets/vex-7.jpg";

const IMG: Record<string, string> = { "vex-1": v1, "vex-2": v2, "vex-3": v3, "vex-4": v4, "vex-5": v5, "vex-6": v6, "vex-7": v7 };

export const Route = createFileRoute("/modelos")({
  head: () => pageMeta("Modelos de robots VEX", "Evolución de los modelos VEX-1 a VEX-7, unidades fabricadas, reciclaje de modelos antiguos y reparto de la producción diaria."),
  component: Models,
});

function Models() {
  const produced = useFactory((s) => s.produced);
  const total = VEX_GENERATIONS.reduce((a, g) => a + g.built, 0);
  const active = VEX_GENERATIONS.filter((g) => g.share > 0);
  return (
    <div>
      <PageHeader title="Modelos de robots VEX" subtitle="Desde el VEX-1 hasta el VEX-7. Los modelos antiguos se desmontan: sus piezas son compatibles e intercambiables y se reciclan para los 3 modelos en producción. El VEX-7 recibe el 75% del límite diario." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Generaciones" value="7" icon={Layers} />
        <Kpi label="Robots fabricados (histórico)" value={nf(total + Math.floor(produced))} icon={Bot} />
        <Kpi label="En producción" value="VEX-5 · 6 · 7" icon={Factory} tone="success" />
        <Kpi label="Modelos en reciclaje" value="4" icon={Recycle} tone="warning" hint="VEX-1 a VEX-4" />
      </div>

      <Panel title="Reparto del límite diario" icon={Factory} className="mt-4">
        <div className="grid gap-3 md:grid-cols-3">
          {active.map((g) => {
            const qty = Math.round(DAILY_TARGET * g.share);
            const done = Math.floor(produced * g.share);
            return (
              <div key={g.id} className="flex items-center gap-3 rounded border p-3">
                <img src={IMG[g.id]} alt={`Logo ${g.name}`} width={56} height={56} loading="lazy" className="h-14 w-14 rounded" />
                <div className="flex-1">
                  <div className="flex justify-between"><span className="font-display font-semibold">{g.name}</span><span className="tabular text-sm text-primary">{Math.round(g.share * 100)}%</span></div>
                  <div className="tabular text-xs text-muted-foreground">{nf(done)} / {qty} robots hoy</div>
                  <Bar value={(done / qty) * 100} className="mt-2" />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...VEX_GENERATIONS].reverse().map((g) => (
          <div key={g.id} className="panel p-4">
            <div className="flex items-center gap-3">
              <img src={IMG[g.id]} alt={`Logo ${g.name}`} width={64} height={64} loading="lazy" className="h-16 w-16 rounded" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-bold">{g.name}</span>
                  <Pill tone={g.share > 0 ? "success" : "warning"}>{g.status}</Pill>
                </div>
                <div className="text-xs text-muted-foreground">{g.type} · {g.year}</div>
              </div>
            </div>
            <p className="mt-3 text-sm">{g.desc}</p>
            <p className="mt-1 text-xs text-muted-foreground">Inspirado en: {g.inspired}</p>
            <ul className="mt-2 flex flex-wrap gap-1">{g.specs.map((x) => <li key={x} className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{x}</li>)}</ul>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-muted-foreground">Fabricados</div><div className="tabular text-base">{nf(g.built)}</div></div>
              <div><div className="text-muted-foreground">Piezas reutilizables</div><div className="tabular text-base text-success">{g.reuse}%</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
