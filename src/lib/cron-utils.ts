import { NextRequest, NextResponse } from 'next/server';

const cronSecret = process.env.CRON_SECRET;

/**
 * Validate cron secret from request headers
 */
export function validateCronSecret(request: NextRequest): boolean {
  if (!cronSecret) {
    return true; // If no secret is set, allow all requests (for development)
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Middleware for cron job routes
 */
export function requireCronAuth(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return null;
}
