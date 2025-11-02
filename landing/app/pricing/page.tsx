'use client';

import { Check, Sparkles, Server, Rocket, Building2, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Footer from '@/components/Footer';
import Link from 'next/link';

const managedTiers = [
  {
    name: 'Lite',
    price: '$15',
    period: '/month',
    icon: Sparkles,
    description: 'Small-scale deployments and development environments',
    specs: ['1GB RAM', '1 vCPU', '25GB SSD', '1 operator'],
    features: [
      'All self-hosted features',
      'Managed DigitalOcean infrastructure',
      'Automated backup systems',
      'Continuous deployment pipeline',
      'SSL/TLS certificates',
      'Community support channel',
      'System status notifications',
    ],
  },
  {
    name: 'Standard',
    price: '$30',
    period: '/month',
    icon: Server,
    description: 'Production-grade for operational deployments',
    specs: ['2GB RAM', '2 vCPU', '50GB SSD', '5 operators'],
    popular: true,
    features: [
      'All Lite tier features',
      '2x computational capacity',
      'Priority support queue',
      'Custom domain configuration',
      'Daily automated backups',
      'Performance monitoring suite',
      '99.9% availability SLA',
    ],
  },
  {
    name: 'Pro',
    price: '$60',
    period: '/month',
    icon: Rocket,
    description: 'High-throughput content generation workloads',
    specs: ['4GB RAM', '4 vCPU', '100GB SSD', 'Unlimited operators'],
    features: [
      'All Standard tier features',
      '4x computational capacity',
      'Priority support (4h SLA)',
      'Advanced telemetry',
      'Configurable backup schedules',
      'Dedicated resource allocation',
      'White-label deployment',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    icon: Building2,
    description: 'Mission-critical deployments with dedicated infrastructure',
    specs: ['Custom allocation', 'Dedicated infrastructure', 'Custom SLA'],
    features: [
      'All Pro tier features',
      'Dedicated account management',
      'Bespoke deployment architecture',
      'Air-gapped on-premise option',
      'Custom integration development',
      'Technical training program',
      'Enterprise licensing agreements',
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-dark-darker">
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-dark-darker to-dark relative overflow-hidden">
        {/* Microscope grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-card/30 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-glow" />
            <span className="text-sm text-text-secondary font-medium tracking-wide">LICENSING & DEPLOYMENT OPTIONS</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-text-primary mb-6">
            Enterprise Licensing
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-4">
            Transparent pricing. No hidden costs. Professional-grade platform at an accessible price point.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-card/50 border border-amoeba/30 backdrop-blur-sm">
            <span className="text-2xl">🦕</span>
            <span className="text-xl font-bold text-amoeba">$3.50</span>
            <span className="text-text-muted">Lifetime License</span>
          </div>
        </div>
      </section>

      {/* Self-Hosted Section */}
      <section className="py-16 bg-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Popular Badge */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-primary text-white text-sm font-bold shadow-lg shadow-primary/30">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-glow" />
                RECOMMENDED
              </div>
            </div>

            <div className="p-12 rounded-2xl bg-dark-card/50 backdrop-blur-sm border-2 border-primary/30 shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4">
                  <span className="text-xs font-medium text-primary tracking-wider">ON-PREMISE DEPLOYMENT</span>
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-3">Lifetime License</h2>
                <div className="flex items-baseline justify-center gap-3 mb-2">
                  <span className="text-7xl font-bold bg-gradient-amoeba bg-clip-text text-transparent">$3.50</span>
                  <span className="text-text-muted text-xl">USD</span>
                </div>
                <p className="text-base text-text-secondary">Single payment • Perpetual license • Device-locked</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <h3 className="text-sm font-semibold text-text-primary tracking-wide uppercase">Core Platform</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Unlimited content generation',
                      'Unlimited templates & workflows',
                      'Multi-model architecture',
                      'OpenAI, Anthropic, Cohere',
                      'Ollama on-premise support',
                      'Enterprise email & webhook',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    <h3 className="text-sm font-semibold text-text-primary tracking-wide uppercase">Advanced Features</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      'Cron-based automation',
                      'AI Agent orchestration',
                      'Real-time analytics',
                      'CLI & REST API',
                      'AES-256-GCM encryption',
                      'Community support',
                      'Lifetime updates',
                      'Zero recurring costs',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/checkout/license">
                  <Button size="lg" className="group min-w-[220px]">
                    Acquire License - $3.50
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/docs/getting-started">
                  <Button variant="outline" size="lg" className="min-w-[220px]">
                    Technical Documentation
                  </Button>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-primary/20">
                <p className="text-center text-text-muted text-sm">
                  <span className="font-mono bg-dark-card/50 px-2 py-1 rounded border border-primary/20">TREEFIDDY</span>
                  <span className="mx-2">•</span>
                  <span>Early access program</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Managed Hosting Section */}
      <section className="py-16 bg-dark-darker relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-card/30 border border-accent/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow" />
              <span className="text-sm text-text-secondary font-medium tracking-wide">MANAGED INFRASTRUCTURE</span>
            </div>
            <h2 className="text-4xl font-bold text-text-primary mb-4">
              Hosted Deployment Tiers
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Enterprise-managed infrastructure. Zero operational overhead.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managedTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={`p-6 rounded-xl bg-dark-card/50 backdrop-blur-sm border ${
                    tier.popular ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-primary/20'
                  } hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col`}
                >
                  {tier.popular && (
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-primary text-white text-xs font-semibold">
                        <div className="w-1 h-1 rounded-full bg-white animate-glow" />
                        RECOMMENDED
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-1.5">{tier.name}</h3>
                    <p className="text-xs text-text-muted mb-4 leading-relaxed">{tier.description}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-text-primary">{tier.price}</span>
                      <span className="text-sm text-text-muted">{tier.period}</span>
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-primary/20">
                    {tier.specs.map((spec, i) => (
                      <p key={i} className="text-xs text-text-muted flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-accent/50" />
                        {spec}
                      </p>
                    ))}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={tier.name === 'Business' ? 'mailto:sales@ameoba.org' : `/checkout/subscription?tier=${tier.name.toLowerCase()}`}>
                    <Button
                      variant={tier.popular ? 'primary' : 'outline'}
                      className="w-full"
                    >
                      {tier.name === 'Business' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-16 bg-dark-darker">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'What does "tree fiddy" mean?',
                a: "It's $3.50 - a South Park reference. We believe great software shouldn't cost a fortune.",
              },
              {
                q: 'Can I really use it forever for $3.50?',
                a: 'Yes! One-time payment, lifetime license, per device. No monthly fees, no hidden costs. All features included.',
              },
              {
                q: 'What happens to my license if I upgrade my machine?',
                a: 'You can deactivate your license and activate it on a new device anytime. Self-service, instant.',
              },
              {
                q: 'Do I need to bring my own API keys?',
                a: 'Yes, for cloud AI models (OpenAI, Anthropic, Cohere). Or use Ollama to run models locally on your own hardware with no API costs.',
              },
              {
                q: 'Can I get a refund?',
                a: '30-day money-back guarantee, no questions asked. Just email support@ameoba.org.',
              },
              {
                q: 'What AI models are supported?',
                a: 'OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), Cohere, and any Ollama model (Llama 3, Mistral, Phi-3, etc.).',
              },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-lg bg-dark-card border border-dark-border">
                <h3 className="text-lg font-semibold text-text-primary mb-2">{faq.q}</h3>
                <p className="text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

