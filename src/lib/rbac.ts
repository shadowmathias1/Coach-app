import { redirect } from 'next/navigation';
import { getCurrentUser, getUserRole } from './supabase';

// Middleware to protect coach routes
export async function requireCoach() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole();
  
  if (role !== 'coach') {
    redirect('/client/dashboard');
  }

  return user;
}

// Middleware to protect client routes
export async function requireClient() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const role = await getUserRole();
  
  if (role !== 'client') {
    redirect('/coach/dashboard');
  }

  return user;
}

// Middleware to protect any authenticated route
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return user;
}

// Helper to redirect to correct dashboard based on role
export async function redirectToDashboard() {
  const role = await getUserRole();
  
  if (role === 'coach') {
    redirect('/coach/dashboard');
  } else if (role === 'client') {
    redirect('/client/dashboard');
  } else {
    redirect('/auth/login');
  }
}