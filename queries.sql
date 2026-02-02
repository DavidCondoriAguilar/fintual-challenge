-- =================================================================
-- QUERIES SQL OPTIMIZADAS - DESAFÍO FULL STACK
-- Basado en estructura de tablas: user_movements y user_data
-- =================================================================

-- ESTRUCTURA DE TABLAS (REFERENCIA):
-- user_movements:
--   - user_id: id del usuario
--   - movement_type: 'subscription' (aporte) o 'withdrawal' (retiro)
--   - amount: monto en CLP
--   - date: fecha del movimiento

-- user_data:
--   - user_id: id del usuario
--   - name: nombre del usuario
--   - last_name: apellido del usuario

-- =================================================================
-- CONSULTA 1: Total de aportes y retiros para diciembre de 2021
-- =================================================================
-- Calcula el total de dinero movido en diciembre 2021,
-- separando aportes (subscription) y retiros (withdrawal)

SELECT 
    um.movement_type,
    COUNT(*) as total_transactions,
    SUM(um.amount) as total_amount,
    ROUND(AVG(um.amount), 2) as average_amount,
    MIN(um.amount) as min_amount,
    MAX(um.amount) as max_amount
FROM user_movements um
WHERE um.movement_type IN ('subscription', 'withdrawal')
    AND DATE_TRUNC('month', um.date) = '2021-12-01'
GROUP BY um.movement_type
ORDER BY total_amount DESC;

-- Alternativa para MySQL:
SELECT 
    um.movement_type,
    COUNT(*) as total_transactions,
    SUM(um.amount) as total_amount,
    ROUND(AVG(um.amount), 2) as average_amount,
    MIN(um.amount) as min_amount,
    MAX(um.amount) as max_amount
FROM user_movements um
WHERE um.movement_type IN ('subscription', 'withdrawal')
    AND DATE_FORMAT(um.date, '%Y-%m') = '2021-12'
GROUP BY um.movement_type
ORDER BY total_amount DESC;


-- =================================================================
-- CONSULTA 2: Cantidad y Monto promedio de aportes y rescates por fecha
-- =================================================================
-- Analiza los movimientos diarios agrupados por fecha y tipo

SELECT 
    DATE(um.date) as transaction_date,
    um.movement_type,
    COUNT(*) as transaction_count,
    SUM(um.amount) as total_amount,
    ROUND(AVG(um.amount), 2) as average_amount,
    MIN(um.amount) as min_amount,
    MAX(um.amount) as max_amount
FROM user_movements um
WHERE um.movement_type IN ('subscription', 'withdrawal')
GROUP BY DATE(um.date), um.movement_type
ORDER BY transaction_date DESC, um.movement_type;

-- Versión extendida con variación respecto al día anterior:
WITH daily_stats AS (
    SELECT 
        DATE(um.date) as transaction_date,
        um.movement_type,
        COUNT(*) as transaction_count,
        SUM(um.amount) as total_amount,
        ROUND(AVG(um.amount), 2) as average_amount
    FROM user_movements um
    WHERE um.movement_type IN ('subscription', 'withdrawal')
    GROUP BY DATE(um.date), um.movement_type
)
SELECT 
    ds.transaction_date,
    ds.movement_type,
    ds.transaction_count,
    ds.total_amount,
    ds.average_amount,
    LAG(ds.total_amount) OVER (PARTITION BY ds.movement_type ORDER BY ds.transaction_date) as prev_day_amount,
    CASE 
        WHEN LAG(ds.total_amount) OVER (PARTITION BY ds.movement_type ORDER BY ds.transaction_date) IS NOT NULL 
        THEN ROUND(((ds.total_amount - LAG(ds.total_amount) OVER (PARTITION BY ds.movement_type ORDER BY ds.transaction_date)) / 
                   LAG(ds.total_amount) OVER (PARTITION BY ds.movement_type ORDER BY ds.transaction_date)) * 100, 2)
        ELSE NULL
    END as daily_variation_pct
FROM daily_stats ds
ORDER BY ds.transaction_date DESC, ds.movement_type;


-- =================================================================
-- CONSULTA 3: Nombre y apellido del usuario con más aportes
-- =================================================================
-- Identifica al usuario con mayor cantidad de transacciones tipo 'subscription'

