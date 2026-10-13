// Catálogos estáticos de la planta NanoForge (proveedores, materiales, máquinas, flota).

export type Supplier = {
  id: string;
  name: string;
  city: string;
  country: string;
  kind: "Laboratorio" | "Fábrica";
  specialty: string;
  reliability: number; // %
  transit: number; // minutos de viaje
  vehicle: "Camión" | "Dron de carga" | "Hyperloop";
  certified: string[];
};

export const SUPPLIERS: Supplier[] = [
  { id: "carbonix", name: "Carbonix Labs", city: "Zúrich", country: "Suiza", kind: "Laboratorio", specialty: "Nanocélulas de carbono sintético base (grado CVD-9N)", reliability: 98.4, transit: 70, vehicle: "Hyperloop", certified: ["ISO 9001", "ISO/TS 80004", "GMP Nano"] },
  { id: "hexagraph", name: "Hexa-Graphene", city: "Tokio", country: "Japón", kind: "Laboratorio", specialty: "Láminas de grafeno monocapa y nanotubos", reliability: 96.1, transit: 90, vehicle: "Dron de carga", certified: ["ISO 9001", "JIS Q 9100"] },
  { id: "bostonnano", name: "Boston Nanoactuators", city: "Boston", country: "EE. UU.", kind: "Laboratorio", specialty: "Nano-actuadores (músculos sintéticos)", reliability: 94.7, transit: 85, vehicle: "Dron de carga", certified: ["ISO 13485", "UL 3300"] },
  { id: "siemtrix", name: "Siemtrix Sensors", city: "Múnich", country: "Alemania", kind: "Fábrica", specialty: "Matrices de sensores táctiles y LiDAR", reliability: 97.9, transit: 55, vehicle: "Camión", certified: ["ISO 9001", "IATF 16949"] },
  { id: "kukavance", name: "Kuka-Vance Motion", city: "Augsburgo", country: "Alemania", kind: "Fábrica", specialty: "Servoarticulaciones y reductoras armónicas", reliability: 97.2, transit: 50, vehicle: "Camión", certified: ["ISO 9001", "ISO 10218"] },
  { id: "nvidion", name: "Nvidion Neural Chips", city: "Santa Clara", country: "EE. UU.", kind: "Fábrica", specialty: "Microprocesadores neuronales NX-Core", reliability: 95.5, transit: 95, vehicle: "Dron de carga", certified: ["ISO 9001", "JEDEC"] },
  { id: "toray", name: "Toray Fiber Dynamics", city: "Osaka", country: "Japón", kind: "Fábrica", specialty: "Fibra de carbono para exoesqueleto", reliability: 98.8, transit: 90, vehicle: "Dron de carga", certified: ["ISO 9001", "AS9100"] },
  { id: "panasonyx", name: "Panasonyx Cell Energy", city: "Nevada", country: "EE. UU.", kind: "Fábrica", specialty: "Baterías de estado sólido 4,8 kWh", reliability: 93.8, transit: 80, vehicle: "Camión", certified: ["ISO 9001", "UN 38.3"] },
  { id: "fraunova", name: "Fraunhofer-Nova Quantum Lab", city: "Dresde", country: "Alemania", kind: "Laboratorio", specialty: "Módulos de cifrado cuántico de firmware", reliability: 99.1, transit: 45, vehicle: "Hyperloop", certified: ["ISO 27001", "Common Criteria EAL6"] },
  { id: "basfhelix", name: "BASF-Helix Polymers", city: "Ludwigshafen", country: "Alemania", kind: "Laboratorio", specialty: "Polímeros bio-sintéticos autorreparables", reliability: 96.9, transit: 40, vehicle: "Camión", certified: ["ISO 14001", "REACH"] },
];

export type Material = {
  id: string;
  name: string;
  supplierId: string;
  perRobot: number;
  unit: string;
  assemblyMin: number; // tiempo de elaboración/montaje por robot
  phase: Phase;
  batch: number; // unidades por envío
};

export type Phase = "Síntesis" | "Autoensamblaje" | "Integración" | "Control de calidad";
export const PHASES: { name: Phase; minutes: number; desc: string }[] = [
  { name: "Síntesis", minutes: 12, desc: "Purificación de carbono y polímeros bio-sintéticos en reactores CVD" },
  { name: "Autoensamblaje", minutes: 18, desc: "Estructuración del chasis guiada por campos magnéticos (impresión 4D)" },
  { name: "Integración", minutes: 14, desc: "Inyección del sistema nervioso digital: sensores, chips y actuadores" },
  { name: "Control de calidad", minutes: 6, desc: "Inspección atómica por rayos X y cifrado cuántico de firmware" },
];

