// backend/src/utils/dbHelpers.ts
// Funciones auxiliares para manejar las diferencias entre la BD y el código

/**
 * Extrae nombre y apellido de la columna apellido_nombre
 */
export function parseNombreCompleto(apellidoNombre: string | null): { nombre: string; apellido: string } {
  if (!apellidoNombre) {
    return { nombre: '', apellido: '' };
  }
  
  // Asumiendo formato "APELLIDO, NOMBRE" o "APELLIDO NOMBRE"
  const parts = apellidoNombre.includes(',') 
    ? apellidoNombre.split(',').map(s => s.trim())
    : apellidoNombre.split(' ');
  
  if (parts.length >= 2) {
    return {
      apellido: parts[0],
      nombre: parts.slice(1).join(' ')
    };
  }
  
  return {
    apellido: apellidoNombre,
    nombre: ''
  };
}

/**
 * Mapea el ID de empresa a nombre de empresa
 */
export function getEmpresaName(idEmpresa: number | null): string {
  // Aquí deberías mapear los IDs a nombres reales
  // Por ahora, un mapeo de ejemplo:
  const empresaMap: Record<number, string> = {
    1: 'Empresa A',
    2: 'Empresa B',
    // Agregar más según tu BD
  };
  
  return idEmpresa ? (empresaMap[idEmpresa] || `Empresa ${idEmpresa}`) : 'Empresa Desconocida';
}

/**
 * Transforma un empleado de la BD al formato Chofer esperado
 */
export function transformEmpleadoToChofer(empleado: any) {
  const { nombre, apellido } = parseNombreCompleto(empleado.nombre);
  
  return {
    choferes_id: empleado.choferes_id,
    nombre: nombre,
    apellido: apellido,
    foto: empleado.foto || null,
    dni: empleado.dni,
    anios: empleado.anios,
    empresa: getEmpresaName(empleado.idEmpresa),
    // Campos adicionales si los necesitas
    estado: empleado.estado,
    sector: empleado.sector,
    puesto: empleado.puesto
  };
}