import { Injectable } from '@angular/core';

import { DayData, MonthlyVariation, ChartData } from '../models/financial.models';
import {
  formatVariation,
  isDateInRange,
  getMonthName,
  getChartColors,
  groupDataByMonth,
  sortMonthDataChronologically,
  calculateVariationStats
} from '../utils/financial.utils';

@Injectable({
  providedIn: 'root'
})
export class FinancialService {

  /**
   * Calcula la variación mensual de los precios de un fondo
   * Fórmula: ((precio_fin_mes - precio_inicio_mes) / precio_inicio_mes) * 100
   */
  calculateMonthlyVariation(data: DayData[]): MonthlyVariation[] {
    if (!data || data.length === 0) {
      return [];
    }

    const monthlyData = groupDataByMonth(data);
    const variations: MonthlyVariation[] = [];

    Array.from(monthlyData.keys())
      .sort()
      .forEach((monthKey: string) => {
        const monthData = monthlyData.get(monthKey);
        if (!monthData || monthData.length === 0) return;

        const sortedMonthData = sortMonthDataChronologically(monthData);
        const firstDay = sortedMonthData[0];
        const lastDay = sortedMonthData[sortedMonthData.length - 1];

        // Validar precios
        const firstPrice = firstDay.price ?? firstDay.attributes?.price;
        const lastPrice = lastDay.price ?? lastDay.attributes?.price;

        if (!firstPrice || !lastPrice || firstPrice === 0) {
          return;
        }

        // Aplicar fórmula de variación mensual
        const calculatedVariation = ((lastPrice - firstPrice) / firstPrice) * 100;

        // Extraer año y mes
        const [year, month] = monthKey.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        // Validar rangos
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return;
        }

        variations.push({
          month: getMonthName(monthNum),
          year: yearNum,
          variation: parseFloat(calculatedVariation.toFixed(2)),
          firstDayPrice: firstPrice,
          lastDayPrice: lastPrice
        });
      });

    return variations;
  }

  /**
   * Filtra datos de variación por rango de fechas
   */
  filterDataByDateRange(
    data: MonthlyVariation[],
    startDate: string,
    endDate: string
  ): MonthlyVariation[] {
    if (!startDate || !endDate || startDate === 'undefined' || endDate === '') {
      return data;
    }

    const filtered = data.filter(variation => {
      const itemDate = `${variation.year}-${String(this.getMonthNumber(variation.month)).padStart(2, '0')}-01`;
      return isDateInRange(itemDate, startDate, endDate);
    });

    // Si el filtro elimina todo, retornar todos los datos
    if (filtered.length === 0 && data.length > 0) {
      return data;
    }

    return filtered;
  }

  /**
   * Prepara datos para gráfico Chart.js
   */
  createChartData(variations: MonthlyVariation[], assetName: string): ChartData {
    const labels = variations.map(v => `${v.month} ${v.year}`);
    const data = variations.map(v => v.variation);
    const colors = getChartColors(variations.length);

    return {
      labels,
      datasets: [{
        label: assetName,
        data,
        borderColor: colors.border,
        backgroundColor: colors.background,
        fill: true
      }]
    };
  }

  /**
   * Formatea variación para visualización
   */
  formatVariation(variation: number): string {
    return formatVariation(variation);
  }

  /**
   * Obtiene número de mes a partir de nombre abreviado
   */
  private getMonthNumber(monthName: string): number {
    const monthMap: { [key: string]: number } = {
      'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12
    };
    return monthMap[monthName] || 1;
  }

  /**
   * Calcula estadísticas de las variaciones
   */
  calculateStatistics(variations: MonthlyVariation[]): {
    average: number;
    max: number;
    min: number;
    positiveCount: number;
    negativeCount: number;
    totalMonths: number;
  } {
    const stats = calculateVariationStats(variations);
    return {
      ...stats,
      totalMonths: variations.length
    };
  }

  /**
   * Valida si los datos son suficientes para análisis
   */
  hasEnoughData(data: DayData[]): boolean {
    return !!(data && data.length >= 2);
  }

  /**
   * Obtiene resumen de datos procesados
   */
  getDataSummary(data: DayData[]): {
    totalRecords: number;
    dateRange: { start: string; end: string };
    priceRange: { min: number; max: number };
    monthsCovered: number;
  } {
    if (!data || data.length === 0) {
      return { totalRecords: 0, dateRange: { start: '', end: '' }, priceRange: { min: 0, max: 0 }, monthsCovered: 0 };
    }

    const dates = data.map(d => d.date || d.attributes?.date || '').filter(Boolean).sort();
    const prices = data.map(d => d.price ?? d.attributes?.price ?? 0);

    return {
      totalRecords: data.length,
      dateRange: {
        start: dates.length > 0 ? dates[0] : '',
        end: dates.length > 0 ? dates[dates.length - 1] : ''
      },
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      monthsCovered: new Set(data.map(d => (d.date || d.attributes?.date || '').substring(0, 7)).filter(Boolean)).size
    };
  }
}
