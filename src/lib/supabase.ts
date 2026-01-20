import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to get current user
export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) return null;

  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
    return data.session?.user ?? null;
  }

  return session.user;
}

// Helper to get user role by id
export async function getUserRoleById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.role as 'coach' | 'client' | null;
}

// Helper to get user role
export async function getUserRole() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserRoleById(user.id);
}

// Helper to check if user is coach
export async function isCoach() {
  const role = await getUserRole();
  return role === 'coach';
}

// Helper to check if user is client
export async function isClient() {
  const role = await getUserRole();
  return role === 'client';
}