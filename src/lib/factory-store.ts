import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DAILY_TARGET, FLEET_COUNT, FLEET_PREFIX, FLEET_TYPES, MACHINE_SPECS, MATERIALS, MODELS, PHASES, SHIFTS, SUPPLIERS,
  type FleetType, type Phase,
} from "./factory-data";

export type MachineStatus = "operativa" | "advertencia" | "mantenimiento" | "fallo";
export type Machine = {
  id: string; temp: number; pressure: number; vibration: number; health: number; status: MachineStatus; cycles: number;
};
export type AlertType = FleetType;
export type Priority = "crítica" | "alta" | "media" | "baja";
export type AlertStatus = "pendiente" | "en curso" | "resuelta";
export type Alert = {
  id: number; created: number; type: AlertType; priority: Priority; title: string; detail: string; zone: string;
  machineId?: string; robotId?: string; status: AlertStatus; duration: number; started?: number; resolved?: number;
};
export type FleetRobot = {
  id: string; type: FleetType; battery: number; status: "disponible" | "trabajando" | "cargando"; alertId?: number; zone: string; tasksDone: number;
};
export type Shipment = { id: number; materialId: string; qty: number; progress: number; travel: number };
export type MaterialState = { id: string; received: number; consumed: number; inTransit: number; deliveries: number };
export type LogEntry = { t: number; kind: "info" | "ok" | "warn" | "error"; msg: string };

export type FactoryState = {
  minute: number; day: number; speed: number; paused: boolean;
  produced: number; defects: number; inspected: number;
  hourly: number[]; tempHistory: { m: number; avg: number }[];
  machines: Machine[]; alerts: Alert[]; fleet: FleetRobot[]; shipments: Shipment[]; materials: MaterialState[];
  log: LogEntry[]; nextId: number; co2Captured: number; co2Emitted: number; recycled: number; stalls: number;
  setSpeed: (s: number) => void; togglePause: () => void; reset: () => void; tick: () => void;
  resolveAlert: (id: number) => void; assignAlert: (id: number) => void; scheduleMaintenance: (machineId: string) => void;
  createAlert: (type: AlertType, priority: Priority, title: string, detail: string, zone: string) => void;
};

// PRNG determinista para el estado inicial (evita discrepancias SSR/cliente)
function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initial() {
  const r = seeded(42);
  const machines: Machine[] = MACHINE_SPECS.map((s) => ({
    id: s.id, temp: s.tempNominal, pressure: s.pressureNominal, vibration: +(0.4 + r() * 0.6).toFixed(2),
    health: Math.round(62 + r() * 38), status: "operativa", cycles: Math.round(r() * 5000),
  }));
  const fleet: FleetRobot[] = [];
  FLEET_TYPES.forEach((t) => {
    for (let i = 1; i <= FLEET_COUNT[t]; i++)
      fleet.push({ id: `${FLEET_PREFIX[t]}-${String(i).padStart(2, "0")}`, type: t, battery: Math.round(55 + r() * 45), status: "disponible", zone: "Estación de carga", tasksDone: 0 });
  });
  const materials: MaterialState[] = MATERIALS.map((m) => ({ id: m.id, received: Math.round(m.perRobot * DAILY_TARGET * 0.12), consumed: 0, inTransit: 0, deliveries: 0 }));
  return {
    minute: 360, day: 1, speed: 10, paused: false,
    produced: 250, defects: 1, inspected: 251,
    hourly: Array.from({ length: 24 }, (_, h) => (h < 6 ? [42, 41, 43, 40, 42, 42][h] : 0)),
    tempHistory: [] as { m: number; avg: number }[],
    machines, fleet, materials, alerts: [] as Alert[], shipments: [] as Shipment[],
    log: [{ t: 360, kind: "info", msg: "Sistema NanoForge iniciado · objetivo 1000 robots/día" }] as LogEntry[],
    nextId: 1, co2Captured: 600, co2Emitted: 275, recycled: 12, stalls: 0,
  };
}

