import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Importar modelos centralizados
import { DayData, AssetData } from '../models/financial.models';

/**
 * Servicio para consumir la API de Fintual y gestionar datos de fondos
 * 
 * API Endpoint: https://fintual.cl/api/real_assets/{id}/days
 * IDs disponibles: 186, 187, 188, 189
 * 
 * @author Fintual Challenge Team
 * @version 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class FintualService {
  // URL base de la API de Fintual
  private readonly baseUrl = 'https://fintual.cl/api/real_assets';

  // IDs de fondos disponibles corregidos
  private readonly assetIds = [186, 187, 188, 15077];

  // Nombres descriptivos oficiales para cada fondo (Series A)
  private readonly assetNames: { [key: number]: string } = {
    186: 'Fondo Agresivo (Norris)',
    187: 'Fondo Moderado (Pit)',
    188: 'Fondo Conservador (Clooney)',
    15077: 'Fondo Muy Conservador (Streep)'
  };

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los datos históricos de un fondo específico
   * 
   * @param assetId ID del fondo (186, 187, 188, 189)
   * @returns Observable con los datos diarios del fondo
   */
  getAssetData(assetId: number): Observable<{ data: DayData[] }> {
    const url = `${this.baseUrl}/${assetId}/days`;
    console.log(`🔄 Obteniendo datos del fondo ${assetId} desde: ${url}`);
    return this.http.get<{ data: DayData[] }>(url);
  }

  /**
   * Obtiene datos de todos los fondos disponibles
   * 
   * @returns Observable con array de datos de todos los fondos
   */
  getAllAssetsData(): Observable<{ data: DayData[] }[]> {
    const requests = this.assetIds.map(id => this.getAssetData(id));

    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise())).then(
        results => {
          console.log('✅ Datos de todos los fondos cargados exitosamente');
          observer.next(results as { data: DayData[] }[]);
          observer.complete();
        },
        error => {
          console.error('❌ Error al cargar datos de todos los fondos:', error);
          observer.error(error);
        }
      );
    });
  }

  /**
   * Obtiene datos completos de un fondo con su nombre
   * 
   * @param assetId ID del fondo
   * @returns Observable con datos completos del fondo
   */
  getAssetDataWithName(assetId: number): Observable<AssetData> {
    return new Observable(observer => {
      this.getAssetData(assetId).subscribe({
        next: (response) => {
          const assetData: AssetData = {
            id: assetId,
            name: this.getAssetName(assetId),
            days: response.data
          };
          observer.next(assetData);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Retorna la lista de IDs de fondos disponibles
   * 
   * @returns Array con los IDs [186, 187, 188, 189]
   */
  getAssetIds(): number[] {
    return [...this.assetIds]; // Retorna copia para evitar mutación
  }

  /**
   * Obtiene el nombre descriptivo de un fondo
   * 
   * @param assetId ID del fondo
   * @returns Nombre del fondo o nombre genérico si no existe
   */
  getAssetName(assetId: number): string {
    return this.assetNames[assetId] || `Fondo ${assetId}`;
  }

  /**
   * Retorna el mapa completo de nombres de fondos
   * 
   * @returns Objeto con ID como clave y nombre como valor
   */
  getAssetNames(): { [key: number]: string } {
    return { ...this.assetNames }; // Retorna copia para evitar mutación
  }

  /**
   * Verifica si un ID de fondo es válido
   * 
   * @param assetId ID a verificar
   * @returns true si el ID es válido
   */
  isValidAssetId(assetId: number): boolean {
    return this.assetIds.includes(assetId);
  }

  /**
   * Obtiene información básica de todos los fondos (sin datos históricos)
   * 
   * @returns Array con información básica de fondos
   */
  getAssetsInfo(): Array<{ id: number; name: string }> {
    return this.assetIds.map(id => ({
      id,
      name: this.getAssetName(id)
    }));
  }
}