export const MATERIALS: Material[] = [
  { id: "m-ncs", name: "Nanocélulas de carbono (kg)", supplierId: "carbonix", perRobot: 3.2, unit: "kg", assemblyMin: 9.5, phase: "Síntesis", batch: 420 },
  { id: "m-poly", name: "Polímero bio-sintético", supplierId: "basfhelix", perRobot: 1.4, unit: "L", assemblyMin: 4.0, phase: "Síntesis", batch: 220 },
  { id: "m-graf", name: "Láminas de grafeno", supplierId: "hexagraph", perRobot: 6, unit: "ud", assemblyMin: 7.5, phase: "Autoensamblaje", batch: 900 },
  { id: "m-fib", name: "Fibra de carbono exoesqueleto", supplierId: "toray", perRobot: 2.1, unit: "m²", assemblyMin: 8.0, phase: "Autoensamblaje", batch: 300 },
  { id: "m-act", name: "Nano-actuadores musculares", supplierId: "bostonnano", perRobot: 24, unit: "ud", assemblyMin: 11.0, phase: "Integración", batch: 3600 },
  { id: "m-serv", name: "Servoarticulaciones", supplierId: "kukavance", perRobot: 14, unit: "ud", assemblyMin: 6.5, phase: "Integración", batch: 2000 },
  { id: "m-sens", name: "Matriz de sensores", supplierId: "siemtrix", perRobot: 8, unit: "ud", assemblyMin: 5.0, phase: "Integración", batch: 1200 },
  { id: "m-chip", name: "Chip neuronal NX-Core", supplierId: "nvidion", perRobot: 2, unit: "ud", assemblyMin: 3.5, phase: "Integración", batch: 300 },
  { id: "m-bat", name: "Batería estado sólido", supplierId: "panasonyx", perRobot: 1, unit: "ud", assemblyMin: 2.5, phase: "Integración", batch: 150 },
  { id: "m-qmod", name: "Módulo cifrado cuántico", supplierId: "fraunova", perRobot: 1, unit: "ud", assemblyMin: 1.5, phase: "Control de calidad", batch: 160 },
];

export type RobotModel = { id: string; name: string; desc: string; share: number };
// Solo se fabrican los 3 últimos modelos; VEX-7 recibe el 75% del límite diario.
export const MODELS: RobotModel[] = [
  { id: "v5", name: "VEX-5", desc: "Humanoide industrial de carga", share: 0.1 },
  { id: "v6", name: "VEX-6", desc: "Humanoide ágil con manos diestras", share: 0.15 },
  { id: "v7", name: "VEX-7", desc: "Humanoide de nanocélulas de carbono", share: 0.75 },
];

export type VexGen = {
  id: string; name: string; year: number; type: string; inspired: string; desc: string;
  built: number; status: "En producción" | "Desmontaje y reciclaje"; share: number; reuse: number; specs: string[];
};
export const VEX_GENERATIONS: VexGen[] = [
  { id: "vex-1", name: "VEX-1", year: 2015, type: "Brazo industrial fijo", inspired: "Brazos de soldadura de las primeras líneas chinas (Siasun, Estun)", desc: "6 ejes, carcasa de acero, sin visión.", built: 48200, status: "Desmontaje y reciclaje", share: 0, reuse: 62, specs: ["6 grados de libertad", "Carga 20 kg", "Control por PLC"] },
  { id: "vex-2", name: "VEX-2", year: 2018, type: "Robot de servicio con ruedas", inspired: "Robots de recepción y reparto (UBTech Cruzr, Pudu)", desc: "Pantalla facial, navegación por LiDAR en interiores.", built: 63500, status: "Desmontaje y reciclaje", share: 0, reuse: 71, specs: ["Base diferencial", "LiDAR 2D", "Autonomía 8 h"] },
  { id: "vex-3", name: "VEX-3", year: 2020, type: "Cuadrúpedo", inspired: "Perros robot (Unitree Go, DEEP Robotics)", desc: "4 patas con 12 motores, terreno irregular.", built: 91000, status: "Desmontaje y reciclaje", share: 0, reuse: 78, specs: ["12 servoarticulaciones", "3,5 m/s", "Cámaras de profundidad"] },
  { id: "vex-4", name: "VEX-4", year: 2022, type: "Humanoide bípedo de 1.ª gen.", inspired: "Primeros humanoides (UBTech Walker)", desc: "Articulaciones expuestas, marcha lenta.", built: 120400, status: "Desmontaje y reciclaje", share: 0, reuse: 83, specs: ["36 articulaciones", "Marcha 1,2 m/s", "Chip NX-Core v1"] },
  { id: "vex-5", name: "VEX-5", year: 2024, type: "Humanoide industrial", inspired: "Unitree H1, Fourier GR-1", desc: "Torso compacto, carga pesada en almacén.", built: 182000, status: "En producción", share: 0.1, reuse: 88, specs: ["Carga 30 kg", "Batería 2,4 kWh", "Visión 360°"] },
  { id: "vex-6", name: "VEX-6", year: 2025, type: "Humanoide ágil", inspired: "Unitree G1, AgiBot", desc: "Manos diestras de 22 grados y fibra de carbono.", built: 214000, status: "En producción", share: 0.15, reuse: 92, specs: ["Manos 22 GDL", "Fibra de carbono", "Batería 3,6 kWh"] },
  { id: "vex-7", name: "VEX-7", year: 2026, type: "Humanoide de nanocélulas", inspired: "Evolución de los humanoides chinos actuales (Unitree, UBTech, Xpeng Iron)", desc: "Chasis de nanocélulas de carbono sintético autorreparable y firmware cuántico.", built: 365000, status: "En producción", share: 0.75, reuse: 97, specs: ["Nanocélulas CVD-9N", "Batería 4,8 kWh estado sólido", "24 nano-actuadores", "Cifrado cuántico"] },
];

