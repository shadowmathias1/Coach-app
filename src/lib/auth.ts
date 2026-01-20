import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: 'coach' | 'client';
  inviteCode?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

type ProfileResult = {
  role: 'coach' | 'client' | null;
  coachId: string | null;
};

async function ensureUserProfile(user: User): Promise<ProfileResult> {
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const metadata = user.user_metadata || {};
  const metadataRole =
    metadata.role === 'coach' || metadata.role === 'client'
      ? metadata.role
      : null;
  const name =
    typeof metadata.name === 'string' && metadata.name.trim()
      ? metadata.name.trim()
      : user.email?.split('@')[0] || 'User';

  if (existing) {
    let role = existing.role as 'coach' | 'client';
    if (metadataRole && metadataRole !== existing.role) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: metadataRole, name, email: user.email || '' })
        .eq('id', user.id);
      if (updateError) throw updateError;
      role = metadataRole;
    }

    if (role === 'coach') {
      const { error: coachError } = await supabase
        .from('coaches')
        .upsert({ id: user.id }, { onConflict: 'id' });
      if (coachError) throw coachError;
      return { role, coachId: null };
    }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('coach_id')
      .eq('id', user.id)
      .maybeSingle();
    if (clientRow?.coach_id) {
      return { role, coachId: clientRow.coach_id };
    }

    const inviteCode =
      typeof metadata.invite_code === 'string' ? metadata.invite_code : null;
    if (!inviteCode) {
      return { role, coachId: null };
    }

    const { data: clientData, error: clientError } = await supabase.rpc(
      'create_client_with_invite_v2',
      { p_invite_code: inviteCode, display_name: name }
    );
    const client = Array.isArray(clientData) ? clientData[0] : clientData;
    if (clientError) throw clientError;
    return { role, coachId: client?.coach_id || null };
  }

  const role = metadataRole || 'client';
  const { error: userError } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email || '',
        name,
        role,
      },
      { onConflict: 'id' }
    );
  if (userError) throw userError;

  if (role === 'coach') {
    const { error: coachError } = await supabase
      .from('coaches')
      .upsert({ id: user.id }, { onConflict: 'id' });
    if (coachError) throw coachError;
    return { role, coachId: null };
  }

  const inviteCode =
    typeof metadata.invite_code === 'string' ? metadata.invite_code : null;
  if (!inviteCode) return { role, coachId: null };

  const { data: clientData, error: clientError } = await supabase.rpc(
    'create_client_with_invite_v2',
    { p_invite_code: inviteCode, display_name: name }
  );
  const client = Array.isArray(clientData) ? clientData[0] : clientData;
  if (clientError) throw clientError;
  return { role, coachId: client?.coach_id || null };
}

// Sign up new user
export async function signUp(data: SignUpData) {
  const { email, password, name, role, inviteCode } = data;

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
        invite_code: inviteCode ? inviteCode.toUpperCase() : null,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('User creation failed');

  const userId = authData.user.id;
  const needsEmailConfirmation = !authData.session;

  if (!needsEmailConfirmation) {
    const profile = await ensureUserProfile(authData.user);

    if (role === 'client') {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken && profile.coachId) {
        fetch('/api/notifications/new-client', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ coachId: profile.coachId }),
        }).catch((error) => {
          console.error('Notification error:', error);
        });
      }
    }
  }

  return { ...authData, needsEmailConfirmation };
}

// Sign in existing user
export async function signIn(data: SignInData) {
  const { email, password } = data;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  let profileRole: 'coach' | 'client' | null = null;
  if (authData.user) {
    const profile = await ensureUserProfile(authData.user);
    profileRole = profile.role;
  }
  return { ...authData, profileRole };
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Verify invite code exists
export async function verifyInviteCode(code: string) {
  const { data, error } = await supabase.rpc(
    'get_coach_by_invite_code',
    { invite_code: code }
  );
  const coach = Array.isArray(data) ? data[0] : data;
  if (error || !coach) return null;
  return coach;
}
