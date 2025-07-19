// backend/src/utils/statusHelpers.ts

/**
 * @description Mapeo de los estados del frontend a los posibles valores en la base de datos.
 * Esto es crucial para construir las cláusulas `WHERE` en las consultas de Prisma.
 * Por ejemplo, si el frontend pide `status=confirmed`, la consulta buscará `estado IN ('Confirmada', 'confirmed')`.
 */
export const DB_QUERY_STATUS_MAP: Record<'pending' | 'suspicious' | 'confirmed' | 'rejected', string[]> = {
    pending: ['Pendiente'],
    suspicious: ['Sospechosa'],
    confirmed: ['Confirmada', 'confirmed'],
    rejected: ['Rechazada', 'rejected'],
};


export const CONFIRMED_STATUSES = DB_QUERY_STATUS_MAP.confirmed;

/**
 * @description Convierte un estado de la base de datos (string) al estado tipado que espera el frontend.
 * Esta función asegura que, sin importar las variaciones en la base de datos (ej. 'Confirmada', 'confirmed', ' CONFIRMADA '),
 * el frontend siempre recibirá un valor consistente y predecible ('confirmed').
 * 
 * @param dbStatus El valor del campo `estado` proveniente de la base de datos.
 * @returns El estado normalizado para el frontend: 'pending', 'suspicious', 'confirmed', o 'rejected'.
 */
export const getAlarmStatusForFrontend = (dbStatus: string | null | undefined): 'pending' | 'suspicious' | 'confirmed' | 'rejected' => {
  const lowercasedStatus = dbStatus?.trim().toLowerCase();

  if (!lowercasedStatus) {
    return 'pending'; // Si es nulo, indefinido o vacío, se considera pendiente.
  }

  // Se itera sobre el mapa de estados para encontrar una coincidencia.
  // Esto hace que el código sea más mantenible, ya que solo necesitas actualizar DB_QUERY_STATUS_MAP si hay nuevos valores en la BD.
  for (const [frontendStatus, dbValues] of Object.entries(DB_QUERY_STATUS_MAP)) {
    const lowercasedDbValues = dbValues.map(s => s.toLowerCase());
    if (lowercasedDbValues.includes(lowercasedStatus)) {
      return frontendStatus as 'pending' | 'suspicious' | 'confirmed' | 'rejected';
    }
  }
  
  // Si no se encuentra ninguna coincidencia, se devuelve 'pending' como valor por defecto seguro.
  return 'pending';
};