const PRIORITY_RANK: Record<Priority, number> = { crítica: 0, alta: 1, media: 2, baja: 3 };
const spec = (id: string) => MACHINE_SPECS.find((m) => m.id === id)!;
const mat = (id: string) => MATERIALS.find((m) => m.id === id)!;
const sup = (id: string) => SUPPLIERS.find((s) => s.id === id)!;
export const fmtTime = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
export const currentShift = (m: number) => SHIFTS.find((s) => m >= s.from && m < s.to) ?? SHIFTS[0];

type S = ReturnType<typeof initial>;

function pushLog(s: S, kind: LogEntry["kind"], msg: string) {
  s.log = [{ t: s.minute, kind, msg }, ...s.log].slice(0, 80);
}
function addAlert(s: S, a: Omit<Alert, "id" | "created" | "status">) {
  if (a.machineId && s.alerts.some((x) => x.machineId === a.machineId && x.status !== "resuelta")) return;
  s.alerts = [{ ...a, id: s.nextId++, created: s.minute, status: "pendiente" }, ...s.alerts].slice(0, 150);
}

function dispatch(s: S) {
  const pending = s.alerts.filter((a) => a.status === "pendiente").sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  for (const a of pending) {
    const bot = s.fleet.filter((f) => f.type === a.type && f.status === "disponible" && f.battery > 20).sort((x, y) => y.battery - x.battery)[0];
    if (!bot) continue;
    bot.status = "trabajando"; bot.alertId = a.id; bot.zone = a.zone;
    a.status = "en curso"; a.robotId = bot.id; a.started = s.minute;
    if (a.machineId) { const m = s.machines.find((x) => x.id === a.machineId); if (m && m.status !== "fallo") m.status = "mantenimiento"; }
    pushLog(s, "info", `${bot.id} asignado automáticamente a «${a.title}»`);
  }
}

function finishAlert(s: S, a: Alert) {
  a.status = "resuelta"; a.resolved = s.minute;
  const bot = s.fleet.find((f) => f.id === a.robotId);
  if (bot) { bot.status = "disponible"; bot.alertId = undefined; bot.tasksDone++; }
  if (a.machineId) {
    const m = s.machines.find((x) => x.id === a.machineId)!;
    const sp = spec(m.id);
    m.health = 100; m.status = "operativa"; m.temp = sp.tempNominal; m.pressure = sp.pressureNominal; m.vibration = 0.4;
  }
  pushLog(s, "ok", `Resuelto: ${a.title}${a.robotId ? ` (${a.robotId})` : ""}`);
}

