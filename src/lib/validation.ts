import { z } from 'zod';

// Common validation schemas
export const messageIdSchema = z.object({
  messageId: z.string().uuid(),
});

export const threadIdSchema = z.object({
  threadId: z.string().uuid(),
});

export const attachmentIdSchema = z.object({
  attachmentId: z.string().uuid(),
});

export const coachIdSchema = z.object({
  coachId: z.string().uuid(),
});

export const accountDeleteSchema = z.object({
  role: z.enum(['coach', 'client']).optional(),
});

// Validation helper
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
  };
}
