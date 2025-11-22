
import { Banknote, BookOpen, Calculator, FileText, Goal, HeartHandshake, Landmark, PiggyBank, Receipt, Sparkles, Zap, type LucideIcon, Award, Activity, BrainCircuit, Rocket, Gem } from 'lucide-react';
import { PayoffSimulator } from '@/components/education/PayoffSimulator';
import { InterestCalculator } from '@/components/education/InterestCalculator';
import type { Debt, Goal as GoalType, Transaction, EducationTrack, Mission } from './types';


export const journeyLevels = [
  { level: 'Iniciante', icon: Award, colorClass: 'text-red-500' },
  { level: 'Curioso(a)', icon: Activity, colorClass: 'text-orange-500' },
  { level: 'Estudioso(a)', icon: BrainCircuit, colorClass: 'text-yellow-500' },
  { level: 'Entendido(a)', icon: Rocket, colorClass: 'text-sky-500' },
  { level: 'Expert', icon: Gem, colorClass: 'text-emerald-500' },
];

export const calculateScore = (income: number, expenses: number, debts: Debt[], goals: GoalType[], transactions: Transaction[]) => {
    let score = 0;
    let maxScore = 0;

    const expenseToIncomeRatio = income > 0 ? expenses / income : 1;
    const mission1 = {
      id: 'm1',
      description: `Manter despesas abaixo de 80% da renda (${(expenseToIncomeRatio * 100).toFixed(0)}%)`,
      isCompleted: expenseToIncomeRatio < 0.8,
      points: 30,
    };
    maxScore += mission1.points;
    if (mission1.isCompleted) score += mission1.points;

    const mission2 = {
      id: 'm2',
      description: 'Definir pelo menos uma meta de economia',
      isCompleted: goals.length > 0,
      points: 15,
    };
    maxScore += mission2.points;
    if (mission2.isCompleted) score += mission2.points;

    const hasGoalWithProgress = goals.some((goal) => {
      const target = goal.targetAmount || 0;
      if (target <= 0) return false;
      const current = goal.currentAmount || 0;
      return current / target >= 0.5;
    });
    const mission2b = {
      id: 'm2b',
      description: 'Ter pelo menos uma meta com mais de 50% de progresso',
      isCompleted: hasGoalWithProgress,
      points: 10,
    };
    maxScore += mission2b.points;
    if (mission2b.isCompleted) score += mission2b.points;
    
    const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaidAmount = debts.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    
    const mission3 = {
      id: 'm3',
      description: `Pagar mais de 50% do total de dívidas`,
      isCompleted: totalDebtAmount > 0 && (totalPaidAmount / totalDebtAmount) > 0.5,
      points: 25,
    };
     if (totalDebtAmount > 0) {
        maxScore += mission3.points;
        if (mission3.isCompleted) score += mission3.points;
    }


    const mission4 = {
        id: 'm4',
        description: `Registrar pelo menos 5 despesas este mês (${transactions.length} registradas)`,
        isCompleted: transactions.length >= 5,
        points: 15,
    };
    maxScore += mission4.points;
    if(mission4.isCompleted) score += mission4.points;

    const savings = income - expenses;
    const mission5 = {
        id: 'm5',
        description: `Ter um balanço mensal positivo (economizar dinheiro)`,
        isCompleted: savings > 0,
        points: 10,
    }
    maxScore += mission5.points;
    if(mission5.isCompleted) score += mission5.points;

    const hasContributions = goals.some((goal) => Array.isArray((goal as any).contributions) && (goal as any).contributions.length > 0);
    const mission6 = {
      id: 'm6',
      description: 'Registrar pelo menos um aporte em alguma meta',
      isCompleted: hasContributions,
      points: 10,
    };
    if (goals.length > 0) {
      maxScore += mission6.points;
      if (mission6.isCompleted) score += mission6.points;
    }


    const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const missions: Mission[] = [mission1, mission2, mission2b, mission3, mission4, mission5, mission6].filter(m => {
        if (m.id === 'm3' && totalDebtAmount === 0) return false;
        if (m.id === 'm6' && goals.length === 0) return false;
        return true;
    });


    return { score: finalScore, missions };
};

