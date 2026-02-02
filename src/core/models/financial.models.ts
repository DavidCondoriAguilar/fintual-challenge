/**
 * Modelos y interfaces para datos financieros
 * Centraliza todas las estructuras de datos del dominio financiero
 */

/**
 * Datos diarios de un fondo de inversión - Estructura API Fintual
 */
export interface DayData {
  id?: string;
  type?: string;
  attributes?: {
    date: string;
    price: number;
    net_asset_value?: number;
    net_asset_value_type?: string;
    fixed_management_fee?: any;
    fixed_management_fee_type?: any;
    iva_exclusive_expenses?: any;
    iva_exclusive_expenses_type?: any;
    iva_inclusive_expenses?: any;
    iva_inclusive_expenses_type?: any;
    purchase_fee?: any;
    purchase_fee_type?: any;
    redemption_fee?: any;
    redemption_fee_type?: any;
    total_assets?: any;
    total_assets_type?: any;
    total_net_assets?: any;
    total_net_assets_type?: any;
    variable_management_fee?: any;
    variable_management_fee_type?: any;
    fixed_fee?: any;
    fixed_fee_type?: any;
    new_shares?: any;
    new_shares_type?: any;
    outstanding_shares?: any;
    outstanding_shares_type?: any;
    redeemed_shares?: any;
    redeemed_shares_type?: any;
    institutional_investors?: any;
    institutional_investors_type?: any;
    shareholders?: any;
    shareholders_type?: any;
  };
  // Simplified fields used in processing
  date?: string;
  price?: number;
}

/**
 * Variación mensual calculada de un fondo
 */
export interface MonthlyVariation {
  month: string;           // Nombre del mes (Ej: "Ene", "Feb")
  year: number;            // Año (Ej: 2024)
  variation: number;       // Variación porcentual mensual
  firstDayPrice: number;   // Precio del primer día del mes
  lastDayPrice: number;    // Precio del último día del mes
}

/**
 * Datos completos de un fondo con su información histórica
 */
export interface AssetData {
  id: number;           // ID del fondo
  name: string;         // Nombre descriptivo del fondo
  days: DayData[];      // Datos históricos diarios
}

/**
 * Configuración de datos para gráfico Chart.js
 */
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
  }[];
}

/**
 * Estados posibles de la aplicación
 */
export type AppState = 'loading' | 'loaded' | 'error' | 'empty';

/**
 * Filtros disponibles para los datos
 */
export interface DataFilters {
  assetId: number;    // ID del fondo seleccionado
  startDate: string;  // Fecha de inicio (YYYY-MM-DD)
  endDate: string;    // Fecha de fin (YYYY-MM-DD)
}

/**
 * Tipos de movimiento para SQL
 */
export type MovementType = 'subscription' | 'withdrawal';

/**
 * Estructura de movimiento de usuario (SQL)
 */
export interface UserMovement {
  user_id: number;
  movement_type: MovementType;
  amount: number;
  date: string;
}

/**
 * Datos de usuario (SQL)
 */
export interface UserData {
  user_id: number;
  name: string;
  last_name: string;
}

/**
 * Resultados de análisis SQL
 */
export interface SQLAnalysisResult {
  totalMovements: {
    movement_type: MovementType;
    total_amount: number;
    transaction_count: number;
    average_amount: number;
  }[];
  dailyAnalysis: {
    date: string;
    movement_type: MovementType;
    transaction_count: number;
    average_amount: number;
  }[];
  topSubscriber: {
    name: string;
    last_name: string;
    total_subscribed: number;
    subscription_count: number;
  };
}
