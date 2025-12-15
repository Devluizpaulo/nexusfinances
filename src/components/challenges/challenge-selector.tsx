'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Sparkles, Target, Trophy, Star, Lock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type ChallengeStatus = 'available' | 'active' | 'completed' | 'locked';

function resolveChallengeStatus(
  challengeId: string,
  currentChallenge?: string,
  completedChallenges: string[] = []
): ChallengeStatus {
  if (completedChallenges.includes(challengeId)) return 'completed';
  if (currentChallenge === challengeId) return 'active';

  const order = ['easy', 'medium', 'expert'];
  const index = order.indexOf(challengeId);
  const prev = order[index - 1];

  if (prev && !completedChallenges.includes(prev)) return 'locked';
  return 'available';
}

interface ChallengeType {
  id: string;
  name: string;
  description: string;
  initialAmount: number;
  totalAmount: number;
  difficulty: 'easy' | 'medium' | 'expert';
  icon: React.ReactNode;
  color: string;
  locked?: boolean;
  completed?: boolean;
}

interface ChallengeSelectorProps {
  onChallengeSelect: (challengeType: ChallengeType) => void;
  currentChallenge?: string;
  completedChallenges?: string[];
}

const challengeTypes: ChallengeType[] = [
  {
    id: 'easy',
    name: 'Seu Primeiro Passo para a Liberdade Financeira',
    description: 'Perfeito para quem está começando! Com apenas R$1 por semana, você dará o primeiro passo para construir um futuro financeiro sólido. Sinta a satisfação de ver seu dinheiro crescer semana após semana. Este é o seu momento de provar para si mesmo que você consegue!',
    initialAmount: 1,
    totalAmount: 1378,
    difficulty: 'easy',
    icon: <Star className="h-6 w-6" />,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'medium',
    name: 'Acelere Sua Jornada Financeira',
    description: 'Pronto para um desafio maior? Comece com R$5 e veja sua poupança decolar! Este desafio intermediário foi criado para quem já deu o primeiro passo e agora busca resultados mais expressivos. Transforme sua disciplina em um patrimônio impressionante!',
    initialAmount: 5,
    totalAmount: 6890,
    difficulty: 'medium',
    icon: <Target className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'expert',
    name: 'Maestria Financeira em 52 Semanas',
    description: 'Você está pronto para se tornar um mestre da poupança? Com R$10 iniciais, este desafio expert foi projetado para os mais determinados. Ao final, você não apenas terá acumulado R$13.780, mas terá construído o hábito financeiro que mudará sua vida para sempre!',
    initialAmount: 10,
    totalAmount: 13780,
    difficulty: 'expert',
    icon: <Trophy className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
  },
];

export function ChallengeSelector({ onChallengeSelect, currentChallenge, completedChallenges = [] }: ChallengeSelectorProps) {
  const getChallengeStatus = (challengeId: string) => {
    if (completedChallenges.includes(challengeId)) return 'completed';
    if (currentChallenge === challengeId) return 'active';
    
    // Bloquear desafios seguintes se o primeiro não foi concluído
    if (challengeId === 'easy') {
      return currentChallenge && !completedChallenges.includes(currentChallenge) ? 'locked' : 'available';
    }
    if (challengeId === 'medium') {
      return (!completedChallenges.includes('easy') && currentChallenge !== 'medium') ? 'locked' : 'available';
    }
    if (challengeId === 'expert') {
      return (!completedChallenges.includes('medium') && currentChallenge !== 'expert') ? 'locked' : 'available';
    }
    
    return 'available';
  };

  const canSelectChallenge = (challengeId: string) => {
    const status = getChallengeStatus(challengeId);
    return status === 'available';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-6">
        <h2 className="text-4xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          <Sparkles className="h-8 w-8 text-primary" />
          Desafio das 52 Semanas
        </h2>
        <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
          Transforme pequenos hábitos em grandes conquistas! Poupe consistentemente e construa o futuro financeiro que você sempre sonhou.
        </p>
        <div className="flex items-center justify-center gap-4 text-lg text-primary font-semibold px-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Disciplina
          </div>
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Consistência
          </div>
          <div className="w-1 h-5 bg-primary rounded-full"></div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Liberdade Financeira
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        {challengeTypes.map((challenge, index) => {
          const status = getChallengeStatus(challenge.id);
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';
          const isActive = status === 'active';
          const canSelect = canSelectChallenge(challenge.id);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Card className={`h-full transition-all duration-200 ${
                isActive ? 'ring-2 ring-primary shadow-lg' : 
                isLocked ? 'opacity-60 backdrop-blur-sm' : 
                isCompleted ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : 
                'hover:shadow-lg hover:scale-[1.02]'
              }`}>
                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  {isActive && (
                    <Badge className="bg-primary text-primary-foreground">
                      Ativo
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Concluído
                    </Badge>
                  )}
                  {isLocked && (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Bloqueado
                    </Badge>
                  )}
                </div>

                <CardHeader className="text-center pb-4 space-y-4">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${challenge.color} shadow-lg`}>
                    {challenge.icon}
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight">{challenge.name}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-justify px-2">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 text-center py-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-6 py-3 bg-muted/50 rounded-xl">
                      <span className="text-sm text-muted-foreground font-medium">Valor Inicial:</span>
                      <span className="font-bold text-lg">{formatCurrency(challenge.initialAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center px-6 py-3 bg-muted/50 rounded-xl">
                      <span className="text-sm text-muted-foreground font-medium">Total Final:</span>
                      <span className="font-bold text-lg text-primary">{formatCurrency(challenge.totalAmount)}</span>
                    </div>
                  </div>

                  {isCompleted && (
                    <div className="text-center py-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-1" />
                      <p className="text-sm text-green-600 font-medium">Desafio Concluído!</p>
                    </div>
                  )}

                  {isLocked && (
                    <div className="text-center py-2">
                      <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">Conclua o desafio atual primeiro</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-6 pb-6">
                  <Button 
                    className="w-full py-3 text-base font-semibold" 
                    disabled={!canSelect}
                    onClick={() => onChallengeSelect(challenge)}
                    variant={isActive ? "default" : isCompleted ? "outline" : "default"}
                  >
                    {isActive ? 'Continuar Desafio' : 
                     isCompleted ? 'Ver Progresso' : 
                     isLocked ? 'Indisponível' : 
                     'Iniciar Desafio'}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center space-y-6 mt-8">
        <div className="flex items-center justify-center gap-3 text-xl font-bold text-primary">
          <Trophy className="h-6 w-6" />
          Sua jornada financeira começa agora!
        </div>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto text-justify px-4 leading-relaxed">
          Dica: Complete os desafios em ordem para desbloquear os próximos níveis e construir uma base financeira sólida!
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground mt-6">
          <span className="flex items-center gap-2 font-medium">
            <Star className="h-4 w-4 text-yellow-500" />
            Disciplina
          </span>
          <span className="flex items-center gap-2 font-medium">
            <Target className="h-4 w-4 text-blue-500" />
            Consistência
          </span>
          <span className="flex items-center gap-2 font-medium">
            <Trophy className="h-4 w-4 text-purple-500" />
            Sucesso
          </span>
        </div>
      </div>
    </div>
  );
}
