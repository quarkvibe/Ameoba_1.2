'use client';

import { Check, Lock, CreditCard, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function LicenseCheckout() {
  const handleCheckout = async () => {
    // TODO: Integrate with Stripe
    alert('Stripe integration coming soon! This will redirect to Stripe Checkout.');
  };

  return (
    <main className="min-h-screen bg-dark-darker py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/pricing" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-6">
              🦕 Get Your License
            </h1>

            <div className="p-6 rounded-xl bg-dark-card border border-dark-border mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                What You're Getting:
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  'Lifetime license for this device',
                  'Unlimited AI content generation',
                  'All features included',
                  'All future updates',
                  'Community support',
                  '30-day money-back guarantee',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-dark-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">Self-Hosted License</span>
                  <span className="text-text-primary font-semibold">$3.50</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-primary">$3.50 USD</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-text-muted">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Secure payment powered by Stripe. We never see your credit card information.
              </p>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <div className="p-6 rounded-xl bg-dark-card border border-primary/20 shadow-xl">
              <h2 className="text-xl font-semibold text-text-primary mb-6">
                Payment Information
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 rounded-lg bg-dark border border-dark-border text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Your license key will be sent to this email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="TREEFIDDY"
                    className="w-full px-4 py-2 rounded-lg bg-dark border border-dark-border text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full mb-4 group"
                onClick={handleCheckout}
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Continue to Payment
              </Button>

              <div className="space-y-2 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>One-time payment, no subscriptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Instant delivery via email</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-muted text-center mt-4">
              By purchasing, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}




