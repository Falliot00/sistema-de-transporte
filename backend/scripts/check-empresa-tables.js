// backend/scripts/check-empresa-tables.js
// Script para verificar las tablas en la base de datos Empresa

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmpresaDatabase() {
  try {
    console.log('🔍 Conectando a la base de datos Empresa...\n');
    
    // Lista todas las tablas en la base de datos Empresa
    const tables = await prisma.$queryRaw`
      SELECT 
        s.name AS SchemaName,
        t.name AS TableName,
        p.rows AS RowCount
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      WHERE p.index_id IN (0, 1)
      ORDER BY s.name, t.name
    `;
    
    console.log('📋 Tablas encontradas en la base de datos Empresa:');
    console.table(tables);
    
    // Busca tablas que probablemente contengan los datos de alarmas
    console.log('\n🎯 Buscando tablas relacionadas con alarmas, choferes, etc.:');
    
    const relevantTables = await prisma.$queryRaw`
      SELECT 
        s.name AS SchemaName,
        t.name AS TableName,
        p.rows AS RowCount
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      WHERE p.index_id IN (0, 1)
        AND (
          LOWER(t.name) LIKE '%alarm%' 
          OR LOWER(t.name) LIKE '%chofer%'
          OR LOWER(t.name) LIKE '%driver%'
          OR LOWER(t.name) LIKE '%vehicle%'
          OR LOWER(t.name) LIKE '%dispositivo%'
          OR LOWER(t.name) LIKE '%historico%'
        )
      ORDER BY p.rows DESC
    `;
    
    if (relevantTables.length > 0) {
      console.table(relevantTables);
    } else {
      console.log('❌ No se encontraron tablas con nombres relacionados.');
    }
    
    // Muestra la estructura de una tabla específica si la encuentras
    // Ajusta el nombre de la tabla según lo que encuentres
    console.log('\n📊 Intentando ver la estructura de columnas...');
    
    try {
      const columns = await prisma.$queryRaw`
        SELECT 
          c.name AS ColumnName,
          t.name AS DataType,
          c.max_length AS MaxLength,
          c.is_nullable AS IsNullable
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID('dbo.alarmasHistorico')
        ORDER BY c.column_id
      `;
      
      if (columns.length > 0) {
        console.log('\nColumnas de alarmasHistorico:');
        console.table(columns);
      }
    } catch (e) {
      console.log('ℹ️  La tabla alarmasHistorico no existe o no es accesible.');
    }
    
  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    
    if (error.message.includes('database')) {
      console.log('\n💡 Verifica que DATABASE_URL apunte a database=Empresa');
    }
    
    console.error('\nDetalles completos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
checkEmpresaDatabase();