import { z } from 'zod';

/**
 * Validation schemas for monetization endpoints
 * Following the Simplicity Doctrine: each schema has one purpose
 */

// License activation
export const activateLicenseSchema = z.object({
  licenseKey: z.string()
    .min(10, 'License key must be at least 10 characters')
    .max(100, 'License key is too long')
    .regex(/^AMEOBA-/, 'License key must start with AMEOBA-'),
});

// License deactivation
export const deactivateLicenseSchema = z.object({
  licenseKey: z.string()
    .min(10, 'License key must be at least 10 characters')
    .max(100, 'License key is too long'),
});

// Checkout session creation
export const createCheckoutSchema = z.object({
  successUrl: z.string().url('successUrl must be a valid URL'),
  cancelUrl: z.string().url('cancelUrl must be a valid URL'),
  email: z.string().email('Invalid email address').optional(),
});

// Subscription checkout
export const createSubscriptionCheckoutSchema = z.object({
  successUrl: z.string().url('successUrl must be a valid URL'),
  cancelUrl: z.string().url('cancelUrl must be a valid URL'),
  email: z.string().email('Invalid email address').optional(),
  priceId: z.string().min(1, 'Stripe price ID is required'),
  tier: z.enum(['lite', 'standard', 'pro', 'business'], {
    errorMap: () => ({ message: 'Invalid subscription tier' }),
  }),
});

// Cancel subscription
export const cancelSubscriptionSchema = z.object({
  immediate: z.boolean().optional(),
});

export type ActivateLicenseInput = z.infer<typeof activateLicenseSchema>;
export type DeactivateLicenseInput = z.infer<typeof deactivateLicenseSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreateSubscriptionCheckoutInput = z.infer<typeof createSubscriptionCheckoutSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;