function simulateMinute(s: S) {
  s.minute++;
  if (s.minute >= 1440) {
    pushLog(s, "ok", `Día ${s.day} cerrado con ${Math.floor(s.produced)} robots`);
    s.minute = 0; s.day++; s.produced = 0; s.defects = 0; s.inspected = 0; s.hourly = Array(24).fill(0);
    s.materials.forEach((m) => { const left = m.received - m.consumed; m.received = Math.max(0, left); m.consumed = 0; m.deliveries = 0; });
  }
  const R = Math.random;

  // Máquinas: deriva térmica, desgaste, fallos
  for (const m of s.machines) {
    const sp = spec(m.id);
    if (m.status === "mantenimiento" || m.status === "fallo") continue;
    m.cycles++;
    m.health = Math.max(0, m.health - (0.01 + R() * 0.035));
    const wear = (100 - m.health) / 100;
    const span = Math.max(4, Math.abs(sp.tempNominal) * 0.03);
    m.temp = +(sp.tempNominal + (R() - 0.5) * span * 0.3 + wear * span * 1.2).toFixed(1);
    m.pressure = +(sp.pressureNominal * (1 + (R() - 0.5) * 0.04 + wear * 0.08)).toFixed(2);
    m.vibration = +(0.3 + wear * 2.2 + R() * 0.2).toFixed(2);
    if (m.health < 55 && m.status === "operativa") {
      m.status = "advertencia";
      addAlert(s, { type: "Mantenimiento", priority: "media", title: `Mantenimiento predictivo ${m.id}`, detail: `Gemelo digital prevé desgaste (salud ${m.health.toFixed(0)}%) en ${sp.name}`, zone: sp.zone, machineId: m.id, duration: 35 });
      pushLog(s, "warn", `${m.id}: salud ${m.health.toFixed(0)}% · mantenimiento programado`);
    }
    if (R() < 0.00045 + wear * 0.0018) {
      m.status = "fallo";
      const causes = ["micro-fisura detectada en cabezal", "sobretemperatura en núcleo", "desalineación de emisor láser", "obstrucción en nano-inyector", "pérdida de vacío"];
      const c = causes[Math.floor(R() * causes.length)];
      s.alerts = s.alerts.filter((a) => !(a.machineId === m.id && a.status === "pendiente"));
      addAlert(s, { type: "Mantenimiento", priority: "crítica", title: `FALLO ${m.id}: ${c}`, detail: `${sp.name} detenida en ${sp.zone}. Línea de ${sp.phase} con capacidad reducida.`, zone: sp.zone, machineId: m.id, duration: 50 });
      pushLog(s, "error", `Fallo en ${m.id}: ${c}`);
    }
  }

  // Capacidad por fase
  const phaseCap = (p: Phase) => {
    const ms = s.machines.filter((m) => spec(m.id).phase === p);
    return ms.reduce((a, m) => a + (m.status === "operativa" || m.status === "advertencia" ? 1 : 0), 0) / ms.length;
  };
  const cap = Math.min(...PHASES.map((p) => Math.min(1, phaseCap(p.name) * 1.25)));
  const short = s.materials.find((ms) => ms.received - ms.consumed < mat(ms.id).perRobot * 2);
  let rate = (DAILY_TARGET / 1440) * 1.06 * cap * (0.94 + R() * 0.12);
  if (short) {
    rate = 0; s.stalls++;
    if (s.stalls % 30 === 1) {
      pushLog(s, "error", `Línea detenida: falta ${mat(short.id).name}`);
      addAlert(s, { type: "Distribución", priority: "crítica", title: `Reponer ${mat(short.id).name}`, detail: `Stock en línea agotado. Traer desde almacén inerte.`, zone: "Almacén inerte", duration: 10 });
    }
  }
  if (s.produced >= DAILY_TARGET && s.minute > 0) rate *= 0.15;
  s.produced += rate;
  s.hourly[Math.floor(s.minute / 60)] += rate;
  s.materials.forEach((ms) => (ms.consumed += rate * mat(ms.id).perRobot));
  const inspected = rate;
  s.inspected += inspected;
  s.defects += inspected * (0.003 + (1 - cap) * 0.02) * (R() * 2);
  s.co2Captured += rate * 2.4;
  s.co2Emitted += rate * 1.1;
  s.recycled += rate * 0.05;

  // Logística: pedidos y envíos
  for (const ms of s.materials) {
    const m = mat(ms.id);
    const target = m.perRobot * DAILY_TARGET * Math.min(1.05, (s.minute + 240) / 1440);
    if (ms.received + ms.inTransit < target) {
      const supl = sup(m.supplierId);
      s.shipments.push({ id: s.nextId++, materialId: m.id, qty: m.batch, progress: 0, travel: supl.transit * (0.85 + R() * 0.3) });
      ms.inTransit += m.batch;
    }
  }
  for (const sh of s.shipments) sh.progress += 1 / sh.travel;
  const arrived = s.shipments.filter((sh) => sh.progress >= 1);
  s.shipments = s.shipments.filter((sh) => sh.progress < 1);
  for (const sh of arrived) {
    const ms = s.materials.find((x) => x.id === sh.materialId)!;
    const m = mat(sh.materialId);
    ms.inTransit -= sh.qty; ms.received += sh.qty; ms.deliveries++;
    addAlert(s, { type: "Logística", priority: "media", title: `Descarga ${m.name}`, detail: `${sh.qty} ${m.unit} de ${sup(m.supplierId).name} en muelle ${1 + (sh.id % 4)}`, zone: "Muelles de carga", duration: 8 + Math.round(R() * 6) });
    if (R() < 0.6) addAlert(s, { type: "Distribución", priority: "baja", title: `Distribuir ${m.name} a ${m.phase}`, detail: `Trasladar lote desde almacén inerte a línea de ${m.phase}`, zone: "Almacén inerte", duration: 6 + Math.round(R() * 6) });
  }

  // Limpieza / contención de nanopartículas
  if (R() < 0.006) {
    const zones = ["Sala Limpia A", "Sala Limpia B", "Nave de Integración", "Laboratorio QA"];
    const z = zones[Math.floor(R() * zones.length)];
    const ppm = (0.8 + R() * 2.5).toFixed(1);
    addAlert(s, { type: "Limpieza", priority: +ppm > 2.5 ? "alta" : "media", title: `Partículas de nanocarbono en ${z}`, detail: `Sensor HEPA detecta ${ppm} µg/m³. Activar presión negativa y limpieza.`, zone: z, duration: 12 + Math.round(R() * 10) });
    pushLog(s, "warn", `Contaminación ${ppm} µg/m³ en ${z}`);
  }

  // Progreso de tareas y baterías
  for (const a of s.alerts) if (a.status === "en curso" && a.started !== undefined && s.minute - a.started >= a.duration) finishAlert(s, a);
  for (const f of s.fleet) {
    if (f.status === "trabajando") f.battery = Math.max(0, f.battery - 0.25);
    else if (f.status === "cargando") { f.battery = Math.min(100, f.battery + 1.2); if (f.battery >= 98) f.status = "disponible"; }
    else if (f.battery < 25) { f.status = "cargando"; f.zone = "Estación de carga"; }
    f.battery = +f.battery.toFixed(1);
  }
  dispatch(s);

  if (s.minute % 10 === 0) {
    const avg = s.machines.filter((m) => spec(m.id).tempNominal < 100).reduce((a, m) => a + m.temp, 0) / s.machines.filter((m) => spec(m.id).tempNominal < 100).length;
    s.tempHistory = [...s.tempHistory, { m: s.minute, avg: +avg.toFixed(1) }].slice(-72);
  }
}

