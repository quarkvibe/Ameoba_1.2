# 🦕 Amoeba Landing Page

**Marketing website for ameoba.org**

Built with Next.js 14, TypeScript, and Tailwind CSS.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📄 Pages

### Live Pages ✅
- **Homepage** (`/`) - Hero, features, pricing preview
- **Pricing** (`/pricing`) - Full pricing with all tiers
- **Checkout** (`/checkout/license`) - License purchase flow

### Coming Soon ⏳
- `/success` - Post-purchase success page
- `/docs/*` - Documentation site
- `/blog/*` - Blog (optional)
- `/about` - About page

---

## 🎨 Design System

### Colors
```css
Primary (Emerald):  #10B981
Accent (Gold):      #F59E0B
Dark Background:    #0F172A
Card Background:    #1E293B
```

### Typography
- **Font**: Inter
- **Headings**: Bold, 48-72px
- **Body**: Regular, 16-20px
- **Code**: JetBrains Mono

---

## 🔧 Configuration

### Environment Variables
Create `.env.local`:

```bash
# Stripe (for payments)
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# API URL (main app)
NEXT_PUBLIC_API_URL=https://app.ameoba.org

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=ameoba.org
```

---

## 📁 Project Structure

```
landing/
├── app/
│   ├── page.tsx              # Homepage
│   ├── pricing/page.tsx      # Pricing page
│   ├── checkout/
│   │   └── license/page.tsx  # License checkout
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── Hero.tsx              # Hero section
│   ├── Features.tsx          # Features grid
│   ├── PricingPreview.tsx    # Pricing preview
│   ├── Footer.tsx            # Footer
│   └── ui/
│       └── Button.tsx        # Button component
├── lib/
│   └── utils.ts              # Utility functions
└── public/                   # Static assets
```

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add custom domain
vercel domains add ameoba.org
```

### Environment Variables (Production)
Add in Vercel dashboard:
- `NEXT_PUBLIC_STRIPE_KEY` - Live Stripe key
- `STRIPE_SECRET_KEY` - Live Stripe secret
- `NEXT_PUBLIC_API_URL` - Production API URL

---

## 🎯 Features

### Completed ✅
- [x] Responsive design (mobile, tablet, desktop)
- [x] SEO optimized (meta tags, Open Graph)
- [x] Fast performance (Next.js 14 App Router)
- [x] Beautiful animations
- [x] Dark mode design
- [x] Accessible components

### In Progress 🚧
- [ ] Stripe integration (test mode ready)
- [ ] Success page after purchase
- [ ] Documentation site
- [ ] Blog section
- [ ] Analytics integration

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Payments**: Stripe
- **Deployment**: Vercel

---

## 📊 Performance Targets

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Core Web Vitals**: All green

---

## 🔗 Links

- **Live Site**: https://ameoba.org
- **Main App**: https://app.ameoba.org
- **GitHub**: https://github.com/yourusername/Ameoba
- **Documentation**: https://ameoba.org/docs

---

## 📝 License

MIT © 2025 Amoeba

---

**Built with ❤️ for developers who want great AI tools without the BS.**
