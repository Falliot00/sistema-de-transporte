// --- AÑADIR ESTA NUEVA INTERFAZ ---
export interface PaginationInfo {
  page: number;
  limit: number;
  totalAlarms: number;
  totalPages: number;
}

// --- El resto de tus tipos existentes ---

export interface Alarm {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  type: string; 
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  driver: {
    id: string;
    name: string;
    license: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    model: string;
  };
  device: {
    id: string;
    name: string;
    serialNumber: string;
  };
  media: Media[];
  comments: Comment[];
}

export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface Comment {
  id:string;
  author: string;
  timestamp: string;
  text: string;
}