// frontend/hooks/use-alarm-navigation.ts
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Alarm, GetAlarmsParams } from '@/types';
import { getAlarms } from '@/lib/api';

interface NavigationState {
    alarms: Alarm[];
    currentIndex: number;
    currentPage: number;
    hasMorePages: boolean;
    isLoadingMore: boolean;
    totalAlarms: number;
}

interface InitializeParams {
    status?: string;
    search?: string;
    type?: string[];
    company?: string[];
    startDate?: string;
    endDate?: string;
    pageSize?: number;
    hasMorePages?: boolean;
    currentPage?: number;
    totalAlarms?: number;
}

/**
 * Hook mejorado para gestionar la navegación a través de alarmas con paginación dinámica
 */
export const useAlarmNavigation = (onError?: (error: string) => void) => {
    const [state, setState] = useState<NavigationState>({
        alarms: [],
        currentIndex: -1,
        currentPage: 1,
        hasMorePages: false,
        isLoadingMore: false,
        totalAlarms: 0
    });

    // Parámetros de búsqueda para mantener consistencia al paginar
    const [searchParams, setSearchParams] = useState<InitializeParams | null>(null);
    
    // Ref para evitar problemas de dependencias circulares
    const loadMoreAlarmsRef = useRef<() => Promise<boolean>>();

    /**
     * Carga más alarmas de la siguiente página
     */
    const loadMoreAlarms = useCallback(async () => {
        if (state.isLoadingMore || !state.hasMorePages || !searchParams) return false;

        setState(prev => ({ ...prev, isLoadingMore: true }));

        try {
            const nextPage = state.currentPage + 1;
            const response = await getAlarms({
                ...searchParams,
                page: nextPage,
                pageSize: searchParams.pageSize || 12
            });

            setState(prev => ({
                ...prev,
                alarms: [...prev.alarms, ...response.alarms],
                currentPage: nextPage,
                hasMorePages: response.pagination.hasNextPage,
                isLoadingMore: false,
                totalAlarms: response.pagination.totalAlarms
            }));

            return true;
        } catch (error) {
            onError?.('Error al cargar más alarmas');
            setState(prev => ({ ...prev, isLoadingMore: false }));
            return false;
        }
    }, [state.isLoadingMore, state.hasMorePages, state.currentPage, searchParams, onError]);

    // Actualizar la ref cuando cambie loadMoreAlarms
    useEffect(() => {
        loadMoreAlarmsRef.current = loadMoreAlarms;
    }, [loadMoreAlarms]);

    /**
     * Inicializa la navegación con parámetros de búsqueda
     */
    const initialize = useCallback((
        alarmList: Alarm[], 
        startIndex: number,
        params?: InitializeParams
    ) => {
        setSearchParams(params || null);
        setState({
            alarms: alarmList,
            currentIndex: startIndex,
            currentPage: params?.currentPage || 1,
            hasMorePages: params?.hasMorePages || false,
            isLoadingMore: false,
            totalAlarms: params?.totalAlarms || alarmList.length
        });
    }, []);

    /**
     * Navega a la siguiente alarma, cargando más si es necesario
     */
    const goToNext = useCallback(async () => {
        const nextIndex = state.currentIndex + 1;
        
        // Si llegamos al final de las alarmas cargadas
        if (nextIndex >= state.alarms.length) {
            // Si hay más páginas, intentamos cargar
            if (state.hasMorePages && loadMoreAlarmsRef.current) {
                const loaded = await loadMoreAlarmsRef.current();
                if (loaded) {
                    setState(prev => ({ ...prev, currentIndex: nextIndex }));
                }
            }
            // Si no hay más páginas o falló la carga, no avanzamos
            return;
        }
        
        // Si aún hay alarmas en el array actual
        setState(prev => ({ ...prev, currentIndex: nextIndex }));
    }, [state.currentIndex, state.alarms.length, state.hasMorePages]);

    /**
     * Navega a la alarma anterior
     */
    const goToPrevious = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentIndex: Math.max(0, prev.currentIndex - 1)
        }));
    }, []);

    /**
     * Elimina una alarma y ajusta el índice si es necesario
     */
    const removeAlarm = useCallback((alarmId: string) => {
        setState(prev => {
            const newAlarms = prev.alarms.filter(a => a.id !== alarmId);
            const removedIndex = prev.alarms.findIndex(a => a.id === alarmId);
            
            // Si la alarma no se encuentra, no hacer nada
            if (removedIndex === -1) {
                return prev;
            }
            
            let newState = { ...prev };
            
            // Si eliminamos la alarma actual
            if (removedIndex === prev.currentIndex) {
                // Si no quedan alarmas, establecer índice a -1
                if (newAlarms.length === 0) {
                    newState = {
                        ...prev,
                        alarms: newAlarms,
                        currentIndex: -1,
                        totalAlarms: Math.max(0, prev.totalAlarms - 1)
                    };
                }
                // Si hay alarmas después, mantenemos el índice si es posible
                // Si no, retrocedemos uno
                else {
                    const newIndex = prev.currentIndex >= newAlarms.length 
                        ? Math.max(0, newAlarms.length - 1)
                        : prev.currentIndex;
                    
                    newState = {
                        ...prev,
                        alarms: newAlarms,
                        currentIndex: newIndex,
                        totalAlarms: Math.max(0, prev.totalAlarms - 1)
                    };
                }
            }
            // Si eliminamos una alarma antes de la actual, ajustamos el índice
            else if (removedIndex < prev.currentIndex) {
                newState = {
                    ...prev,
                    alarms: newAlarms,
                    currentIndex: prev.currentIndex - 1,
                    totalAlarms: Math.max(0, prev.totalAlarms - 1)
                };
            }
            // Si eliminamos una alarma después, no afecta el índice
            else {
                newState = {
                    ...prev,
                    alarms: newAlarms,
                    totalAlarms: Math.max(0, prev.totalAlarms - 1)
                };
            }
            
            // Si nos quedan pocas alarmas y hay más páginas, programar la carga
            if (newAlarms.length <= 3 && prev.hasMorePages && !prev.isLoadingMore) {
                // Usar setTimeout para evitar actualizar el estado durante el render
                setTimeout(() => {
                    if (loadMoreAlarmsRef.current) {
                        loadMoreAlarmsRef.current();
                    }
                }, 0);
            }
            
            return newState;
        });
    }, []);

    /**
     * Restablece el estado de navegación
     */
    const reset = useCallback(() => {
        setState({
            alarms: [],
            currentIndex: -1,
            currentPage: 1,
            hasMorePages: false,
            isLoadingMore: false,
            totalAlarms: 0
        });
        setSearchParams(null);
    }, []);

    // Valores calculados
    const currentAlarm = useMemo(() => {
        return state.currentIndex >= 0 && state.currentIndex < state.alarms.length 
            ? state.alarms[state.currentIndex] 
            : null;
    }, [state.alarms, state.currentIndex]);

    const hasNext = useMemo(() => 
        state.currentIndex < state.alarms.length - 1 || state.hasMorePages,
        [state.currentIndex, state.alarms.length, state.hasMorePages]
    );

    const hasPrevious = useMemo(() => 
        state.currentIndex > 0, 
        [state.currentIndex]
    );

    const navigationState = useMemo(() => ({
        total: state.totalAlarms,
        current: state.currentIndex + 1,
        loadedCount: state.alarms.length,
        isLoadingMore: state.isLoadingMore
    }), [state.totalAlarms, state.currentIndex, state.alarms.length, state.isLoadingMore]);

    // Efecto para cargar más alarmas automáticamente cuando sea necesario
    useEffect(() => {
        // Si el índice actual apunta a una alarma que no existe y hay más páginas
        if (state.currentIndex >= 0 && 
            state.currentIndex >= state.alarms.length && 
            state.hasMorePages && 
            !state.isLoadingMore &&
            loadMoreAlarmsRef.current) {
            loadMoreAlarmsRef.current();
        }
    }, [state.currentIndex, state.alarms.length, state.hasMorePages, state.isLoadingMore]);

    return {
        // Estado
        currentAlarm,
        hasNext,
        hasPrevious,
        isNavigating: state.alarms.length > 0 && state.currentIndex !== -1,
        navigationState,
        isLoadingMore: state.isLoadingMore,

        // Acciones
        initialize,
        reset,
        goToNext,
        goToPrevious,
        removeAlarm,
        loadMoreAlarms
    };
};