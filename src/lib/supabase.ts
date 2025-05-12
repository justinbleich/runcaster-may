import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Activity {
  id: string;
  fid: number;
  user_address: string;
  type: 'run' | 'bike';
  distance: number;
  duration: number;
  created_at: string;
  title?: string;
  description?: string;
  is_public: boolean;
  route: { lat: number; lng: number }[];
  start_time?: number;
  end_time?: number;
}

export async function createActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('activities')
    .insert([activity])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Activity[];
}

export async function getUserActivities(userAddress: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_address', userAddress)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Activity[];
} 