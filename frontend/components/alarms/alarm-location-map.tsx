"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Es crucial que estos archivos de íconos existan en tu carpeta `public/`.
const iconRetinaUrl = '/marker-icon-2x.png';
const iconUrl = '/marker-icon.png';
const shadowUrl = '/marker-shadow.png';

const defaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

interface AlarmLocationMapProps {
    position: [number, number];
    popupText: string;
}

const AlarmLocationMap = ({ position, popupText }: AlarmLocationMapProps) => {
    // Usamos refs para mantener una referencia al contenedor del mapa y a la instancia del mapa.
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        // Inicializamos el mapa SÓLO si el contenedor existe y la instancia del mapa aún no ha sido creada.
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: position,
                zoom: 15,
                scrollWheelZoom: false,
            });
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            L.marker(position, { icon: defaultIcon }).addTo(map)
                .bindPopup(popupText);
            
            // Guardamos la instancia del mapa en la ref para que persista entre renders.
            mapInstanceRef.current = map;
        }

        // La función de limpieza es CRÍTICA para el Strict Mode de React.
        // Se asegura de que cuando el componente se desmonte (incluso temporalmente),
        // la instancia del mapa se destruya correctamente, liberando el div contenedor.
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [position, popupText]); // Dependencias para re-ejecutar el efecto si la posición cambia.

    // El componente renderiza un simple div que será controlado por Leaflet.
    return (
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    );
};

export default AlarmLocationMap;