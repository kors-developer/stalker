export interface User {
  id: string;
  phone_number: string;
  created_at: string;
  location_consent: boolean;
  camera_consent: boolean;
  microphone_consent: boolean;
  remote_access_consent: boolean;
  last_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface SecurityLog {
  id: string;
  user_id: string;
  photo_url?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  entry_type: 'check_in' | 'visitor' | 'safety_report';
}

export interface AdminSession {
  id: string;
  authenticated: boolean;
  created_at: string;
}
