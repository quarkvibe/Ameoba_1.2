'use client';

import { Check, ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import Link from 'next/link';

export default function PricingPreview() {
  return (
    <section className="py-24 bg-gradient-to-b from-dark to-dark-darker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-2">
            No hidden fees. No surprises. Just great software at a fair price.
          </p>
          <p className="text-2xl font-bold text-accent">
            🦕 About tree fiddy to own it forever
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Self-Hosted */}
          <div className="relative group">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <span className="inline-block px-4 py-1 rounded-full bg-gradient-primary text-white text-sm font-semibold">
                Most Popular
              </span>
            </div>

            <div className="p-8 rounded-2xl bg-dark-card border-2 border-primary shadow-xl shadow-primary/20 h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-text-primary mb-2">Self-Hosted</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-primary">$3.50</span>
                  <span className="text-text-muted">USD</span>
                </div>
                <p className="text-text-secondary mt-2">One-time payment • Lifetime access</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Unlimited content generation',
                  'Multi-model support (OpenAI, Anthropic, Cohere)',
                  'Ollama local models support',
                  'Email & webhook delivery',
                  'Cron scheduling',
                  'AI Agent control',
                  'Real-time monitoring',
                  'Community support',
                  'All future updates',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/pricing" className="block">
                <Button className="w-full group" size="lg">
                  Get Started for $3.50
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Managed Hosting */}
          <div className="p-8 rounded-2xl bg-dark-card border border-dark-border hover:border-primary/30 transition-colors h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-text-primary mb-2">Managed Hosting</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-text-primary">$15</span>
                <span className="text-text-muted">/month</span>
              </div>
              <p className="text-text-secondary mt-2">Starting price • Cancel anytime</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Everything in Self-Hosted',
                'DigitalOcean droplet included',
                'Automatic backups & updates',
                'SSL certificate included',
                '99.9% uptime SLA',
                'Email support',
                'Custom domain setup',
                'Monitoring & alerts',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/pricing" className="block">
              <Button variant="outline" className="w-full" size="lg">
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

