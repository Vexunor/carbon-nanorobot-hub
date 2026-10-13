# NanoForge Control — Gestión de Fábrica de Robots con Nanocélulas de Carbono Sintético

Aplicación web en español, estilo "centro de control industrial" (oscuro, acentos cian/ámbar, tipografía técnica), con menú lateral para cambiar de pantalla, desplegables y simulación en tiempo real de una planta que fabrica 1000 robots/día.

## Pantallas

1. **Panel General (inicio)** — KPIs en vivo: robots fabricados hoy / 1000, ritmo por hora, eficiencia (OEE), temperatura media, alertas abiertas, robots de servicio activos. Gráfico de producción por hora y resumen del flujo: Síntesis → Autoensamblaje → Integración → Control de Calidad.

2. **Planificación de Producción** — Plan de 1000 robots/día en 3 turnos (24 h), desglosado por modelo de robot (ej. NX-Atlas industrial, NX-Medic, NX-Scout). Tabla de órdenes con columna de **avance porcentual** (barra de progreso) y tiempos de elaboración/montaje por pieza. Desplegable para filtrar por turno, modelo o fase.

3. **Almacén Logístico (diagrama móvil)** — Mapa animado del almacén: camiones/drones de proveedores llegando a muelles, materiales moviéndose a zonas de stock y a líneas de montaje. Tabla de recepciones previstas: material, proveedor, cantidad necesaria para 1000 robots, cantidad recibida, ETA y estado.

4. **Proveedores y Laboratorios** — Fichas de proveedores inventados inspirados en reales (ej. "Carbonix Labs Zürich", "Hexa-Graphene Tokyo", "Boston Nanoactuators", "Siemtrix Sensors", "Kuka-Vance Motion", "Nvidion Neural Chips", "Toray Fiber Dynamics"). Cada uno con piezas que entrega, fiabilidad, entregas del día y desplegable de detalle.

5. **Monitor de Planta** — Parámetros por máquina (reactores CVD, inyectores de nanocélulas, cámaras de autoensamblaje magnético, escáneres de rayos X): temperatura, presión, vibración, estado y salud (%). Indicadores verde/ámbar/rojo y detección automática de fallos en la cadena.

6. **Mantenimiento y Alertas** — Lista de máquinas que requieren mantenimiento (predictivo, gemelo digital), y cola de avisos asignados **automáticamente** a robots de servicio: mantenimiento, logística, limpieza (contención de nanopartículas) y distribución interna. Cada aviso muestra prioridad, robot asignado, tiempo estimado y estado (pendiente → en curso → resuelto). Botón para resolver manualmente o forzar asignación.

7. **Flota de Robots de Servicio** — Estado de cada robot de servicio (batería, tarea actual, ubicación), filtrable por tipo.

8. **Calidad y Sostenibilidad** — Tasa de defectos, inspección atómica, CO₂ capturado vs emitido, nanocélulas recicladas.

## Funcionamiento

- Un motor de simulación avanza el estado cada pocos segundos (producción, llegadas de material, temperaturas, fallos aleatorios, auto-asignación de avisos). Control de velocidad de simulación (x1, x10, x60) y pausa.
- Datos guardados en el navegador para mantener el estado entre recargas; botón "Reiniciar día".
- Cumple los requisitos del concurso: más de 3 funcionalidades principales, manejo de datos e interfaz utilizable.

## Entregables del hackatón (además de la app)

Se generarán en Archivos para que los subas a tu carpeta de Google Drive:
- **Documentación Técnica** (Word, importable a Google Docs): descripción, problema, funcionalidades, arquitectura, tecnologías, retos y soluciones, espacio para capturas.
- **Historial de Prompts** (Word aparte), indicando que se usó Lovable.
- **Guion del vídeo demo** (≤5 min) para grabarlo tú.
- Capturas de pantalla de la app.
- La **app desplegada** se obtiene al pulsar Publicar; el **repositorio GitHub** se conecta desde el menú de Lovable (te indicaré cómo). El vídeo debes grabarlo tú.

## Detalles técnicos

- Rutas separadas por pantalla (`/`, `/planificacion`, `/almacen`, `/proveedores`, `/planta`, `/mantenimiento`, `/flota`, `/calidad`) con layout común y sidebar shadcn.
- Estado de simulación en un store (zustand) con persistencia en localStorage; recharts para gráficos; SVG + framer-motion para el diagrama del almacén.
- Tokens de diseño en `src/styles.css`; head() propio por ruta.
