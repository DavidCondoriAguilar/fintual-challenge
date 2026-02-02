import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

// Importar servicios centralizados
import { FintualService } from '../../core/services/fintual.service';
import { FinancialService } from '../../core/services/financial.service';

// Importar modelos y utilidades
import { MonthlyVariation, ChartData, AppState } from '../../core/models/financial.models';
import { getDefaultDateRange, formatVariation, getPresetDateRanges } from '../../core/utils/financial.utils';

/**
 * Componente principal de la aplicación Fintual Challenge
 * 
 * Responsabilidades:
 * - Orquestar la aplicación y gestionar el estado global
 * - Consumir datos de la API de Fintual
 * - Presentar visualizaciones interactivas
 * - Manejar filtros y actualizaciones en tiempo real
 * - Gestionar estados de carga y error
 */
@Component({
  selector: 'app-root',
  imports: [
    CommonModule,      // Directivas básicas (*ngIf, *ngFor, etc.)
    FormsModule,       // NgModel para formularios
    BaseChartDirective // Directiva de Chart.js
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class App implements OnInit, OnDestroy {

  // ==================== ESTADOS DE LA APLICACIÓN ====================

  /** Título principal de la aplicación */
  protected readonly title = signal('Fintual Challenge - Análisis de Fondos');

  /** Estado de la aplicación tipado */
  appState = signal<AppState>('loading');

  /** Mensaje de error descriptivo */
  errorMessage = signal('');

  // ==================== DATOS Y FILTROS ====================

  /** ID del fondo seleccionado (default: 186 - Fondo Conservador) */
  selectedAssetId = signal<number>(186);

  /** Fecha de inicio del filtro */
  startDate = signal('');

  /** Fecha de fin del filtro */
  endDate = signal('');

  /** Variaciones mensuales calculadas (sin filtrar) */
  monthlyVariations = signal<MonthlyVariation[]>([]);

  /** Variaciones mensuales filtradas por fecha */
  filteredVariations = signal<MonthlyVariation[]>([]);

  /** Rangos de fechas predefinidos para filtros rápidos */
  presetDateRanges = signal(getPresetDateRanges());

  /** Estadísticas de las variaciones */
  statistics = signal<{
    average: number;
    max: number;
    min: number;
    positiveCount: number;
    negativeCount: number;
    totalMonths: number;
  }>({ average: 0, max: 0, min: 0, positiveCount: 0, negativeCount: 0, totalMonths: 0 });

  // ==================== GETTERS COMPUTADOS ====================

  /** Verifica si está cargando */
  get isLoading(): boolean {
    return this.appState() === 'loading';
  }

  /** Verifica si hay error */
  get hasError(): boolean {
    return this.appState() === 'error';
  }

  /** Verifica si está cargado */
  get isLoaded(): boolean {
    return this.appState() === 'loaded';
  }

  /** Verifica si está vacío */
  get isEmpty(): boolean {
    return this.appState() === 'empty';
  }

  // ==================== CONFIGURACIÓN DEL GRÁFICO ====================

  /** Datos del gráfico para Chart.js */
  chartData = signal<ChartConfiguration<'line'>['data']>({
    labels: [],
    datasets: []
  });

  /** Opciones de configuración del gráfico */
  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Variación Mensual de Fondos (%)'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y as number;
            return `${context.dataset.label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    }
  };

  // ==================== GESTIÓN DE SUSCRIPCIONES ====================

  /** Array para gestionar suscripciones y evitar memory leaks */
  private subscriptions: any[] = [];

  // ==================== CONSTRUCTOR Y CICLO DE VIDA ====================

  constructor(
    private fintualService: FintualService,    // Servicio para API de Fintual
    private financialService: FinancialService // Servicio para cálculos financieros
  ) { }

  /**
   * Inicialización del componente
   */
  ngOnInit() {
    console.log('🚀 Iniciando aplicación Fintual Challenge');
    this.setDefaultDateRange();
    this.loadAssetData();
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    console.log('🧹 Componente destruido, suscripciones limpiadas');
  }

  // ==================== GETTERS PARA ACCESO A DATOS ====================

  /** Retorna los IDs de fondos disponibles */
  get assetIds() {
    return this.fintualService.getAssetIds();
  }

  /** Retorna los nombres de fondos disponibles */
  get assetNames() {
    return this.fintualService.getAssetNames();
  }

  // ==================== MANEJADORES DE EVENTOS ====================

  /**
   * Maneja el cambio de fondo seleccionado
   */
  onAssetChange() {
    console.log(`📊 Cambiando al fondo ${this.selectedAssetId()}`);
    this.loadAssetData();
  }

  /**
   * Maneja el cambio en los filtros de fecha
   */
  onDateFilterChange() {
    console.log(`📅 Aplicando filtro: ${this.startDate()} a ${this.endDate()}`);
    this.applyDateFilter();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Establece el rango de fechas por defecto (últimos 6 meses)
   * Usa utilidad centralizada para consistencia
   */
  private setDefaultDateRange() {
    const dateRange = getDefaultDateRange();
    this.startDate.set(dateRange.startDate);
    this.endDate.set(dateRange.endDate);

    console.log(`📅 Rango de fechas por defecto: ${dateRange.startDate} a ${dateRange.endDate}`);
  }

  /**
   * Carga los datos del fondo seleccionado desde la API
   */
  private loadAssetData() {
    console.log('🔄 Iniciando carga de datos...');
    console.log(`📊 Estado actual: ${this.appState()}`);
    console.log(`🎯 Fondo seleccionado: ${this.selectedAssetId()}`);
    console.log(`📅 Fechas: ${this.startDate()} a ${this.endDate()}`);

    this.appState.set('loading');
    this.errorMessage.set('');

    const assetId = this.selectedAssetId();
    console.log(`🔄 Cargando datos del fondo ${assetId}...`);

    this.fintualService.getAssetData(assetId).subscribe({
      next: (response: { data: any[] }) => {
        console.log('✅ Respuesta recibida:', response);
        console.log(`📊 Datos recibidos: ${response.data?.length || 0} registros`);

        // Mostrar primeros 5 registros para debug
        if (response.data && response.data.length > 0) {
          console.log('📋 Primer registro completo:', JSON.stringify(response.data[0], null, 2));
          console.log('📋 Primeros 5 registros:', response.data.slice(0, 5));
          console.log('📋 Estructura de datos:', Object.keys(response.data[0]));
        }

        if (!response || !response.data) {
          console.error('❌ Respuesta inválida:', response);
          this.handleError('Respuesta inválida de la API');
          return;
        }

        // Validar datos suficientes
        if (!this.financialService.hasEnoughData(response.data)) {
          console.warn('⚠️ Datos insuficientes para análisis');
          this.handleError('Datos insuficientes para análisis');
          return;
        }

        try {
          const variations = this.financialService.calculateMonthlyVariation(response.data);
          console.log('📈 Variaciones calculadas:', variations);
          console.log(`📊 Total variaciones: ${variations.length}`);

          this.monthlyVariations.set(variations);
          this.applyDateFilter();
          this.appState.set(variations.length > 0 ? 'loaded' : 'empty');

          console.log(`✅ Estado final: ${this.appState()}`);
          console.log(`📊 Variaciones filtradas: ${this.filteredVariations().length}`);
        } catch (error) {
          console.error('❌ Error procesando datos:', error);
          this.handleError('Error al procesar los datos financieros');
        }
      },
      error: (error: any) => {
        console.error('❌ Error en API:', error);
        console.error('❌ Detalles del error:', error?.message || error);
        this.handleError('Error al cargar los datos desde la API');
      }
    });
  }

  /**
   * Aplica el filtro de fechas a las variaciones mensuales
   */
  private applyDateFilter() {
    const variations = this.monthlyVariations();
    const start = this.startDate();
    const end = this.endDate();

    console.log('🔍 Aplicando filtro de fechas...');
    console.log(`📊 Variaciones totales: ${variations.length}`);
    console.log(`📅 Rango: ${start} a ${end}`);

    const filtered = this.financialService.filterDataByDateRange(variations, start, end);
    this.filteredVariations.set(filtered);

    // Calcular estadísticas
    const stats = this.financialService.calculateStatistics(filtered);
    this.statistics.set(stats);

    this.updateChartData();

    console.log(`🔍 Datos filtrados: ${filtered.length} de ${variations.length} meses visibles`);
    console.log('📊 Estadísticas:', stats);
    console.log('📊 Variaciones filtradas:', filtered);
  }

  /**
   * Actualiza los datos del gráfico Chart.js
   */
  private updateChartData() {
    const variations = this.filteredVariations();
    const assetName = this.fintualService.getAssetName(this.selectedAssetId());
    const chartData = this.financialService.createChartData(variations, assetName);

    this.chartData.set({
      labels: chartData.labels,
      datasets: chartData.datasets.map((dataset: any) => ({
        ...dataset,
        tension: 0.4,      // Suavizar líneas
        pointRadius: 4,    // Tamaño de puntos
        pointHoverRadius: 6 // Tamaño al hover
      }))
    });

    console.log(`📊 Gráfico actualizado con ${variations.length} puntos de datos`);
  }

  /**
   * Maneja errores de la aplicación
   */
  private handleError(message: string) {
    this.errorMessage.set(message);
    this.appState.set('error');
    console.error(`❌ Error: ${message}`);
  }

  // ==================== MÉTODOS UTILITARIOS ====================

  /**
   * Formatea el valor de variación para visualización
   * Usa utilidad centralizada para consistencia
   */
  formatVariation(variation: number): string {
    return formatVariation(variation);
  }

  /**
   * Aplica un rango de fechas predefinido
   */
  applyPresetRange(presetIndex: number): void {
    const ranges = this.presetDateRanges();
    if (presetIndex >= 0 && presetIndex < ranges.length) {
      const range = ranges[presetIndex];
      this.startDate.set(range.startDate);
      this.endDate.set(range.endDate);
      this.applyDateFilter();
      console.log(`📅 Rango predefinido aplicado: ${range.label}`);
    }
  }

  /**
   * Reintenta cargar los datos
   */
  retryLoad() {
    console.log('🔄 Reintentando carga de datos...');
    this.loadAssetData();
  }

  /**
   * Obtiene resumen de datos para mostrar
   */
  getDataSummary(): {
    totalMonths: number;
    dateRange: { start: string; end: string };
    currentAsset: string;
    statistics: {
      average: number;
      max: number;
      min: number;
      positiveCount: number;
      negativeCount: number;
      totalMonths: number;
    };
  } {
    const variations = this.monthlyVariations();
    return {
      totalMonths: variations.length,
      dateRange: {
        start: this.startDate(),
        end: this.endDate()
      },
      currentAsset: this.fintualService.getAssetName(this.selectedAssetId()),
      statistics: this.statistics()
    };
  }
}
