# Fintual Challenge - Análisis de Fondos

Aplicación Angular para calcular y visualizar la variación mensual de fondos de inversión usando la API oficial de Fintual.

## 📁 Estructura del Proyecto

- `src/core/`: **Lógica de Negocio**. Incluye modelos (`models`), gestión de API (`fintual.service`) y cálculos de variación (`financial.service`).
- `src/features/`: **Vistas**. El `dashboard` es el componente principal que orquesta la UI.
- `src/core/utils/`: **Funciones puras**. Transformación de fechas y agrupación de datos.

## ⚙️ Flujo de Datos
1. **Fetch**: Se obtienen precios diarios de la API (IDs: 186, 187, 188, 15077).
2. **Proceso**: Se agrupan por mes y se calcula la variación: `((Precio Final - Precio Inicial) / Precio Inicial) * 100`.
3. **Estado**: Se usa **Angular Signals** para manejar el estado (loading, data, error) de forma reactiva y eficiente.
4. **UI**: Visualización dinámica con Chart.js y filtros en tiempo real por fondo y fecha.

## 🧪 Estrategia de Testing y Validación
- **Manejo de Errores**: Sistema robusto para capturar fallos de API (404, 500) y mostrar alertas al usuario.
- **Validación de Datos**: Filtros automáticos que eliminan registros incompletos para asegurar cálculos precisos.
- **Logs de Consola**: Implementación de trazas detalladas para debuggear el flujo de datos desde la respuesta JSON hasta el renderizado del gráfico.

## 📊 SQL Query (Resumen)
*Las consultas completas están en `queries.sql`.*
- **Top Inversor**: `JOIN` entre `user_data` y `user_movements` filtrado por `subscription`, agrupado y ordenado por conteo.
- **Totales**: Uso de `SUM()` y `GROUP BY` sobre el tipo de movimiento.

## 🚀 Ejecución
1. `npm install`
2. `ng serve`
3. Abrir `http://localhost:4200`
