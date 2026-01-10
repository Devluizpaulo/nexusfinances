'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Benefícios', href: '#benefits' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/95 backdrop-blur-xl px-4 py-4 md:px-6 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/5">
      <div className="container mx-auto flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <motion.div 
            className="flex h-14 items-center justify-center shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image src="/images/xoplanilhas_logo.png" alt="Logo Xô Planilhas" width={180} height={200} />
          </motion.div>
        </Link>

        {/* Menu de Navegação - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item, idx) => (
            <motion.a 
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </nav>

        {/* Botões - Desktop */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              asChild 
              variant="ghost" 
              className="font-medium text-sm hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              asChild 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/30 transition-all duration-300 text-sm sm:text-base"
            >
              <Link href="/login" className="flex items-center gap-2">
                Começar Agora
                <ArrowRight className="h-4 w-4 hidden sm:block" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              asChild 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/30 transition-all duration-300 text-xs"
            >
              <Link href="/login">Começar</Link>
            </Button>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="hover:bg-primary/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: mobileMenuOpen ? 1 : 0, height: mobileMenuOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden mt-4 border-t border-primary/10 pt-4"
      >
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => (
            <a 
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t border-primary/10 mt-2">
            <Button 
              asChild 
              variant="ghost" 
              className="flex-1 font-medium text-sm hover:bg-primary/10 hover:text-primary"
            >
              <Link href="/login">Entrar</Link>
            </Button>
          </div>
        </nav>
      </motion.div>
    </header>
  );
}
