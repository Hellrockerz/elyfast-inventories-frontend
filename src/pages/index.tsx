import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  BarChart3, 
  PackageSearch, 
  Zap, 
  ShieldCheck, 
  Globe,
  Store,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/design-system';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-x-hidden">
      <Head>
        <title>Elyfast Inventories | Smart Inventory Management</title>
        <meta name="description" content="The most powerful inventory management system for modern retailers. Powered by Elyfast Labs." />
      </Head>

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] animate-bounce duration-[10s]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
            <Store className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">Elyfast <span className="text-blue-500">Inventories</span></span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          <a href="https://www.elyfast.com/" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-white transition-colors group">
            <span>Elyfast Labs</span>
            <Globe className="w-3 h-3 group-hover:rotate-12 transition-transform" />
          </a>
        </div>

        <Link href="/login">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95">
            Get Started
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest animate-fade-in">
              <Zap className="w-3 h-3" />
              <span>Next-Gen Inventory Control</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Scale Your Business <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Without the Chaos
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Total visibility over your stock, sales, and analytics. 
              Designed for modern retailers who demand speed and precision.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/login">
                <Button className="w-full sm:w-auto px-10 h-16 bg-blue-600 hover:bg-blue-500 text-lg font-bold rounded-2xl shadow-2xl shadow-blue-600/20 transition-all hover:-translate-y-1 group">
                  Start Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="https://www.elyfast.com/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full sm:w-auto px-10 h-16 bg-white/5 border-white/10 hover:bg-white/10 text-lg font-bold rounded-2xl transition-all">
                  About Elyfast
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start space-x-8 pt-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="text-center">
                <div className="text-2xl font-bold">5000+</div>
                <div className="text-[10px] uppercase tracking-tighter">Shops</div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold">1M+</div>
                <div className="text-[10px] uppercase tracking-tighter">Products</div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-[10px] uppercase tracking-tighter">Uptime</div>
              </div>
            </div>
          </div>

          <div className="relative group animate-float">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <GlassCard className="relative bg-black/40 border-white/10 p-2 md:p-4 rounded-[2rem] overflow-hidden">
              <div className="relative overflow-hidden rounded-[1.5rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/logo.png" 
                  alt="Elyfast Inventories Dashboard Preview" 
                  className="w-full h-auto object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 dark:invert" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                  <div className="space-y-1">
                    <p className="text-blue-400 font-bold text-sm uppercase tracking-widest">Dashboard Preview</p>
                    <p className="text-white text-xl font-medium">Real-time Analytics & Control</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 bg-white/[0.02] backdrop-blur-3xl border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need to <span className="text-blue-500">Succeed</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
              Powerful tools designed to simplify your operations and maximize your profit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<PackageSearch className="w-8 h-8 text-blue-400" />}
              title="Smart Inventory"
              description="Automated stock tracking with low-inventory alerts and predictive restocking."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-indigo-400" />}
              title="Deep Analytics"
              description="Visual sales reports and profit analysis to help you make data-driven decisions."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-8 h-8 text-purple-400" />}
              title="Modern Dashboard"
              description="A clean, responsive interface that works beautifully on any device."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <p>© 2026 Elyfast Inventories. A product of <a href="https://www.elyfast.com/" className="text-white hover:underline">Elyfast Labs</a>.</p>
          </div>
          <div className="flex items-center space-x-6">
            <a href="https://www.elyfast.com/" className="hover:text-white transition-colors">Privacy</a>
            <a href="https://www.elyfast.com/" className="hover:text-white transition-colors">Terms</a>
            <a href="https://www.elyfast.com/" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <GlassCard className="p-8 border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group">
      <div className="mb-6 p-3 rounded-2xl bg-white/5 w-fit border border-white/10 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">
        {description}
      </p>
    </GlassCard>
  );
}
