// backend/scripts/test-connection.js
// Script para probar la conexión y consultas raw

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...\n');
    
    // Consulta raw directa
    const result = await prisma.$queryRaw`
      SELECT TOP 5 * FROM alarmas.alarmasHistorico
    `;
    
    console.log('✅ Conexión exitosa! Primeras 5 alarmas:');
    console.table(result);
    
    // Contar registros
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as total FROM alarmas.alarmasHistorico
    `;
    
    console.log(`\n📊 Total de alarmas: ${count[0].total}`);
    
    // Probar también la tabla de empleados
    const empleados = await prisma.$queryRaw`
      SELECT TOP 5 idEmpleado, apellido_nombre FROM dimCentral.empleados
    `;
    
    console.log('\n👥 Primeros 5 empleados:');
    console.table(empleados);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();