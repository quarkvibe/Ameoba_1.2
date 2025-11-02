import { z } from 'zod';

/**
 * Validation schemas for Ollama endpoints
 * Following the Simplicity Doctrine: each schema has one purpose
 */

// Ollama health check
export const ollamaHealthSchema = z.object({
  host: z.string()
    .url('Host must be a valid URL')
    .regex(/^https?:\/\//, 'Host must start with http:// or https://')
    .optional(),
});

// Pull Ollama model
export const pullModelSchema = z.object({
  modelName: z.string()
    .min(1, 'Model name is required')
    .max(100, 'Model name is too long')
    .regex(/^[a-zA-Z0-9_\-:\.]+$/, 'Model name contains invalid characters'),
  host: z.string()
    .url('Host must be a valid URL')
    .regex(/^https?:\/\//, 'Host must start with http:// or https://')
    .optional(),
});

// Delete Ollama model
export const deleteModelSchema = z.object({
  modelName: z.string()
    .min(1, 'Model name is required')
    .max(100, 'Model name is too long'),
  host: z.string()
    .url('Host must be a valid URL')
    .regex(/^https?:\/\//, 'Host must start with http:// or https://')
    .optional(),
});

// Test Ollama connection
export const testConnectionSchema = z.object({
  host: z.string()
    .url('Host must be a valid URL')
    .regex(/^https?:\/\//, 'Host must start with http:// or https://'),
  modelName: z.string()
    .min(1, 'Model name is required')
    .optional(),
});

export type OllamaHealthInput = z.infer<typeof ollamaHealthSchema>;
export type PullModelInput = z.infer<typeof pullModelSchema>;
export type DeleteModelInput = z.infer<typeof deleteModelSchema>;
export type TestConnectionInput = z.infer<typeof testConnectionSchema>;




