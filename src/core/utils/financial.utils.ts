import { DayData } from '../models/financial.models';

/**
 * Formatea un valor de variación porcentual para visualización
 */
export function formatVariation(variation: number): string {
  const sign = variation >= 0 ? '+' : '';
  return `${sign}${variation.toFixed(2)}%`;
}

/**
 * Valida si una fecha está dentro de un rango
 */
export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return true;

  const targetDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return targetDate >= start && targetDate <= end;
}

/**
 * Obtiene el nombre del mes a partir de su número
 */
export function getMonthName(monthNumber: number): string {
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return monthNames[monthNumber - 1] || 'Desconocido';
}

/**
 * Genera colores para gráficos
 */
export function getChartColors(index: number): { border: string; background: string } {
  const colors = [
    { border: 'rgb(59, 130, 246)', background: 'rgba(59, 130, 246, 0.2)' },
    { border: 'rgb(34, 197, 94)', background: 'rgba(34, 197, 94, 0.2)' },
    { border: 'rgb(249, 115, 22)', background: 'rgba(249, 115, 22, 0.2)' },
    { border: 'rgb(168, 85, 247)', background: 'rgba(168, 85, 247, 0.2)' },
    { border: 'rgb(239, 68, 68)', background: 'rgba(239, 68, 68, 0.2)' },
    { border: 'rgb(245, 158, 11)', background: 'rgba(245, 158, 11, 0.2)' },
  ];

  return colors[index % colors.length];
}

/**
 * Calcula el rango de fechas por defecto (últimos 5 años)
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);

  return {
    startDate: fiveYearsAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0]
  };
}

/**
 * Obtiene rangos de fechas predefinidos
 */
export function getPresetDateRanges(): Array<{ label: string; startDate: string; endDate: string }> {
  const now = new Date();

  return [
    {
      label: 'Último año',
      startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    },
    {
      label: 'Últimos 2 años',
      startDate: new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    },
    {
      label: 'Últimos 5 años',
      startDate: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    },
    {
      label: 'Todo el historial',
      startDate: '2020-01-01',
      endDate: now.toISOString().split('T')[0]
    },
    {
      label: '2023',
      startDate: '2023-01-01',
      endDate: '2023-12-31'
    },
    {
      label: '2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }
  ];
}

/**
 * Agrupa datos diarios por mes - Versión corregida para API de Fintual
 */
export function groupDataByMonth(data: DayData[]): Map<string, DayData[]> {
  const monthlyData = new Map<string, DayData[]>();

  console.log('📊 groupDataByMonth llamado con', data.length, 'registros');

  data.forEach((day, index) => {
    if (index < 3) {
      console.log(`📅 Registro ${index}:`, day);
    }

    // Los datos de Fintual están anidados en attributes o ya aplanados
    const date = day.date || day.attributes?.date;
    const price = day.price ?? day.attributes?.price;

    if (!date || typeof date !== 'string') {
      if (index < 3) console.log('❌ Saltando registro sin fecha válida:', day.attributes);
      return;
    }

    // Extraer año y mes directamente del string de fecha
    // Formato esperado: YYYY-MM-DD
    const dateParts = date.split('-');
    if (dateParts.length >= 2) {
      const year = dateParts[0];
      const month = dateParts[1];
      const monthKey = `${year}-${month}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }

      // Crear objeto DayData con la estructura correcta
      const dayData: DayData = {
        date: date,
        price: price || 0
      };

      monthlyData.get(monthKey)!.push(dayData);

      if (index < 3) {
        console.log(`✅ Agregado a mes ${monthKey}:`, { date, price });
      }
    } else {
      if (index < 3) {
        console.log('❌ Formato de fecha inválido:', date);
      }
    }
  });

  console.log('📊 Meses encontrados:', Array.from(monthlyData.keys()));
  console.log('📊 Total meses procesados:', monthlyData.size);

  return monthlyData;
}

/**
 * Ordena datos de un mes cronológicamente
 */
export function sortMonthDataChronologically(monthData: DayData[]): DayData[] {
  return monthData.sort((a, b) => {
    const dateA = a.date || a.attributes?.date || '';
    const dateB = b.date || b.attributes?.date || '';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
}

/**
 * Calcula estadísticas básicas
 */
export function calculateVariationStats(variations: any[]): {
  average: number;
  max: number;
  min: number;
  positiveCount: number;
  negativeCount: number;
} {
  if (variations.length === 0) {
    return { average: 0, max: 0, min: 0, positiveCount: 0, negativeCount: 0 };
  }

  const values = variations.map(v => v.variation || 0);
  const positiveCount = values.filter(v => v > 0).length;
  const negativeCount = values.filter(v => v < 0).length;

  return {
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
    positiveCount,
    negativeCount
  };
}

/**
 * Formatea número a moneda chilena
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount);
}

/**
 * Valida si un ID de fondo es válido
 */
export function isValidAssetId(assetId: number): boolean {
  const validIds = [186, 187, 188, 189];
  return validIds.includes(assetId);
}
