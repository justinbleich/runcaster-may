import { createClient } from '@supabase/supabase-js';
import { calculatePace } from './pace';

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
  type: 'run' | 'bike' | 'walk';
  distance: number;
  duration: number;
  created_at: string;
  title?: string;
  description?: string;
  is_public: boolean;
  route: { lat: number; lng: number }[];
  start_time?: number;
  end_time?: number;
  show_map?: boolean;
  hide_start_end?: boolean;
  location?: string;  // City name or location identifier
  pace?: string;  // Calculated pace for the activity
}

export async function createActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
  // Calculate pace before storing (duration is in minutes)
  const pace = calculatePace(activity.distance, activity.duration, activity.type);
  
  console.log('Creating activity with data:', JSON.stringify({
    type: activity.type,
    distance: activity.distance,
    duration: activity.duration,
    is_public: activity.is_public
  }));
  
  try {
    // First check connection to Supabase
    const { error: pingError } = await supabase.from('activities').select('id').limit(1);
    if (pingError) {
      console.error('Supabase connection error:', pingError);
      throw new Error(`Connection error: ${pingError.message}`);
    }
    
    // Then attempt to insert activity
    const { data, error } = await supabase
      .from('activities')
      .insert([{ 
        ...activity, 
        pace,
        show_map: activity.show_map !== false 
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating activity:', error, JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('Activity created successfully:', data.id);
    return data;
  } catch (error: any) {
    console.error('Exception creating activity:', error);
    // Check for specific error types and provide clearer messages
    if (error.message?.includes('network')) {
      throw new Error('Network error connecting to database. Please check your internet connection.');
    } else if (error.message?.includes('auth')) {
      throw new Error('Authentication error. Please sign in again.');
    } else if (error.message?.includes('constraint')) {
      throw new Error('Database constraint error. Some required fields may be missing.');
    } else {
      throw error;
    }
  }
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

export async function getLikeCount(activityId: string) {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId);
  if (error) throw error;
  return count || 0;
}

export async function hasLiked(activityId: string, userAddress: string) {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId)
    .eq('user_address', userAddress);
  if (error) throw error;
  return (count || 0) > 0;
}

export async function likeActivity(activityId: string, userAddress: string) {
  const { error } = await supabase
    .from('likes')
    .insert([{ activity_id: activityId, user_address: userAddress }]);
  if (error) throw error;
}

export async function unlikeActivity(activityId: string, userAddress: string) {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_address', userAddress);
  if (error) throw error;
} 