export const useFactory = create<FactoryState>()(
  persist(
    (set, get) => ({
      ...initial(),
      setSpeed: (speed) => set({ speed }),
      togglePause: () => set({ paused: !get().paused }),
      reset: () => set(initial()),
      tick: () => {
        const st = get();
        if (st.paused) return;
        const s = structuredClone({ ...initial(), ...pick(st) }) as S;
        for (let i = 0; i < st.speed; i++) simulateMinute(s);
        set(s);
      },
      resolveAlert: (id) => {
        const s = structuredClone(pick(get())) as S;
        const a = s.alerts.find((x) => x.id === id);
        if (a && a.status !== "resuelta") finishAlert(s, a);
        dispatch(s); set(s);
      },
      assignAlert: (id) => {
        const s = structuredClone(pick(get())) as S;
        const a = s.alerts.find((x) => x.id === id);
        if (a) { a.priority = "crítica"; dispatch(s); if (a.status === "pendiente") pushLog(s, "warn", `Sin robots ${a.type} disponibles para «${a.title}»`); }
        set(s);
      },
      scheduleMaintenance: (machineId) => {
        const s = structuredClone(pick(get())) as S;
        const sp = spec(machineId);
        addAlert(s, { type: "Mantenimiento", priority: "alta", title: `Calibración atómica ${machineId}`, detail: `Parada técnica manual solicitada para ${sp.name}`, zone: sp.zone, machineId, duration: 25 });
        dispatch(s); set(s);
      },
      createAlert: (type, priority, title, detail, zone) => {
        const s = structuredClone(pick(get())) as S;
        addAlert(s, { type, priority, title, detail, zone, duration: 15 });
        pushLog(s, "info", `Aviso manual creado: ${title}`);
        dispatch(s); set(s);
      },
    }),
    { name: "nanoforge-v1", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

function pick(st: FactoryState): S {
  const { setSpeed, togglePause, reset, tick, resolveAlert, assignAlert, scheduleMaintenance, createAlert, ...rest } = st;
  return rest as S;
}

export { spec as machineSpec, mat as materialSpec, sup as supplierSpec, MODELS };
