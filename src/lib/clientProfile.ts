import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type ClientRow = {
  id: string;
  coach_id: string;
  display_name: string;
};

export async function ensureClientProfile(user: User): Promise<ClientRow | null> {
  const { data: existing, error: existingError } = await supabase
    .from('clients')
    .select('id, coach_id, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as ClientRow;

  const metadata = user.user_metadata || {};
  const storedInviteCode =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('invite_code')
      : null;
  const inviteCode =
    typeof metadata.invite_code === 'string'
      ? metadata.invite_code
      : storedInviteCode;
  const displayName =
    typeof metadata.name === 'string' && metadata.name.trim()
      ? metadata.name.trim()
      : user.email?.split('@')[0] || 'Client';

  if (!inviteCode) return null;

  const { data, error } = await supabase.rpc('create_client_with_invite_v2', {
    p_invite_code: inviteCode,
    display_name: displayName,
  });
  if (error) throw error;

  const client = Array.isArray(data) ? data[0] : data;
  if (!client?.id || !client?.coach_id) return null;

  return {
    id: client.id,
    coach_id: client.coach_id,
    display_name: displayName,
  };
}
