'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  week?: number;
}

export function SuccessModal({ isOpen, onClose, title, message, week }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop desfocado */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal centralizado */}
          <motion.div
            className="relative z-10 mx-4 max-w-md w-full"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              mass: 0.8
            }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 border border-emerald-200 dark:border-emerald-800 shadow-2xl">
              {/* Fundo decorativo */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-2xl" />
              
              {/* Conteúdo */}
              <div className="relative p-8 text-center space-y-6">
                {/* Botão fechar */}
                <motion.button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
                
                {/* Ícone animado */}
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ delay: 0.3, duration: 2, repeat: Infinity }}
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </motion.div>
                
                {/* Texto */}
                <div className="space-y-3">
                  <motion.h2
                    className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {title}
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                  </motion.h2>
                  
                  <motion.p
                    className="text-lg text-gray-700 dark:text-gray-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {message}
                  </motion.p>
                  
                  {week && (
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full border border-emerald-200 dark:border-emerald-700"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                        Semana {week} concluída!
                      </span>
                    </motion.div>
                  )}
                </div>
                
                {/* Botão de ação */}
                <motion.button
                  onClick={onClose}
                  className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuar
                </motion.button>
              </div>
              
              {/* Partículas decorativas animadas */}
              <motion.div
                className="absolute top-8 left-8"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -20] }}
                transition={{ delay: 0.8, duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </motion.div>
              <motion.div
                className="absolute top-12 right-12"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -15] }}
                transition={{ delay: 1, duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
              </motion.div>
              <motion.div
                className="absolute bottom-8 left-12"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -10] }}
                transition={{ delay: 1.2, duration: 2, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="h-3 w-3 text-blue-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
