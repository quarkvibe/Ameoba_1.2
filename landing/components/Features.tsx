'use client';

import { Bot, Lock, Zap, Mail, Webhook, Calendar, Brain, Gauge, Globe } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'Multi-Model Architecture',
    description: 'Enterprise-grade support for OpenAI, Anthropic, Cohere, and local Ollama deployment.',
  },
  {
    icon: Lock,
    title: 'Military-Grade Encryption',
    description: 'AES-256-GCM encryption with secure key management. HIPAA-ready data protection.',
  },
  {
    icon: Zap,
    title: 'Real-Time Processing',
    description: 'Sub-second content generation with comprehensive monitoring and audit trails.',
  },
  {
    icon: Mail,
    title: 'Enterprise Email Systems',
    description: 'Seamless integration with SendGrid and AWS SES for mission-critical delivery.',
  },
  {
    icon: Webhook,
    title: 'API-First Integration',
    description: 'RESTful webhooks for seamless system-to-system communication.',
  },
  {
    icon: Calendar,
    title: 'Automated Scheduling',
    description: 'Precision cron-based automation for unattended content generation workflows.',
  },
  {
    icon: Brain,
    title: 'AI Agent Orchestration',
    description: 'Natural language command interface for intuitive platform control.',
  },
  {
    icon: Gauge,
    title: 'Performance Analytics',
    description: 'Real-time metrics tracking: tokens, costs, latency, and system health.',
  },
  {
    icon: Globe,
    title: 'On-Premise AI Models',
    description: 'Deploy Ollama locally for zero-cost, air-gapped content generation.',
  },
];

export default function Features() {
  return (
    <section className="py-24 bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-card/30 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-glow" />
            <span className="text-sm text-text-secondary font-medium tracking-wide">PLATFORM SPECIFICATIONS</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            Enterprise-Grade Capabilities
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Clinical precision meets intelligent automation. Built for professionals who demand excellence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 rounded-xl bg-dark-card/50 backdrop-blur-sm border border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:border-primary/40 transition-all">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2 tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

