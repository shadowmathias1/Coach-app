import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function validateSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey };
}

// Create Supabase clients
export function createSupabaseClients() {
  const config = validateSupabaseConfig();
  
  const anonClient = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey);
  const adminClient = createClient<Database>(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false },
  });

  return { anonClient, adminClient };
}

// Extract and validate auth token
export function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  return authHeader.replace('Bearer ', '') || null;
}

// Authenticate user from token
export async function authenticateUser(token: string) {
  const { anonClient } = createSupabaseClients();
  const { data: authData, error: authError } = await anonClient.auth.getUser(token);
  
  if (authError || !authData.user) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  return { user: authData.user };
}

// Common error responses
export const ErrorResponses = {
  missingConfig: () => NextResponse.json(
    { error: 'Missing Supabase configuration.' },
    { status: 500 }
  ),
  unauthorized: () => NextResponse.json(
    { error: 'Unauthorized.' },
    { status: 401 }
  ),
  forbidden: () => NextResponse.json(
    { error: 'Forbidden.' },
    { status: 403 }
  ),
  notFound: (message = 'Not found.') => NextResponse.json(
    { error: message },
    { status: 404 }
  ),
  badRequest: (message = 'Invalid payload.') => NextResponse.json(
    { error: message },
    { status: 400 }
  ),
  serverError: (message = 'Internal server error.') => NextResponse.json(
    { error: message },
    { status: 500 }
  ),
};

// Middleware for authenticated routes
export async function requireAuth(request: NextRequest) {
  try {
    validateSupabaseConfig();
  } catch {
    return ErrorResponses.missingConfig();
  }

  const token = extractAuthToken(request);
  if (!token) {
    return ErrorResponses.unauthorized();
  }

  const authResult = await authenticateUser(token);
  if ('error' in authResult) {
    return ErrorResponses.unauthorized();
  }

  return { user: authResult.user };
}

// Parse JSON body safely
export async function parseJsonBody<T = unknown>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
