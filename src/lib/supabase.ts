import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Activity {
  id: string;
  user_address: string;
  type: 'run' | 'bike';
  distance: number;
  duration: number;
  created_at: string;
  name?: string;
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