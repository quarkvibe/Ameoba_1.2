import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical/Laboratory Amoeba Brand - Clinical & Scientific
        primary: {
          DEFAULT: '#14B8A6', // Teal 500 - Clinical microscope slides
          dark: '#0D9488',    // Teal 600 - Deep lab equipment
          light: '#5EEAD4',   // Teal 300 - Bioluminescent glow
        },
        accent: {
          DEFAULT: '#06B6D4', // Cyan 500 - Laboratory blue
          dark: '#0891B2',    // Cyan 600 - Medical equipment
          light: '#67E8F9',   // Cyan 300 - Petri dish lighting
        },
        amoeba: {
          DEFAULT: '#10B981', // Emerald - The organism itself
          glow: '#34D399',    // Emerald light - Cellular glow
        },
        // Dark Theme - Clean lab environment
        dark: {
          DEFAULT: '#0A1628', // Deep lab blue-black
          darker: '#030712',  // Almost black - microscope background
          card: '#0F1D3A',    // Lab equipment panel
          border: '#1E3A5F',  // Steel blue borders
        },
        // Text - Professional & Clinical
        text: {
          primary: '#F1F5F9',   // Clinical white
          secondary: '#CBD5E1', // Lab note gray
          muted: '#94A3B8',     // Subdued equipment text
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)', // Clinical teal
        'gradient-accent': 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', // Lab blue
        'gradient-amoeba': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', // Organism glow
        'gradient-radial-glow': 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)', // Microscope glow
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite', // Organic floating movement
        'morph': 'morph 8s ease-in-out infinite', // Amoeba-like morphing
        'glow': 'glow 2s ease-in-out infinite', // Bioluminescent glow
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(20,184,166,0.3), 0 0 40px rgba(20,184,166,0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(20,184,166,0.5), 0 0 60px rgba(20,184,166,0.2)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

