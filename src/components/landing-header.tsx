'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Benefícios', href: '#benefits' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  // Detectar scroll para adicionar efeito visual
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 border-b transition-all duration-500 ${
        scrolled 
          ? 'border-primary/20 bg-background/98 shadow-lg' 
          : 'border-primary/10 bg-background/95 shadow-sm'
      } backdrop-blur-xl px-4 py-3 md:px-6 md:py-4`}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 md:gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
          <motion.div 
            className="flex items-center justify-center cursor-pointer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Image 
              src="/images/xoplanilhas_logo.png" 
              alt="Logo Xô Planilhas" 
              width={180} 
              height={200}
              priority
              className="h-14 w-auto object-contain"
            />
          </motion.div>
        </Link>

        {/* Menu de Navegação - Desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item, idx) => (
            <motion.a 
              key={item.href}
              href={item.href}
              className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors relative group rounded-lg"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.05, type: 'spring', stiffness: 100 }}
            >
              {/* Background hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300" />
              
              {/* Border */}
              <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-blue-500/30 transition-all duration-300" />
              
              {/* Text */}
              <span className="relative z-10">{item.label}</span>
              
              {/* Underline animation */}
              <motion.span 
                className="absolute bottom-0.5 left-4 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: 'calc(100% - 32px)' }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          ))}
        </nav>

        {/* Botões - Desktop */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.08 }} 
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Button 
              asChild 
              className="relative group px-6 py-2.5 rounded-lg font-semibold text-sm text-slate-300 hover:text-white transition-all duration-300 overflow-hidden"
            >
              <Link href="/login" className="relative z-10">
                <span className="relative z-20">Entrar</span>
                {/* Background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/20 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                {/* Border glow */}
                <div className="absolute inset-0 rounded-lg border border-slate-600/30 group-hover:border-slate-500/60 transition-all duration-300" />
              </Link>
            </Button>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.08 }} 
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Button 
              asChild 
              className="relative group px-7 py-2.5 rounded-lg font-bold text-sm text-white shadow-xl overflow-hidden"
            >
              <Link href="/login" className="relative z-10 flex items-center gap-2">
                {/* Background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 opacity-100 group-hover:opacity-110 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" />
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ 
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'loop'
                  }}
                />

                {/* Text content */}
                <span className="relative z-20 flex items-center gap-2">
                  Começar Agora
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </span>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 h-1 w-8 bg-gradient-to-r from-transparent to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
          <motion.div 
            whileHover={{ scale: 1.08 }} 
            whileTap={{ scale: 0.92 }}
          >
            <Button 
              asChild 
              className="relative group px-5 py-2 rounded-lg font-bold text-xs text-white shadow-lg overflow-hidden"
            >
              <Link href="/login" className="relative z-10">
                {/* Background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 opacity-100 group-hover:opacity-110 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 blur-md transition-all duration-300" />
                
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ 
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                  }}
                />

                <span className="relative z-20">Começar</span>
              </Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative group h-10 w-10 rounded-lg hover:bg-slate-700/30 transition-all duration-300 border border-slate-600/20 group-hover:border-slate-500/50"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden mt-4 border-t border-primary/10 pt-4 pb-2"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <motion.a 
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-3 px-4 rounded-lg hover:bg-primary/8"
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  {item.label}
                </motion.a>
              ))}
              <div className="flex items-center gap-2 pt-3 border-t border-primary/10 mt-3">
                <Button 
                  asChild 
                  variant="ghost" 
                  className="flex-1 font-medium text-sm hover:bg-primary/10 hover:text-primary rounded-lg"
                >
                  <Link href="/login">Entrar</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
