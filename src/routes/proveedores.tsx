import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical, Factory, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useFactory } from "@/lib/factory-store";
import { DAILY_TARGET, MATERIALS, SUPPLIERS } from "@/lib/factory-data";
import { PageHeader, Bar, Pill, nf } from "@/components/factory/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/proveedores")({
  head: () => pageMeta("Proveedores y laboratorios", "Laboratorios y fábricas que suministran nanocélulas, grafeno, actuadores, sensores y chips a la planta."),
  component: Suppliers,
});

function Suppliers() {
  const s = useFactory();
  const [kind, setKind] = useState("all");
  const list = SUPPLIERS.filter((x) => kind === "all" || x.kind === kind);
  return (
    <div>
      <PageHeader title="Proveedores y laboratorios" subtitle="Red de suministro que entrega productos finales y materia prima para el montaje. Despliega cada ficha para ver piezas, entregas y certificaciones.">
        <Tabs value={kind} onValueChange={setKind}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="Laboratorio">Laboratorios</TabsTrigger>
            <TabsTrigger value="Fábrica">Fábricas</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>
      <Accordion type="multiple" className="space-y-3">
        {list.map((sp) => {
          const mats = MATERIALS.filter((m) => m.supplierId === sp.id);
          const states = mats.map((m) => s.materials.find((x) => x.id === m.id)!);
          const pct = states.reduce((a, ms, i) => a + ms.received / (mats[i].perRobot * DAILY_TARGET), 0) / Math.max(1, mats.length) * 100;
          const transit = s.shipments.filter((sh) => mats.some((m) => m.id === sh.materialId)).length;
          const deliveries = states.reduce((a, b) => a + b.deliveries, 0);
          const Icon = sp.kind === "Laboratorio" ? FlaskConical : Factory;
          return (
            <AccordionItem key={sp.id} value={sp.id} className="panel border px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-4 pr-4 text-left">
                  <Icon className="h-5 w-5 text-primary" />
                  <div className="min-w-[200px]">
                    <div className="font-display text-base font-semibold">{sp.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {sp.city}, {sp.country}</div>
                  </div>
                  <Pill tone={sp.kind === "Laboratorio" ? "info" : "primary"}>{sp.kind}</Pill>
                  <div className="hidden flex-1 md:block">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Suministro del día</span><span className="tabular">{nf(pct)}%</span></div>
                    <Bar value={pct} />
                  </div>
                  <div className="tabular text-xs">
                    <span className="text-muted-foreground">Fiabilidad </span>
                    <span className={sp.reliability > 97 ? "text-success" : "text-warning"}>{sp.reliability}%</span>
                  </div>
                  {transit > 0 && <Pill tone="info" pulse>{transit} en camino</Pill>}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 pb-2 md:grid-cols-3">
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{sp.specialty}</p>
                    <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> {sp.vehicle} · {sp.transit} min de tránsito</div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> {sp.certified.join(" · ")}</div>
                    <div className="tabular">Entregas recibidas hoy: <span className="text-primary">{deliveries}</span></div>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    {mats.map((m, i) => {
                      const ms = states[i];
                      const need = m.perRobot * DAILY_TARGET;
                      return (
                        <div key={m.id} className="rounded border bg-background/60 p-3">
                          <div className="flex flex-wrap justify-between gap-2 text-sm">
                            <span className="font-medium">{m.name}</span>
                            <span className="tabular text-xs text-muted-foreground">{m.perRobot} {m.unit}/robot · lote {m.batch} · {m.assemblyMin} min montaje</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Bar value={(ms.received / need) * 100} tone="success" />
                            <span className="tabular w-36 text-right text-xs">{nf(ms.received)} / {nf(need)} {m.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
