import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, Lock, Zap, Radio, Crosshair, Bird, Siren, Eye, LogOut } from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/factory/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/defensa")({
  head: () => pageMeta("Defensa de la fábrica", "Área restringida: sistemas de defensa por niveles contra animales e intrusiones no autorizadas."),
  component: Defense,
});

const KEY = "VEX-7";

const LEVELS = [
  { n: 1, name: "Vigilancia", tone: "success", desc: "Situación normal. Cámaras, sensores perimetrales y drones de patrulla." },
  { n: 2, name: "Disuasión", tone: "info", desc: "Animales o personas cerca del perímetro. Sonido, luz y avisos por megafonía." },
  { n: 3, name: "Alerta", tone: "warning", desc: "Intento de entrada. Microondas de disuasión y láser de deslumbramiento." },
  { n: 4, name: "Contención", tone: "danger", desc: "Intrusión confirmada. Láser de inutilización de drones y bloqueo de accesos." },
  { n: 5, name: "Defensa total", tone: "danger", desc: "Ataque armado. Ametralladoras automáticas autorizadas por el jefe de seguridad." },
] as const;

const SYSTEMS = [
  { name: "Torres de vigilancia IA", icon: Eye, level: 1, desc: "24 cámaras térmicas y LiDAR que detectan personas, vehículos y animales." },
  { name: "Disuasión de animales", icon: Bird, level: 2, desc: "Ultrasonidos, luces estroboscópicas y halcones-dron para aves, jabalíes y perros." },
  { name: "Sirenas y megafonía", icon: Siren, level: 2, desc: "Aviso verbal en 5 idiomas a intrusos antes de cualquier otra medida." },
  { name: "Emisor de microondas (ADS)", icon: Radio, level: 3, desc: "Sensación de calor en la piel que obliga a retirarse, sin causar lesiones." },
  { name: "Armas láser", icon: Zap, level: 4, desc: "Láser de 30 kW para derribar drones y cegar sensores enemigos." },
  { name: "Ametralladoras automáticas", icon: Crosshair, level: 5, desc: "4 torretas remotas. Solo disparan con autorización humana doble." },
];

function Defense() {
  const [ok, setOk] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [level, setLevel] = useState(1);
  useEffect(() => { if (sessionStorage.getItem("nf-def") === "1") setOk(true); }, []);

  if (!ok) {
    return (
      <div className="mx-auto mt-10 max-w-sm">
        <div className="panel p-6 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-xl font-bold uppercase tracking-wide">Área restringida</h1>
          <p className="mt-1 text-sm text-muted-foreground">Introduce la clave de acceso al sistema de defensa.</p>
          <form className="mt-4 space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (pw.trim().toUpperCase() === KEY) { sessionStorage.setItem("nf-def", "1"); setOk(true); } else setErr(true);
          }}>
            <Input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} placeholder="Clave" aria-label="Clave de acceso" autoFocus />
            {err && <p className="text-xs text-destructive">Clave incorrecta</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </div>
      </div>
    );
  }

  const cur = LEVELS[level - 1];
  return (
    <div>
      <PageHeader title="Defensa de la fábrica" subtitle="Sistemas de protección contra animales e intrusiones. La defensa se escala por niveles según la amenaza.">
        <Button size="sm" variant="outline" onClick={() => { sessionStorage.removeItem("nf-def"); setOk(false); setPw(""); }}><LogOut className="mr-1 h-4 w-4" />Cerrar acceso</Button>
      </PageHeader>

      <Panel title="Nivel de defensa" icon={Shield}>
        <div className="grid grid-cols-5 gap-2">
          {LEVELS.map((l) => (
            <button key={l.n} onClick={() => setLevel(l.n)} className={cn("rounded border p-2 text-left text-xs transition", level === l.n ? "border-primary bg-primary/15" : "hover:bg-muted")}>
              <div className="tabular text-lg font-bold">{l.n}</div>
              <div className="font-medium">{l.name}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm"><Pill tone={cur.tone} pulse={level >= 3}>Nivel {cur.n} · {cur.name}</Pill><span className="text-muted-foreground">{cur.desc}</span></div>
      </Panel>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SYSTEMS.map((s) => {
          const on = level >= s.level;
          return (
            <div key={s.name} className={cn("panel p-4", !on && "opacity-50")}>
              <div className="flex items-center justify-between">
                <s.icon className={cn("h-5 w-5", on ? "text-primary" : "text-muted-foreground")} />
                <Pill tone={on ? "success" : "muted"} pulse={on}>{on ? "Activo" : `Desde nivel ${s.level}`}</Pill>
              </div>
              <div className="mt-2 font-semibold">{s.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