export const SHIFTS = [
  { id: 1, name: "Turno 1 · Madrugada", from: 0, to: 480 },
  { id: 2, name: "Turno 2 · Día", from: 480, to: 960 },
  { id: 3, name: "Turno 3 · Tarde/Noche", from: 960, to: 1440 },
];

export const DAILY_TARGET = 1000;

export type MachineSpec = { id: string; name: string; phase: Phase; zone: string; tempNominal: number; pressureNominal: number };
export const MACHINE_SPECS: MachineSpec[] = [
  { id: "CVD-01", name: "Reactor CVD α", phase: "Síntesis", zone: "Sala Limpia A", tempNominal: 950, pressureNominal: 0.8 },
  { id: "CVD-02", name: "Reactor CVD β", phase: "Síntesis", zone: "Sala Limpia A", tempNominal: 950, pressureNominal: 0.8 },
  { id: "CVD-03", name: "Reactor CVD γ", phase: "Síntesis", zone: "Sala Limpia A", tempNominal: 955, pressureNominal: 0.8 },
  { id: "PUR-01", name: "Purificador de carbono", phase: "Síntesis", zone: "Sala Limpia A", tempNominal: 420, pressureNominal: 1.2 },
  { id: "INJ-01", name: "Nano-inyector 1", phase: "Autoensamblaje", zone: "Sala Limpia B", tempNominal: 45, pressureNominal: 3.5 },
  { id: "INJ-02", name: "Nano-inyector 2", phase: "Autoensamblaje", zone: "Sala Limpia B", tempNominal: 45, pressureNominal: 3.5 },
  { id: "INJ-03", name: "Nano-inyector 3", phase: "Autoensamblaje", zone: "Sala Limpia B", tempNominal: 46, pressureNominal: 3.5 },
  { id: "MAG-01", name: "Cámara magnética 4D", phase: "Autoensamblaje", zone: "Sala Limpia B", tempNominal: -40, pressureNominal: 0.2 },
  { id: "MAG-02", name: "Cámara magnética 4D", phase: "Autoensamblaje", zone: "Sala Limpia B", tempNominal: -40, pressureNominal: 0.2 },
  { id: "ARM-01", name: "Brazo micromanipulador", phase: "Integración", zone: "Nave de Integración", tempNominal: 28, pressureNominal: 1.0 },
  { id: "ARM-02", name: "Brazo micromanipulador", phase: "Integración", zone: "Nave de Integración", tempNominal: 28, pressureNominal: 1.0 },
  { id: "ARM-03", name: "Brazo micromanipulador", phase: "Integración", zone: "Nave de Integración", tempNominal: 29, pressureNominal: 1.0 },
  { id: "LAS-01", name: "Emisor láser de calibración", phase: "Integración", zone: "Nave de Integración", tempNominal: 22, pressureNominal: 1.0 },
  { id: "XRS-01", name: "Escáner rayos X atómico", phase: "Control de calidad", zone: "Laboratorio QA", tempNominal: 24, pressureNominal: 1.0 },
  { id: "XRS-02", name: "Escáner rayos X atómico", phase: "Control de calidad", zone: "Laboratorio QA", tempNominal: 24, pressureNominal: 1.0 },
  { id: "QFW-01", name: "Estación cifrado cuántico", phase: "Control de calidad", zone: "Laboratorio QA", tempNominal: 18, pressureNominal: 1.0 },
];

export type FleetType = "Mantenimiento" | "Logística" | "Limpieza" | "Distribución";
export const FLEET_TYPES: FleetType[] = ["Mantenimiento", "Logística", "Limpieza", "Distribución"];
export const FLEET_PREFIX: Record<FleetType, string> = { Mantenimiento: "MNT", Logística: "LOG", Limpieza: "CLN", Distribución: "DST" };
export const FLEET_COUNT: Record<FleetType, number> = { Mantenimiento: 5, Logística: 5, Limpieza: 4, Distribución: 6 };
export const ZONES = ["Muelles de carga", "Almacén inerte", "Sala Limpia A", "Sala Limpia B", "Nave de Integración", "Laboratorio QA", "Estación de carga"];