export const educationTracks: EducationTrack[] = [
  {
    slug: 'financial-diagnosis',
    title: 'A Verdadeira Foto da Vida Financeira',
    description: 'Um módulo gentil para você olhar sua situação financeira sem medo, entendendo que o importante não é onde você está, mas sim dar o próximo passo.',
    icon: Activity,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800/50',
    content: {
      introduction: 'Muitos evitam olhar para as próprias finanças por medo ou vergonha. Esta trilha é um convite para tirar essa foto sem julgamentos. Clareza é o primeiro passo para a mudança.',
      psychology: {
        title: 'Entendendo sua Mente',
        points: [
          'Dinheiro é 80% comportamento. Foco em você.',
          'Não existe "certo" ou "errado", apenas o seu próximo passo.',
          'Culpa paralisa. Clareza e contexto te colocam em movimento.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências Práticas',
        experiences: [
          {
            title: 'Reconte a História das Dívidas',
            description: 'Para cada dívida, pense: por que ela surgiu? Como se sentiu? Isso transforma números em narrativas e te dá poder.'
          },
          {
            title: 'O Mapa Emocional do Dinheiro',
            description: 'Ao olhar suas finanças, o que surge? Anote as emoções. Este mapa será sua bússola.'
          }
        ]
      },
      microHabits: {
        title: 'Micro-hábitos para Começar',
        habits: [
          'Olhar o saldo da conta principal 1x por dia, sem julgamento.',
          'Registrar UM gasto do seu dia. O objetivo é consistência, não perfeição.',
          'Escolher e executar uma pequena tarefa financeira (ex: achar a última fatura de um cartão).'
        ]
      },
      narrative: {
        title: 'A Bússola na Névoa',
        description: 'Sua vida financeira pode parecer uma névoa. Cada registro que você faz a dissipa. Ao final, uma bússola aparece. O caminho ainda não foi percorrido, mas agora você sabe para onde ir.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual o principal objetivo desta primeira trilha?',
                options: ['Pagar todas as dívidas imediatamente', 'Obter clareza sobre a situação atual sem culpa', 'Aprender a investir na bolsa'],
                correctAnswer: 'Obter clareza sobre a situação atual sem culpa'
            },
            {
                question: 'Por que é importante entender a "história" de uma dívida?',
                options: ['Para encontrar culpados', 'Para entender os padrões de comportamento que a geraram', 'Apenas para ter um registro formal'],
                correctAnswer: 'Para entender os padrões de comportamento que a geraram'
            }
        ]
      }
    },
  },
  {
    slug: 'credit-card',
    title: 'Domando a Criatura dos Juros',
    description: 'Transforme sua relação com o cartão de crédito. De inimigo silencioso a uma ferramenta sob seu controle.',
    icon: Banknote,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    content: {
      introduction: 'O cartão de crédito pode ser uma armadilha. Ele virou um personagem na sua vida. Nesta trilha, você vai parar de lutar e aprender a domá-lo.',
      psychology: {
        title: 'O Cartão e seu Cérebro',
        points: [
          'A ilusão do "dinheiro infinito": o plástico nos desconecta da dor de pagar.',
          'Limite vira renda: psicologicamente, tendemos a incorporar o limite do cartão como parte do nosso salário.',
          'A tirania das "parcelinhas": compras pequenas ativam a recompensa do cérebro sem o impacto imediato da despesa total.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências para Quebrar a Fantasia',
        experiences: [
          {
            title: 'Viagem no Tempo dos Juros',
            description: 'Veja uma simulação de como sua fatura atual se parecerá em 3, 6 e 12 meses se pagar apenas o mínimo.'
          },
          {
            title: 'O Memorial dos Juros Pagos',
            description: 'Use nossa calculadora para estimar quanto você já pagou de juros do rotativo. Ver o número totaliza o custo invisível.'
          },
        ]
      },
      microHabits: {
        title: 'Micro-hábitos para o Controle',
        habits: [
          'Instituir o "Dia Sem Cartão": um dia da semana onde você se desafia a não usar o cartão.',
          'Pagar o mínimo nunca mais. O app vai te explicar por quê.',
          'Pagar a fatura total sempre que possível.'
        ]
      },
      narrative: {
        title: 'De Monstro a Mascote',
        description: 'Os juros são um monstro que cresce no escuro. Cada tarefa cumprida o enfraquece. Ao final, ele se transforma em um "pet" dócil, que você carrega, mas quem manda é você.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Psicologicamente, por que é mais fácil gastar com o cartão de crédito?',
                options: ['Porque é mais rápido', 'Porque nos desconecta da sensação de perda financeira real', 'Porque o limite é sempre alto'],
                correctAnswer: 'Porque nos desconecta da sensação de perda financeira real'
            },
            {
                question: 'O que o micro-hábito "Dia Sem Cartão" busca treinar?',
                options: ['Sua capacidade de economizar', 'Sua criatividade para outras formas de pagamento', 'Sua consciência sobre a dependência do cartão'],
                correctAnswer: 'Sua consciência sobre a dependência do cartão'
            }
        ]
      },
      tool: InterestCalculator,
    },
  },
   {
    slug: 'personal-debts',
    title: 'Dívidas com Pessoas: Reconstruindo Pontes',
    description: 'Aprenda a lidar com o peso de dever a amigos ou familiares, quebrando a paralisia da vergonha com comunicação e planejamento.',
    icon: HeartHandshake,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800/50',
    content: {
      introduction: 'Dever dinheiro para quem amamos é pesado. A vergonha e o medo da decepção paralisam. Esta trilha é sobre organizar as finanças para reconstruir relações.',
      psychology: {
        title: 'A Psicologia da Dívida Pessoal',
        points: [
          'Ameaça social: nosso cérebro interpreta a dívida como uma ameaça ao nosso lugar no "grupo", gerando estresse.',
          'O peso da decepção: o medo de decepcionar quem confiou em nós pode ser maior que o medo das consequências financeiras.',
          'O orgulho como barreira: a dificuldade em negociar vem do orgulho ferido e da dificuldade em admitir vulnerabilidade.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios de Empatia e Ação',
        experiences: [
          {
            title: 'Exercício de Desconstrução do Medo',
            description: 'Escreva: "O que eu acho que [nome da pessoa] está pensando sobre mim?". Depois, escreva uma versão mais realista e compassiva.'
          },
          {
            title: 'Guia de Conversa Empática',
            description: 'Use nosso passo a passo para iniciar a conversa, focando em reconhecimento, responsabilidade e plano, sem desculpas.'
          },
        ]
      },
      microHabits: {
        title: 'Pequenos Passos para Reconstruir a Confiança',
        habits: [
          'Fazer um pagamento simbólico (até R$10 contam) para mostrar movimento.',
          'Enviar uma atualização proativa a cada marco atingido.',
          'Registrar suas emoções antes e depois de cada contato ou pagamento, para ver sua evolução.'
        ]
      },
      narrative: {
        title: 'A Ponte Quebrada',
        description: 'A dívida é uma ponte quebrada. Cada pagamento e cada conversa honesta é uma nova tábua na reconstrução. Ao final, a ponte estará mais forte, pois foi testada e reforçada pela honestidade.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual o maior obstáculo para resolver uma dívida com uma pessoa próxima?',
                options: ['O valor da dívida', 'A vergonha e o medo de decepcionar, que paralisam a ação', 'A falta de um contrato formal'],
                correctAnswer: 'A vergonha e o medo de decepcionar, que paralisam a ação'
            },
            {
                question: 'Ao conversar com a pessoa para quem você deve, qual deve ser o foco principal?',
                options: ['Dar desculpas sobre por que você ainda não pagou', 'Apresentar um plano de ação concreto, mostrando responsabilidade', 'Esperar que a pessoa esqueça da dívida'],
                correctAnswer: 'Apresentar um plano de ação concreto, mostrando responsabilidade'
            }
        ]
      },
    },
  },
  {
    slug: 'financing',
    title: 'Financiamentos: Construindo o Futuro',
    description: 'Entenda como funcionam os juros de longo prazo e aprenda a técnica da amortização para quitar seu sonho mais rápido e economizar milhares.',
    icon: Landmark,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800/50',
    content: {
      introduction: 'Financiar um carro ou uma casa é um compromisso de anos. A sensação de estar "preso" pode ser desmotivadora. Esta trilha vai te dar as ferramentas para acelerar a construção do seu futuro.',
      psychology: {
        title: 'A Psicologia do Longo Prazo',
        points: [
          'A "eternidade" da dívida: prazos longos fazem nosso cérebro focar só na parcela mensal, perdendo a noção do custo total.',
          'Desmotivação pelos juros: ver que a maior parte da parcela paga juros e não a dívida é frustrante.',
          'A barreira da antecipação: a ideia de "pagar a mais" parece impossível, bloqueando a busca por pequenas otimizações.'
        ]
      },
      practicalExperiences: {
        title: 'Engenharia Financeira na Prática',
        experiences: [
          {
            title: 'Anatomia da Parcela',
            description: 'Veja um gráfico que mostra, para sua próxima parcela, quanto é juros e quanto é amortização (o que de fato reduz sua dívida).'
          },
          {
            title: 'Simulador de Amortização',
            description: 'Use nossa ferramenta para ver o impacto real de antecipar parcelas e quanto você pode economizar.'
          },
        ]
      },
      microHabits: {
        title: 'Pequenos Hábitos, Grande Impacto',
        habits: [
          'Criar um "cofrinho da amortização" com pequenos valores diários para antecipar no fim do mês.',
          'Revisar as condições do seu contrato uma vez por ano para verificar taxas e possibilidade de portabilidade.',
          'Ativar um alerta para lembrar da data de vencimento da parcela, evitando multas.'
        ]
      },
      narrative: {
        title: 'Erguendo o Prédio',
        description: 'Seu financiamento é um prédio em construção. Cada parcela normal é um tijolo. Cada amortização é um andar inteiro que sobe de uma vez. A cada andar extra, você chega mais perto da cobertura, de onde verá o futuro que construiu.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
              question: 'Amortizar usando um dinheiro extra geralmente economiza mais juros quando você escolhe...',
              options: ['Reduzir o valor das parcelas futuras', 'Reduzir o prazo do financiamento', 'Investir o dinheiro extra em outro lugar'],
              correctAnswer: 'Reduzir o prazo do financiamento'
            },
            {
              question: 'Por que a sensação de que um financiamento é "eterno" é perigosa?',
              options: ['Porque desmotiva a busca por formas de acelerar a quitação', 'Porque o contrato pode expirar', 'Porque os juros diminuem com o tempo'],
              correctAnswer: 'Porque desmotiva a busca por formas de acelerar a quitação'
            }
        ]
      },
      tool: PayoffSimulator,
    },
  },
  {
    slug: 'bank-debts',
    title: 'Cheque Especial: Saindo do Labirinto',
    description: 'Entenda por que o cheque especial parece um amigo, mas age como um inimigo caro. Esta trilha te dá o mapa para sair desse labirinto.',
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    content: {
      introduction: 'O cheque especial é vendido como conveniência. Na prática, é uma das dívidas mais tóxicas. Esta trilha é sua guia de fuga.',
      psychology: {
        title: 'A Armadilha do Alívio Imediato',
        points: [
          'Alívio rápido, prisão duradoura: o acesso fácil gera alívio momentâneo, mas os juros altos criam um problema maior.',
          'A intimidação bancária: a linguagem complexa e a posição de "autoridade" do banco nos impedem de negociar.',
          'Dependência psicológica: o cérebro se acostuma com o "dinheiro extra", e a ideia de viver sem ele gera ansiedade.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências para Iluminar o Custo Real',
        experiences: [
          {
            title: 'A Calculadora da Verdade',
            description: 'Simule quanto você paga de juros ao usar R$ 500 do seu cheque especial por 15 dias. Ver o custo real é um choque.'
          },
          {
            title: 'Diálogo com o Gerente (Simulado)',
            description: 'Use nosso guia para um diálogo simulado, mostrando o que perguntar para trocar a dívida cara por uma mais barata.'
          },
        ]
      },
      microHabits: {
        title: 'Pequenos Passos para a Liberdade',
        habits: [
          'A meta de "zerar o especial": se organize para que sua conta fique positiva pelo menos um dia no mês.',
          'Criar uma "mini-reserva anticrise" de R$ 50 ou R$ 100.',
          'Definir uma meta de comportamento, como "ficar 10 dias seguidos sem usar o limite".'
        ]
      },
      narrative: {
        title: 'O Labirinto de Vidro',
        description: 'O cheque especial é um labirinto com paredes de vidro. Você vê a saída, mas bate em uma parede invisível de juros. Cada micro-hábito ilumina o caminho. A "mini-reserva" é o fio que te guia para fora.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual a principal razão psicológica que torna o cheque especial tão perigoso?',
                options: ['O alívio rápido que ele oferece, criando um ciclo de dependência', 'O fato de ser oferecido por grandes bancos', 'A dificuldade de cancelar o serviço'],
                correctAnswer: 'O alívio rápido que ele oferece, criando um ciclo de dependência'
            },
            {
                question: 'Se você está preso no cheque especial, qual é a primeira ação recomendada?',
                options: ['Esperar por um aumento de salário', 'Tentar negociar com o banco para trocar essa dívida cara por uma mais barata', 'Usar o rotativo do cartão de crédito para cobrir o saldo'],
                correctAnswer: 'Tentar negociar com o banco para trocar essa dívida cara por uma mais barata'
            }
        ]
      },
    },
  },
  {
    slug: 'organization-skills',
    title: 'Organização Financeira: Arrumando a Casa',
    description: 'Aprenda a transformar o caos financeiro em clareza com um método simples de 3 minutos por dia.',
    icon: Receipt,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800/50',
    content: {
      introduction: 'A desorganização financeira gera ansiedade, e a ansiedade impede a ação. Vamos arrumar essa casa juntos, com pequenas arrumações diárias que trazem paz e controle.',
      psychology: {
        title: 'A Mente Organizada',
        points: [
          'Do caos à clareza: a ansiedade muitas vezes vem da falta de visibilidade. Organizar gera controle.',
          'O poder das pequenas vitórias: um hábito nasce da repetição de ações leves e recompensadoras.',
          'Categorizar é entender: ao dar nome aos seus gastos, você entende os gatilhos emocionais por trás deles.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios Práticos de Organização',
        experiences: [
          {
            title: 'Desafio dos 7 Dias de Clareza',
            description: 'Durante uma semana, comprometa-se a registrar todos os seus gastos. Ao final, veja o relatório e se surpreenda.'
          },
          {
            title: 'A Caça às Assinaturas Fantasmas',
            description: 'Tire 15 minutos para listar todas as suas assinaturas. O app te ajudará a identificar e sugerir o cancelamento das que não usa.'
          },
        ]
      },
      microHabits: {
        title: 'A Rotina de 3 Minutos',
        habits: [
          'Dedicar 3 minutos por dia para abrir o app e registrar os gastos.',
          'Uma vez por semana, usar 5 minutos para categorizar os gastos não planejados.',
          'No início de cada mês, listar suas 3 principais metas financeiras.'
        ]
      },
      narrative: {
        title: 'Arrumando os Cômodos da Mente',
        description: 'Sua vida financeira é como uma casa. A cozinha são os gastos diários. A sala são as contas fixas. O quarto são seus sonhos. O cofre é sua reserva. Conforme você organiza, cada cômodo se ilumina.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual o principal benefício de organizar as finanças, mesmo que de forma simples?',
                options: ['Ficar rico rapidamente', 'Gerar uma sensação de controle e reduzir a ansiedade', 'Poder gastar mais sem culpa'],
                correctAnswer: 'Gerar uma sensação de controle e reduzir a ansiedade'
            },
            {
                question: 'Como um hábito financeiro sólido é construído?',
                options: ['Com um grande esforço inicial de organização', 'Através da repetição de ações pequenas e leves', 'Contratando um consultor financeiro'],
                correctAnswer: 'Através da repetição de ações pequenas e leves'
            }
        ]
      },
    },
  },
  {
    slug: 'healthy-financial-life',
    title: 'A Conquista: Rumo à Vida Financeira Saudável',
    description: 'Você organizou o presente, agora é hora de construir o futuro. Esta trilha é sobre manutenção e crescimento.',
    icon: Sparkles,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800/50',
    content: {
      introduction: 'Sair das dívidas e organizar as contas é uma vitória. Agora começa a fase mais recompensadora: a de construir ativamente a vida que você deseja.',
      psychology: {
        title: 'A Mentalidade da Prosperidade',
        points: [
          'Visão de futuro: prosperidade é sobre ter clareza do que você quer que o dinheiro construa para você.',
          'Metas emocionais: "juntar R$ 10.000 para a viagem em família" tem alma e te mantém motivado.',
          'Consistência suave: a estabilidade vem da consistência de bons hábitos, não de picos de esforço.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios para Construir o Futuro',
        experiences: [
          {
            title: 'Crie Metas de Vida',
            description: 'Use a seção "Reservas" não só para emergências, mas para criar metas com nome e sobrenome.'
          },
          {
            title: 'Simule sua Fortaleza Financeira',
            description: 'Qual seu custo de vida mensal? Simule quanto precisaria para uma reserva de emergência de 6 meses e crie essa meta.'
          },
        ]
      },
      microHabits: {
        title: 'Hábitos de Manutenção e Crescimento',
        habits: [
          'Revisar suas metas uma vez por mês, ajustando valores ou criando novas.',
          'Pague-se primeiro: ao receber, a primeira "conta" a pagar é o aporte para suas metas.',
          'Celebrar as pequenas vitórias: completou 10% de uma meta? Se dê um pequeno agrado.'
        ]
      },
      narrative: {
        title: 'O Horizonte Aberto',
        description: 'Se antes você estava em uma névoa, agora chegou a um campo aberto com um horizonte vasto. Cada meta é um destino que você pode escolher. Sua jornada mudou de fase: de sobrevivência para construção.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual a diferença entre uma meta numérica e uma meta emocional?',
                options: ['Não há diferença', 'Uma meta emocional conecta o valor financeiro a um desejo de vida, aumentando a motivação', 'Metas emocionais são apenas para viagens'],
                correctAnswer: 'Uma meta emocional conecta o valor financeiro a um desejo de vida, aumentando a motivação'
            },
            {
                question: 'O que significa o hábito "Pague-se primeiro"?',
                options: ['Gastar com você antes de pagar as contas', 'Separar o dinheiro para suas metas assim que recebe', 'Sempre deixar para guardar o que sobra no fim do mês'],
                correctAnswer: 'Separar o dinheiro para suas metas assim que recebe'
            }
        ]
      },
    },
  },
];
