import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  phone_number: string;
  consents: {
    location: boolean;
    camera: boolean;
    microphone: boolean;
    remoteAccess: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export const saveUser = async (phoneNumber: string, consents: any): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        phone_number: phoneNumber,
        consents: consents,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const updateUserLocation = async (phoneNumber: string, latitude: number, longitude: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('update_user_location', {
      p_phone_number: phoneNumber,
      p_latitude: latitude,
      p_longitude: longitude
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Location update error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getUsers = async (): Promise<{ users: User[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_seen', { ascending: false });

    if (error) throw error;
    
    // Преобразуем данные из Supabase в наш тип User
    const users: User[] = (data || []).map(user => ({
      id: user.id,
      phone_number: user.phone_number,
      consents: typeof user.consents === 'object' && user.consents !== null 
        ? user.consents as User['consents']
        : { location: false, camera: false, microphone: false, remoteAccess: false },
      location: typeof user.location === 'object' && user.location !== null
        ? user.location as User['location']
        : undefined,
      last_seen: user.last_seen,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    return { users };
  } catch (error) {
    console.error('Get users error:', error);
    return { users: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const saveAdminSession = async (sessionToken: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 дней

    const { error } = await supabase
      .from('admin_sessions')
      .upsert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Save admin session error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const checkAdminSession = async (sessionToken: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { isValid: !!data };
  } catch (error) {
    console.error('Check admin session error:', error);
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
