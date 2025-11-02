import Hero from '@/components/Hero';
import Features from '@/components/Features';
import PricingPreview from '@/components/PricingPreview';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-darker">
      <Hero />
      <Features />
      <PricingPreview />
      <Footer />
    </main>
  );
}
