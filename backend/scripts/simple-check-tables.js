// backend/scripts/simple-check-tables.js
// Versión simplificada para evitar problemas con palabras reservadas

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Conectando a la base de datos Empresa...\n');
    
    // Query más simple para listar todas las tablas
    const tables = await prisma.$queryRaw`
      SELECT TABLE_SCHEMA, TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    console.log('📋 Todas las tablas encontradas:');
    console.table(tables);
    
    // Buscar tablas específicas
    console.log('\n🎯 Buscando tablas con nombres relevantes...');
    
    const searchPatterns = ['alarm', 'chofer', 'driver', 'vehicle', 'dispositivo', 'historico', 'type'];
    
    const relevantTables = tables.filter(table => {
      const tableName = table.TABLE_NAME.toLowerCase();
      return searchPatterns.some(pattern => tableName.includes(pattern));
    });
    
    if (relevantTables.length > 0) {
      console.log('\n✅ Tablas potencialmente relevantes:');
      console.table(relevantTables);
      
      // Para cada tabla relevante, mostrar sus columnas
      for (const table of relevantTables.slice(0, 3)) { // Solo las primeras 3 para no saturar
        console.log(`\n📊 Columnas de ${table.TABLE_SCHEMA}.${table.TABLE_NAME}:`);
        
        try {
          const columns = await prisma.$queryRaw`
            SELECT 
              COLUMN_NAME,
              DATA_TYPE,
              IS_NULLABLE,
              CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ${table.TABLE_SCHEMA}
              AND TABLE_NAME = ${table.TABLE_NAME}
            ORDER BY ORDINAL_POSITION
          `;
          
          console.table(columns.slice(0, 10)); // Primeras 10 columnas
          
          if (columns.length > 10) {
            console.log(`... y ${columns.length - 10} columnas más`);
          }
        } catch (e) {
          console.log(`❌ Error al obtener columnas: ${e.message}`);
        }
      }
    } else {
      console.log('❌ No se encontraron tablas con nombres relacionados.');
      console.log('\n💡 Mostrando las primeras 10 tablas como referencia:');
      console.table(tables.slice(0, 10));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('   - DATABASE_URL apunta a database=Empresa');
    console.error('   - El usuario tiene permisos SELECT en las tablas');
    console.error('   - La conexión a la base de datos es correcta');
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
checkTables();