// frontend/hooks/use-alarm-navigation.ts
import { useState, useCallback, useMemo } from 'react';
import { Alarm } from '@/types';

/**
 * Hook personalizado para gestionar la navegación a través de una lista de alarmas.
 * @returns Un objeto con el estado de la navegación y las funciones para controlarla.
 */
export const useAlarmNavigation = () => {
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);

    /**
     * Establece la lista de alarmas y el índice inicial para la navegación.
     * @param alarmList - La lista completa de alarmas para navegar.
     * @param startIndex - El índice del elemento que se mostrará inicialmente.
     */
    const initialize = useCallback((alarmList: Alarm[], startIndex: number) => {
        setAlarms(alarmList);
        setCurrentIndex(startIndex);
    }, []);

    /**
     * Restablece el estado de navegación.
     */
    const reset = useCallback(() => {
        setAlarms([]);
        setCurrentIndex(-1);
    }, []);
    
    /**
     * Elimina una alarma de la lista de navegación actual.
     * Útil después de que una alarma es procesada (ej. confirmada o rechazada).
     * @param alarmId - El ID de la alarma a eliminar.
     */
    const removeAlarm = useCallback((alarmId: string) => {
        setAlarms(prevAlarms => prevAlarms.filter(a => a.id !== alarmId));
        // El índice se ajustará automáticamente o se puede manejar en el componente que lo usa.
        // Si el índice actual se elimina, se podría mover al anterior o al siguiente.
        // Por simplicidad, aquí solo se elimina. El componente decidirá qué mostrar.
    }, []);


    const goToNext = useCallback(() => {
        setCurrentIndex(prevIndex => {
            if (prevIndex < alarms.length - 1) {
                return prevIndex + 1;
            }
            return prevIndex;
        });
    }, [alarms.length]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prevIndex => {
            if (prevIndex > 0) {
                return prevIndex - 1;
            }
            return prevIndex;
        });
    }, []);

    const currentAlarm = useMemo(() => {
        return currentIndex >= 0 && currentIndex < alarms.length ? alarms[currentIndex] : null;
    }, [alarms, currentIndex]);

    const hasNext = useMemo(() => currentIndex < alarms.length - 1, [currentIndex, alarms.length]);
    const hasPrevious = useMemo(() => currentIndex > 0, [currentIndex]);
    
    const navigationState = useMemo(() => ({
        total: alarms.length,
        current: currentIndex + 1
    }), [alarms.length, currentIndex]);

    return {
        // Estado
        currentAlarm,
        hasNext,
        hasPrevious,
        isNavigating: alarms.length > 0 && currentIndex !== -1,
        navigationState,

        // Acciones
        initialize,
        reset,
        goToNext,
        goToPrevious,
        removeAlarm,
    };
};