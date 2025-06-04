import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlarmStatus, AlarmType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

export const getStatusColor = (status: AlarmStatus): string => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
  };
  
  return statusColors[status] || '';
};

export const getStatusText = (status: AlarmStatus): string => {
  const statusText = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Descartada'
  };
  
  return statusText[status] || '';
};

export const getTypeColor = (type: AlarmType): string => {
  const typeColors = {
    phone: 'bg-blue-100 text-blue-800 border-blue-200',
    seatbelt: 'bg-purple-100 text-purple-800 border-purple-200',
    speed: 'bg-orange-100 text-orange-800 border-orange-200',
    fatigue: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    distraction: 'bg-pink-100 text-pink-800 border-pink-200'
  };
  
  return typeColors[type] || '';
};

export const getTypeText = (type: AlarmType): string => {
  const typeText = {
    phone: 'Celular',
    seatbelt: 'Cinturón',
    speed: 'Velocidad',
    fatigue: 'Fatiga',
    distraction: 'Distracción'
  };
  
  return typeText[type] || '';
};

export const getTypeIcon = (type: AlarmType): string => {
  const typeIcons = {
    phone: 'smartphone',
    seatbelt: 'alert-triangle',
    speed: 'car',
    fatigue: 'bell-ring',
    distraction: 'bell'
  };
  
  return typeIcons[type] || 'bell';
};