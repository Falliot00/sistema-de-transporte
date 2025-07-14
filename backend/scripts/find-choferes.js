// backend/scripts/find-choferes.js
// Script para buscar dónde está la información de choferes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findChoferesTable() {
  try {
    console.log('🔍 Buscando tablas relacionadas con choferes/empleados...\n');
    
    // Buscar en todos los esquemas
    const tables = await prisma.$queryRaw`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
        AND (
          LOWER(TABLE_NAME) LIKE '%chofer%'
          OR LOWER(TABLE_NAME) LIKE '%empleado%'
          OR LOWER(TABLE_NAME) LIKE '%driver%'
          OR LOWER(TABLE_NAME) LIKE '%conductor%'
        )
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    console.log('📋 Tablas encontradas:');
    console.table(tables);
    
    // Revisar las columnas de las tablas más prometedoras
    const candidateTables = [
      { schema: 'mantenimiento', name: 'serviciochoferes' },
      { schema: 'dimCentral', name: 'empleados' },
      { schema: 'stock', name: 'empleados' }
    ];
    
    for (const table of candidateTables) {
      console.log(`\n📊 Columnas de ${table.schema}.${table.name}:`);
      
      try {
        const columns = await prisma.$queryRaw`
          SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ${table.schema}
            AND TABLE_NAME = ${table.name}
          ORDER BY ORDINAL_POSITION
        `;
        
        console.table(columns);
      } catch (e) {
        console.log(`❌ Error: ${e.message}`);
      }
    }
    
    // También buscar si hay una columna 'chofer' en alarmasHistorico
    console.log('\n🔍 Verificando si alarmasHistorico tiene columna chofer o similar...');
    
    const alarmasColumns = await prisma.$queryRaw`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'alarmas'
        AND TABLE_NAME = 'alarmasHistorico'
        AND (
          LOWER(COLUMN_NAME) LIKE '%chofer%'
          OR LOWER(COLUMN_NAME) LIKE '%empleado%'
          OR LOWER(COLUMN_NAME) LIKE '%conductor%'
        )
    `;
    
    if (alarmasColumns.length > 0) {
      console.log('✅ Columnas relacionadas con chofer en alarmasHistorico:');
      console.table(alarmasColumns);
    } else {
      console.log('❌ No se encontraron columnas de chofer en alarmasHistorico');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findChoferesTable();