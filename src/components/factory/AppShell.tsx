import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarClock, Warehouse, FlaskConical, Gauge, Wrench, Bot, Leaf, Pause, Play, RotateCcw, Atom, BellRing, Cpu, Search, Shield,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFactory, fmtTime, currentShift } from "@/lib/factory-store";
import { DAILY_TARGET } from "@/lib/factory-data";

const NAV = [
  { title: "Panel general", url: "/", icon: LayoutDashboard },
  { title: "Planificación", url: "/planificacion", icon: CalendarClock },
  { title: "Almacén logístico", url: "/almacen", icon: Warehouse },
  { title: "Proveedores y labs", url: "/proveedores", icon: FlaskConical },
  { title: "Monitor de planta", url: "/planta", icon: Gauge },
  { title: "Mantenimiento y avisos", url: "/mantenimiento", icon: Wrench },
  { title: "Flota de servicio", url: "/flota", icon: Bot },
  { title: "Calidad y sostenibilidad", url: "/calidad", icon: Leaf },
  { title: "Modelos VEX", url: "/modelos", icon: Cpu },
  { title: "Buscador de sucesos", url: "/buscador", icon: Search },
  { title: "Defensa (restringido)", url: "/defensa", icon: Shield },
] as const;

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const openAlerts = useFactory((s) => s.alerts.filter((a) => a.status !== "resuelta").length);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="glow flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
            <Atom className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-wider">NANOFORGE</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Control de planta</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pantallas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.url === "/mantenimiento" && openAlerts > 0 && !collapsed && (
                        <span className="tabular ml-auto rounded bg-destructive px-1.5 text-[10px] text-destructive-foreground">{openAlerts}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {!collapsed && (
        <SidebarFooter className="border-t border-sidebar-border text-[10px] text-muted-foreground">
          Planta Valencia-01 · Manufactura molecular
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function TopBar() {
  const { minute, day, speed, paused, produced, setSpeed, togglePause, reset } = useFactory();
  const critical = useFactory((s) => s.alerts.filter((a) => a.status !== "resuelta" && a.priority === "crítica").length);
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-3 backdrop-blur">
      <SidebarTrigger />
      <div className="hidden items-center gap-2 sm:flex">
        <span className={`h-2 w-2 rounded-full ${paused ? "bg-warning" : "bg-success pulse-dot"}`} />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{paused ? "Simulación en pausa" : "En vivo"}</span>
      </div>
      <div className="tabular rounded border bg-card px-2 py-1 text-sm">
        Día {day} · <span className="text-primary">{fmtTime(minute)}</span>
      </div>
      <div className="hidden text-xs text-muted-foreground lg:block">{currentShift(minute).name}</div>
      <div className="tabular hidden text-sm md:block">
        <span className="text-primary">{Math.floor(produced)}</span>
        <span className="text-muted-foreground"> / {DAILY_TARGET} robots</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {critical > 0 && (
          <Link to="/mantenimiento" className="flex items-center gap-1 rounded border border-destructive/40 bg-destructive/15 px-2 py-1 text-xs text-destructive">
            <BellRing className="pulse-dot h-3.5 w-3.5" /> {critical} crítica{critical > 1 ? "s" : ""}
          </Link>
        )}
        <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
          <SelectTrigger className="h-8 w-[118px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Velocidad x1</SelectItem>
            <SelectItem value="10">Velocidad x10</SelectItem>
            <SelectItem value="30">Velocidad x30</SelectItem>
            <SelectItem value="60">Velocidad x60</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={togglePause} aria-label={paused ? "Reanudar" : "Pausar"}>
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { if (confirm("¿Reiniciar el día de producción?")) reset(); }} aria-label="Reiniciar día">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function SimRunner() {
  const tick = useFactory((s) => s.tick);
  useEffect(() => {
    useFactory.persist.rehydrate();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <SidebarProvider>
      {ready && <SimRunner />}
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
