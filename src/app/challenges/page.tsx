
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Challenge52Weeks } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { SetupChallenge } from '@/components/challenges/setup-challenge';
import { ChallengeProgress } from '@/components/challenges/challenge-progress';
import { Loader2, Sparkles, Trophy, Target, Rocket, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

export default function ChallengesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const activeChallengeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/challenges52weeks`),
      where('status', '==', 'active'),
      limit(1)
    );
  }, [user, firestore]);

  const { data: challenges, isLoading: isChallengesLoading } = useCollection<Challenge52Weeks>(activeChallengeQuery);

  const activeChallenge = challenges?.[0];
  const isLoading = isUserLoading || isChallengesLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity }
            }}
          >
            <Sparkles className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <p className="text-lg font-medium text-muted-foreground">Carregando seus desafios...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header com Animações */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 border-2 border-primary/20 p-8 md:p-12"
      >
        {/* Efeito de fundo animado */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <motion.div
          className="absolute top-10 right-10 opacity-20"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        >
          <Trophy className="h-32 w-32 text-primary" />
        </motion.div>
        
        <div className="relative z-10 text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-primary/30 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-600 p-4 rounded-full">
                <Rocket className="h-12 w-12 text-white" />
              </div>
            </div>
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
            >
              Desafio das 52 Semanas 🚀
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Transforme pequenos hábitos em grandes conquistas! Poupe consistentemente e construa o futuro financeiro que você sempre sonhou.
            </motion.p>
          </div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            {[
              { icon: Target, label: "Disciplina", color: "from-blue-500 to-cyan-500" },
              { icon: TrendingUp, label: "Consistência", color: "from-purple-500 to-pink-500" },
              { icon: Trophy, label: "Sucesso", color: "from-orange-500 to-yellow-500" }
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color}`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-bold text-lg">{item.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Conteúdo Principal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        {activeChallenge ? (
          <ChallengeProgress challenge={activeChallenge} />
        ) : (
          <SetupChallenge />
        )}
      </motion.div>

      {/* Dicas e Motivação */}
      {!activeChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Sparkles className="h-8 w-8 text-primary" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">Por que fazer o Desafio?</h3>
                <p className="text-muted-foreground">Pequenas ações consistentes levam a grandes resultados!</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {[
                  {
                    title: "Construa o Hábito",
                    description: "Começar com valores pequenos torna o processo sustentável e prazeroso.",
                    icon: "🎯"
                  },
                  {
                    title: "Veja Seu Progresso",
                    description: "Acompanhe semana a semana e sinta a motivação crescer a cada conquista.",
                    icon: "📈"
                  },
                  {
                    title: "Alcance Liberdade",
                    description: "No final de 52 semanas, você terá construído uma reserva financeira sólida.",
                    icon: "💎"
                  }
                ].map((tip, index) => (
                  <motion.div
                    key={tip.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.15 }}
                    className="bg-background/60 rounded-xl p-6 space-y-3 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="text-4xl mb-2">{tip.icon}</div>
                    <h4 className="font-bold text-lg">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