-- Opción principal: JOIN entre tablas
SELECT 
    ud.name,
    ud.last_name,
    ud.user_id,
    COUNT(um.id) as subscription_count,
    COALESCE(SUM(um.amount), 0) as total_subscribed,
    ROUND(COALESCE(AVG(um.amount), 0), 2) as average_subscription,
    MIN(um.date) as first_subscription_date,
    MAX(um.date) as last_subscription_date
FROM user_data ud
LEFT JOIN user_movements um ON ud.user_id = um.user_id AND um.movement_type = 'subscription'
GROUP BY ud.user_id, ud.name, ud.last_name
ORDER BY subscription_count DESC
LIMIT 1;

-- Alternativa: Top 5 usuarios con más aportes (para análisis comparativo)
SELECT 
    ud.name,
    ud.last_name,
    ud.user_id,
    COUNT(um.id) as subscription_count,
    COALESCE(SUM(um.amount), 0) as total_subscribed,
    ROUND(COALESCE(AVG(um.amount), 0), 2) as average_subscription,
    RANK() OVER (ORDER BY COUNT(um.id) DESC) as rank_position
FROM user_data ud
LEFT JOIN user_movements um ON ud.user_id = um.user_id AND um.movement_type = 'subscription'
GROUP BY ud.user_id, ud.name, ud.last_name
ORDER BY subscription_count DESC
LIMIT 5;


-- =================================================================
-- CONSULTAS ADICIONALES PARA ANÁLISIS COMPLETO
-- =================================================================

-- 4. Análisis de comportamiento de usuarios (aportes vs retiros)
SELECT 
    ud.name,
    ud.last_name,
    COUNT(CASE WHEN um.movement_type = 'subscription' THEN 1 END) as subscription_count,
    COUNT(CASE WHEN um.movement_type = 'withdrawal' THEN 1 END) as withdrawal_count,
    COALESCE(SUM(CASE WHEN um.movement_type = 'subscription' THEN um.amount END), 0) as total_subscribed,
    COALESCE(SUM(CASE WHEN um.movement_type = 'withdrawal' THEN um.amount END), 0) as total_withdrawn,
    CASE 
        WHEN COUNT(CASE WHEN um.movement_type = 'subscription' THEN 1 END) > 0 
             AND COUNT(CASE WHEN um.movement_type = 'withdrawal' THEN 1 END) > 0 
        THEN 'Activo Completo'
        WHEN COUNT(CASE WHEN um.movement_type = 'subscription' THEN 1 END) > 0 
        THEN 'Solo Aportes'
        WHEN COUNT(CASE WHEN um.movement_type = 'withdrawal' THEN 1 END) > 0 
        THEN 'Solo Retiros'
        ELSE 'Sin Movimientos'
    END as user_profile
FROM user_data ud
LEFT JOIN user_movements um ON ud.user_id = um.user_id
GROUP BY ud.user_id, ud.name, ud.last_name
ORDER BY subscription_count DESC, withdrawal_count DESC;

-- 5. Tendencia mensual de transacciones
SELECT 
    DATE_TRUNC('month', um.date) as month,
    um.movement_type,
    COUNT(*) as transaction_count,
    SUM(um.amount) as total_amount,
    ROUND(AVG(um.amount), 2) as average_amount,
    COUNT(DISTINCT um.user_id) as unique_users
FROM user_movements um
WHERE um.movement_type IN ('subscription', 'withdrawal')
GROUP BY DATE_TRUNC('month', um.date), um.movement_type
ORDER BY month DESC, um.movement_type;

-- 6. Distribución de montos por rangos
SELECT 
    um.movement_type,
    CASE 
        WHEN um.amount < 10000 THEN 'Menos de $10.000'
        WHEN um.amount BETWEEN 10000 AND 50000 THEN '$10.000 - $50.000'
        WHEN um.amount BETWEEN 50000 AND 100000 THEN '$50.000 - $100.000'
        WHEN um.amount BETWEEN 100000 AND 500000 THEN '$100.000 - $500.000'
        WHEN um.amount BETWEEN 500000 AND 1000000 THEN '$500.000 - $1.000.000'
        WHEN um.amount > 1000000 THEN 'Más de $1.000.000'
    END as amount_range,
    COUNT(*) as transaction_count,
    SUM(um.amount) as total_amount,
    ROUND(AVG(um.amount), 2) as average_amount,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY um.movement_type)), 2) as percentage
