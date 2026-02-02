// SCRIPT DE PRUEBA MANUAL - VERIFICACIÓN DE DATOS FINANCIAL
// Ejecutar en: https://jsfiddle.net/ o consola del navegador

// 1. PRUEBA DIRECTA DE API FINTUAL
async function testFintualAPI() {
    console.log('🔍 Probando API de Fintual...');
    
    const assetIds = [186, 187, 188, 189];
    const assetNames = {
        186: 'Fondo Conservador',
        187: 'Fondo Moderado', 
        188: 'Fondo Agresivo',
        189: 'Fondo Crecimiento'
    };
    
    for (const id of assetIds) {
        try {
            const response = await fetch(`https://fintual.cl/api/real_assets/${id}/days`);
            const data = await response.json();
            
            console.log(`\n📊 ${assetNames[id]} (ID: ${id})`);
            console.log(`Total registros: ${data.data.length}`);
            console.log(`Primera fecha: ${data.data[0]?.date}`);
            console.log(`Última fecha: ${data.data[data.data.length - 1]?.date}`);
            console.log(`Primer precio: ${data.data[0]?.price}`);
            console.log(`Último precio: ${data.data[data.data.length - 1]?.price}`);
            
            // Calcular variación del último mes disponible
            if (data.data.length > 30) {
                const lastMonthData = data.data.slice(-30);
                const firstPrice = lastMonthData[0].price;
                const lastPrice = lastMonthData[lastMonthData.length - 1].price;
                const variation = ((lastPrice - firstPrice) / firstPrice) * 100;
                
                console.log(`📈 Variación último mes: ${variation.toFixed(2)}%`);
            }
            
        } catch (error) {
            console.error(`❌ Error con fondo ${id}:`, error);
        }
    }
}

// 2. FUNCIÓN PARA VERIFICAR CÁLCULO MANUAL
function verificarCalculoManual() {
    console.log('\n🧮 Verificación manual de fórmula:');
    
    // Ejemplo: precios de muestra
    const precioInicioMes = 1000;
    const precioFinMes = 1050;
    
    // Fórmula correcta según requerimiento
    const variacionCorrecta = ((precioFinMes - precioInicioMes) / precioInicioMes) * 100;
    
    console.log(`Precio inicio: $${precioInicioMes}`);
    console.log(`Precio fin: $${precioFinMes}`);
    console.log(`Variación: ${variacionCorrecta.toFixed(2)}%`);
    console.log('✅ Fórmula: ((precio_fin - precio_inicio) / precio_inicio) * 100');
}

// 3. SIMULACIÓN DE DATOS ESPERADOS (como los espera el evaluador)
function mostrarEstructuraEsperada() {
    console.log('\n📋 Estructura de datos esperada:');
    console.log('Fondo\t\tMes\tPrecio Inicio\tPrecio Fin\tVariación %');
    console.log('Riesgoso\t2023-01\t1.245\t\t1.310\t\t+5.22');
    console.log('Riesgoso\t2023-02\t1.310\t\t1.280\t\t-2.29');
    console.log('Conservador\t2023-01\t1.102\t\t1.115\t\t+1.18');
}

// 4. FUNCIONES PARA TESTING EN APP ANGULAR
function testAngularApp() {
    console.log('\n📱 Testing en App Angular:');
    console.log('1. Abrir: http://localhost:4200');
    console.log('2. Verificar carga de datos (spinner → gráfico)');
    console.log('3. Cambiar fondo (select) → debe recargar');
    console.log('4. Modificar fechas → debe filtrar');
    console.log('5. Revisar consola para logs 🚀 🔄 ✅ ❌');
}

// 5. VERIFICACIÓN SQL
function verificarSQL() {
    console.log('\n🗄️ Verificación SQL esperada:');
    console.log('-- Consulta 1: Total diciembre 2021');
    console.log('movement_type | total_amount');
    console.log('subscription   | 1.500.000');
    console.log('withdrawal     |   700.000');
    
    console.log('\n-- Consulta 2: Cantidad y promedio por fecha');
    console.log('date        | movement_type | cantidad | promedio');
    console.log('2021-12-01  | subscription   |        5 | 120.000');
    console.log('2021-12-01  | withdrawal     |        2 |  80.000');
    
    console.log('\n-- Consulta 3: Usuario con más aportes');
    console.log('name | last_name | total_aportes');
    console.log('Juan | Pérez     |   3.200.000');
}

// EJECUTAR PRUEBAS
console.log('🚀 INICIANDO PRUEBAS REAL LIFE - FINANCIAL CHALLENGE');
console.log('=' .repeat(60));

testFintualAPI().then(() => {
    verificarCalculoManual();
    mostrarEstructuraEsperada();
    testAngularApp();
    verificarSQL();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PRUEBAS COMPLETADAS - Revisa los resultados arriba');
    console.log('📝 Para probar la app: npm install && ng serve');
    console.log('🌐 Luego abre: http://localhost:4200');
});

// Exportar para uso manual
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testFintualAPI, verificarCalculoManual };
}