FROM user_movements um
WHERE um.movement_type IN ('subscription', 'withdrawal')
GROUP BY um.movement_type, 
    CASE 
        WHEN um.amount < 10000 THEN 1
        WHEN um.amount BETWEEN 10000 AND 50000 THEN 2
        WHEN um.amount BETWEEN 50000 AND 100000 THEN 3
        WHEN um.amount BETWEEN 100000 AND 500000 THEN 4
        WHEN um.amount BETWEEN 500000 AND 1000000 THEN 5
        WHEN um.amount > 1000000 THEN 6
    END,
    CASE 
        WHEN um.amount < 10000 THEN 'Menos de $10.000'
        WHEN um.amount BETWEEN 10000 AND 50000 THEN '$10.000 - $50.000'
        WHEN um.amount BETWEEN 50000 AND 100000 THEN '$50.000 - $100.000'
        WHEN um.amount BETWEEN 100000 AND 500000 THEN '$100.000 - $500.000'
        WHEN um.amount BETWEEN 500000 AND 1000000 THEN '$500.000 - $1.000.000'
        WHEN um.amount > 1000000 THEN 'Más de $1.000.000'
    END
ORDER BY um.movement_type, 
    CASE 
        WHEN um.amount < 10000 THEN 1
        WHEN um.amount BETWEEN 10000 AND 50000 THEN 2
        WHEN um.amount BETWEEN 50000 AND 100000 THEN 3
        WHEN um.amount BETWEEN 100000 AND 500000 THEN 4
        WHEN um.amount BETWEEN 500000 AND 1000000 THEN 5
        WHEN um.amount > 1000000 THEN 6
    END;

-- 7. Usuarios inactivos vs activos (últimos 30 días)
SELECT 
    CASE 
        WHEN last_movement_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'Activo'
        WHEN last_movement_date >= CURRENT_DATE - INTERVAL '90 days' THEN 'Reciente'
        WHEN last_movement_date IS NULL THEN 'Nunca'
        ELSE 'Inactivo'
    END as activity_status,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
    SELECT 
        ud.user_id,
        MAX(um.date) as last_movement_date
    FROM user_data ud
    LEFT JOIN user_movements um ON ud.user_id = um.user_id
    GROUP BY ud.user_id
) user_activity
GROUP BY activity_status
ORDER BY 
    CASE 
        WHEN activity_status = 'Activo' THEN 1
        WHEN activity_status = 'Reciente' THEN 2
        WHEN activity_status = 'Inactivo' THEN 3
        WHEN activity_status = 'Nunca' THEN 4
    END;

-- 8. Métricas de retención (usuarios que continúan invirtiendo)
WITH monthly_users AS (
    SELECT 
        DATE_TRUNC('month', um.date) as month,
        um.user_id,
        SUM(CASE WHEN um.movement_type = 'subscription' THEN 1 ELSE 0 END) as subscriptions_count
    FROM user_movements um
    WHERE um.movement_type = 'subscription'
    GROUP BY DATE_TRUNC('month', um.date), um.user_id
),
retention_analysis AS (
    SELECT 
        month,
        COUNT(DISTINCT user_id) as new_users,
        COUNT(DISTINCT CASE WHEN subscriptions_count > 1 THEN user_id END) as returning_users,
        LAG(COUNT(DISTINCT user_id)) OVER (ORDER BY month) as prev_month_users
    FROM monthly_users
    GROUP BY month
)
SELECT 
    month,
    new_users,
    returning_users,
    prev_month_users,
    CASE 
        WHEN prev_month_users > 0 
        THEN ROUND((new_users * 100.0 / prev_month_users), 2)
        ELSE NULL
    END as growth_rate_pct,
    ROUND((returning_users * 100.0 / NULLIF(new_users, 0)), 2) as retention_rate_pct
FROM retention_analysis
ORDER BY month DESC
LIMIT 12;
