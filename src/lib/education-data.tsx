
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
    maxScore += mission6.points;
    if (mission6.isCompleted) score += mission6.points;

    const finalScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const missions: Mission[] = [mission1, mission2, mission2b, mission3, mission4, mission5, mission6];

    return { score: finalScore, missions };
};

export const educationTracks: EducationTrack[] = [
  {
    slug: 'financial-diagnosis',
    title: 'A Verdadeira Foto da Vida Financeira',
    description: 'Um módulo gentil para você olhar sua situação financeira sem medo ou culpa, entendendo que o importante não é onde você está, mas sim dar o próximo passo.',
    icon: Activity,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800/50',
    content: {
      introduction: 'A maioria das pessoas evita olhar para a própria vida financeira por medo, vergonha ou por não saber por onde começar. Esta trilha é um convite para tirar essa foto sem julgamentos. A clareza é o primeiro passo para a mudança.',
      psychology: {
        title: 'Entendendo a sua mente',
        points: [
          'Dinheiro é 80% comportamento, 20% matemática. Vamos focar no que mais importa: você.',
          'Não existe "certo" ou "errado". Existe o seu contexto e o seu próximo passo. A jornada é sua.',
          'Culpa e vergonha paralisam. Clareza e contexto te colocam em movimento.'
        ]
      },
      practicalExperiences: {
        title: 'Mão na Massa: Desvendando sua História',
        experiences: [
          {
            title: 'Reconte a história de suas dívidas',
            description: 'Para cada dívida registrada, pense: por que ela surgiu? Como você se sentiu ao contraí-la? O que tentou fazer? Isso transforma números em narrativas e te dá poder sobre elas.'
          },
          {
            title: 'O Mapa Emocional do Dinheiro',
            description: 'Ao olhar para suas finanças, que emoções surgem? Vergonha, pressão, confusão, tristeza? Anote. Este mapa será a bússola para as próximas trilhas.'
          }
        ]
      },
      microHabits: {
        title: 'Micro-hábitos para Começar',
        habits: [
          'Olhar o saldo da sua conta principal uma vez por dia, sem julgamento, apenas para criar o hábito.',
          'Registrar UM gasto do seu dia. Apenas um. O objetivo é a consistência, não a perfeição.',
          'Escolher uma pequena tarefa financeira e executá-la: encontrar a última fatura de um cartão, separar os boletos do mês, etc.'
        ]
      },
      narrative: {
        title: 'A Bússola na Névoa',
        description: 'Sua vida financeira pode parecer uma grande névoa. Cada resposta e cada registro que você faz aqui funciona como um vento que dissipa essa névoa. Ao final, uma bússola aparece. O caminho ainda não foi percorrido, mas agora você sabe que ele existe e qual é o norte.'
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
    description: 'Transforme sua relação com o cartão de crédito. De inimigo silencioso a uma ferramenta sob seu controle, entendendo a psicologia por trás do seu uso e os custos invisíveis.',
    icon: Banknote,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    content: {
      introduction: 'O cartão de crédito é uma das maiores invenções financeiras e uma das maiores armadilhas. Ele se tornou um personagem na sua vida. Nesta trilha, você vai parar de lutar com ele e aprender a domá-lo.',
      psychology: {
        title: 'O Cartão e seu Cérebro',
        points: [
          'A ilusão do "dinheiro infinito": o plástico nos desconecta da dor de pagar. Nosso cérebro não sente a perda da mesma forma que com dinheiro físico.',
          'Limite vira renda: psicologicamente, tendemos a incorporar o limite do cartão como parte do nosso salário, o que leva a gastos excessivos.',
          'A tirania das "parcelinhas": compras pequenas ativam o sistema de recompensa do cérebro (dopamina) sem o impacto imediato da despesa total.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências para Quebrar a Fantasia',
        experiences: [
          {
            title: 'Viagem no Tempo dos Juros',
            description: 'Veja uma simulação de como sua fatura atual se parecerá em 3, 6 e 12 meses se você pagar apenas o mínimo. Uma olhada na sua "realidade alternativa" indesejada.'
          },
          {
            title: 'O Memorial dos Juros Pagos',
            description: 'Use nossa calculadora para estimar quanto você já pagou de juros do rotativo na sua vida. Ver o número totaliza o custo invisível.'
          },
        ]
      },
      microHabits: {
        title: 'Micro-hábitos para o Controle',
        habits: [
          'Instituir o "Dia Sem Cartão": um dia da semana onde você se desafia a não usar o cartão para nada.',
          'Ativar o "Alerta de Tentação": sempre que registrar um gasto que considera emocional (ex: delivery por impulso), marque-o. O app te mostrará o padrão no fim do mês.',
          'Nunca pagar o mínimo: o app irá te lembrar disso sempre, explicando que é a pior decisão financeira que você pode tomar.'
        ]
      },
      narrative: {
        title: 'De Monstro a Mascote',
        description: 'No início, os juros são um monstro que cresce no escuro, se alimentando do seu dinheiro. Cada tarefa que você cumpre nesta trilha (como quitar uma pequena parte ou passar um dia sem usá-lo) encolhe e enfraquece a criatura. Ao final, ela se transforma em um "pet" dócil e pequeno, que você carrega, mas quem manda é você.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Psicologicamente, por que é mais fácil gastar com o cartão de crédito do que com dinheiro vivo?',
                options: ['Porque o cartão é mais rápido', 'Porque o plástico nos desconecta da sensação de perda financeira real', 'Porque o limite é sempre alto'],
                correctAnswer: 'Porque o plástico nos desconecta da sensação de perda financeira real'
            },
            {
                question: 'O que o micro-hábito "Dia Sem Cartão" busca treinar?',
                options: ['Sua capacidade de economizar dinheiro', 'Sua criatividade para encontrar outras formas de pagamento', 'Sua consciência sobre a dependência do cartão e a habilidade de viver sem ele'],
                correctAnswer: 'Sua consciência sobre a dependência do cartão e a habilidade de viver sem ele'
            }
        ]
      },
      tool: InterestCalculator,
    },
  },
   {
    slug: 'personal-debts',
    title: 'Dívidas com Pessoas: Reconstruindo Pontes',
    description: 'Uma trilha para lidar com o peso emocional de dever a amigos ou familiares. Aprenda a quebrar a paralisia da vergonha com comunicação, planejamento e ações que reconstroem a confiança.',
    icon: HeartHandshake,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800/50',
    content: {
      introduction: 'Dever dinheiro para quem amamos é pesado. O valor em si muitas vezes é o menor dos problemas; a vergonha, o medo da decepção e a tensão na relação são o que realmente nos paralisam. Esta trilha é sobre organizar as finanças para reconstruir relações.',
      psychology: {
        title: 'A Psicologia da Dívida Pessoal',
        points: [
          'Ameaça social: nosso cérebro interpreta uma dívida com alguém próximo como uma ameaça ao nosso lugar no "grupo", o que gera um estresse profundo.',
          'O peso da decepção: o medo de decepcionar quem confiou em nós pode ser maior do que o medo das consequências financeiras de uma dívida com o banco.',
          'O orgulho como barreira: muitas vezes, a dificuldade em negociar ou conversar vem do orgulho ferido e da dificuldade em admitir a própria vulnerabilidade.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios de Empatia e Ação',
        experiences: [
          {
            title: 'Exercício de Desconstrução do Medo',
            description: 'Escreva: "O que eu acho que [nome da pessoa] está pensando sobre mim e essa dívida?". Depois, escreva uma versão mais realista e compassiva. Isso ajuda a separar o medo da realidade.'
          },
          {
            title: 'Guia de Conversa Empática',
            description: 'O app oferece um passo a passo para iniciar a conversa, focando em reconhecimento, responsabilidade e plano, sem desculpas. Ex: "Eu sei que estou em dívida com você, isso tem me pesado, e quero te apresentar um plano para resolvermos."'
          },
          {
            title: 'Simulador de Acordo Saudável',
            description: 'Crie um plano de pagamento realista dentro do app, mesmo que com valores pequenos, para apresentar à pessoa. Ter um plano concreto muda a conversa de "problema" para "solução".'
          }
        ]
      },
      microHabits: {
        title: 'Pequenos Passos para Reconstruir a Confiança',
        habits: [
          'Fazer um pagamento simbólico (até R$10 contam) toda semana para mostrar movimento e comprometimento.',
          'Enviar uma atualização proativa a cada marco atingido ("Consegui guardar mais X para te pagar!").',
          'Registrar suas emoções no app antes e depois de cada contato ou pagamento, para ver sua evolução emocional.'
        ]
      },
      narrative: {
        title: 'A Ponte Quebrada',
        description: 'A dívida é uma ponte quebrada entre você e a outra pessoa. Cada micro-hábito cumprido e cada pagamento feito não é apenas sobre dinheiro, é sobre colocar mais uma tábua na ponte. A cada passo, a ponte fica mais sólida. No final, quando a dívida é paga, a ponte está reconstruída, muitas vezes mais forte do que antes, pois foi testada e reforçada pela honestidade.'
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
                options: ['Dar desculpas sobre por que você ainda não pagou', 'Apresentar um plano de ação concreto, mesmo que com valores pequenos, mostrando responsabilidade', 'Esperar que a pessoa esqueça da dívida'],
                correctAnswer: 'Apresentar um plano de ação concreto, mesmo que com valores pequenos, mostrando responsabilidade'
            }
        ]
      },
    },
  },
  {
    slug: 'financing',
    title: 'Financiamentos: Construindo o Futuro',
    description: 'Financiamentos parecem eternos, mas não precisam ser. Entenda como funcionam os juros de longo prazo e aprenda a técnica da amortização para quitar seu sonho mais rápido e economizar milhares.',
    icon: Landmark,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800/50',
    content: {
      introduction: 'Financiar um carro ou uma casa é assumir um compromisso de anos. A sensação de estar "preso" pode ser desmotivadora. Esta trilha vai te mostrar a engenharia por trás do seu contrato e te dar as ferramentas para acelerar a construção do seu futuro.',
      psychology: {
        title: 'A Psicologia do Longo Prazo',
        points: [
          'A "eternidade" da dívida: Quando o prazo é muito longo (20, 30 anos), nosso cérebro perde a noção do esforço e do custo total, focando apenas na parcela mensal.',
          'Desmotivação pelos juros: Ver que grande parte da sua parcela vai para juros e não para abater a dívida principal é frustrante e pode levar à inércia.',
          'A barreira da antecipação: Para quem já tem o orçamento apertado, a ideia de "pagar a mais" parece impossível, bloqueando a busca por pequenas otimizações.'
        ]
      },
      practicalExperiences: {
        title: 'Engenharia Financeira na Prática',
        experiences: [
          {
            title: 'Anatomia da Parcela',
            description: 'Veja um gráfico que mostra, para a sua próxima parcela, quanto é juros (o "aluguel" do dinheiro) e quanto é amortização (o que de fato reduz sua dívida).'
          },
          {
            title: 'Simulador de Amortização',
            description: 'Use nossa ferramenta para ver o impacto real de antecipar parcelas. Compare o cenário "pagar R$ 100 a mais por mês" vs. "não fazer nada" e veja a economia em tempo e dinheiro.'
          },
           {
            title: 'Plano de Micro-Vitórias',
            description: 'Em vez de pensar em "quitar o financiamento", crie metas menores no app, como "antecipar minha primeira parcela extra" ou "reduzir 1 mês do prazo total".'
          }
        ]
      },
      microHabits: {
        title: 'Pequenos Hábitos, Grande Impacto',
        habits: [
          'Criar um "cofrinho da amortização" e guardar R$ 2 por dia para, no fim do mês, ter um valor extra para antecipar.',
          'Revisar as condições do seu contrato uma vez por ano para verificar taxas e a possibilidade de portabilidade.',
          'Ativar um alerta para te lembrar da data de vencimento da parcela, evitando multas.'
        ]
      },
      narrative: {
        title: 'Erguendo o Prédio',
        description: 'Seu financiamento é um prédio em construção. Cada parcela normal que você paga é um tijolo na parede. Cada amortização que você faz é um andar inteiro que sobe de uma vez. No início, parece que não avança, mas a cada andar extra, você chega mais perto da cobertura, de onde terá a visão clara do futuro que construiu, livre da obra.'
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
    description: 'Entenda por que o cheque especial parece um amigo, mas age como um inimigo caro. Esta trilha te dá o mapa para sair desse labirinto e as ferramentas para nunca mais se perder nele.',
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    content: {
      introduction: 'O cheque especial é vendido como uma conveniência, um "limite extra" disponível. Na prática, é uma das dívidas mais tóxicas e difíceis de sair, criando um ciclo de dependência. Esta trilha é sua guia de fuga.',
      psychology: {
        title: 'A Armadilha do Alívio Imediato',
        points: [
          'Alívio rápido, prisão duradoura: o acesso fácil ao limite gera um alívio momentâneo da falta de dinheiro, mas os juros altos criam um problema muito maior no futuro.',
          'A intimidação bancária: a linguagem complexa e a posição de "autoridade" do banco muitas vezes nos intimidam e nos impedem de questionar ou negociar.',
          'Dependência psicológica: com o tempo, o cérebro se acostuma com aquele "dinheiro extra", e a ideia de viver sem ele gera ansiedade, mesmo sabendo que é uma dívida.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências para Iluminar o Custo Real',
        experiences: [
          {
            title: 'A Calculadora da Verdade',
            description: 'Simule quanto você paga de juros ao usar R$ 500 do seu cheque especial por 15 dias. Ver o custo real em reais, não em percentual, é um choque de realidade.'
          },
          {
            title: 'Diálogo com o Gerente (Simulado)',
            description: 'O app te guia em um diálogo simulado, mostrando o que perguntar e como responder ao seu gerente para trocar a dívida do cheque especial por uma linha de crédito mais barata.'
          },
          {
            title: 'Conheça Seus Direitos',
            description: 'Aprenda sobre táticas de renegociação e entenda o que são taxas abusivas. Conhecimento te dá poder para argumentar.'
          }
        ]
      },
      microHabits: {
        title: 'Pequenos Passos para a Liberdade',
        habits: [
          'A meta de "zerar o especial": se organize para que sua conta fique positiva pelo menos um dia no mês.',
          'Criar uma "mini-reserva anticrise" de R$ 50 ou R$ 100. É o embrião da sua futura reserva de emergência.',
          'Definir uma meta de comportamento, como "ficar 10 dias seguidos sem usar o limite do cheque especial".'
        ]
      },
      narrative: {
        title: 'O Labirinto de Vidro',
        description: 'O cheque especial é um labirinto com paredes de vidro. Você vê a saída, mas a cada passo errado, bate em uma parede invisível de juros e taxas. Cada micro-hábito cumprido ilumina uma parte do caminho correto. A "mini-reserva" é o fio de Ariadne que te guia. No final, você não apenas sai, mas quebra os vidros, entendendo como o labirinto funciona.'
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
    description: 'Aprenda a transformar o caos financeiro em clareza com um método simples de 3 minutos por dia. Esta trilha é sobre comportamento, criando hábitos leves que trazem uma sensação imediata de controle.',
    icon: Receipt,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800/50',
    content: {
      introduction: 'A desorganização financeira não é sobre números, é sobre sentimento. O caos gera ansiedade, e a ansiedade te impede de agir. Vamos arrumar essa casa juntos, não com uma faxina pesada de um dia, mas com pequenas arrumações diárias que trazem paz e controle.',
      psychology: {
        title: 'A Mente Organizada',
        points: [
          'Do caos à clareza: a ansiedade financeira muitas vezes vem da falta de visibilidade. Organizar, mesmo que pouco, gera uma sensação imediata de controle.',
          'O poder das pequenas vitórias: um hábito nasce da repetição de ações leves e recompensadoras, não de um esforço pesado e esporádico.',
          'Categorizar é entender: ao dar nome aos seus gastos (ex: "delivery por estresse"), você começa a entender os gatilhos emocionais por trás deles.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios Práticos de Organização',
        experiences: [
          {
            title: 'Desafio dos 7 Dias de Clareza',
            description: 'Durante uma semana, comprometa-se a registrar todos os seus gastos no app. Ao final, veja o relatório e se surpreenda com os padrões que irão surgir.'
          },
          {
            title: 'A Caça às Assinaturas Fantasmas',
            description: 'Tire 15 minutos para listar todas as suas assinaturas recorrentes (streaming, apps, etc.). O app te ajudará a identificar e sugerir o cancelamento daquelas que você não usa.'
          },
          {
            title: 'Exercício de Prioridades',
            description: 'Liste 3 coisas que são realmente importantes para você (ex: segurança, viajar, tempo com a família). Depois, veja seu extrato de gastos e compare se o seu dinheiro está indo para onde seu coração está.'
          }
        ]
      },
      microHabits: {
        title: 'A Rotina de 3 Minutos',
        habits: [
          'Dedicar 3 minutos por dia para abrir o app e registrar os gastos do dia.',
          'Uma vez por semana, usar 5 minutos para categorizar os gastos emocionais ou não planejados.',
          'No início de cada mês, listar no app suas 3 principais metas financeiras para aquele período.'
        ]
      },
      narrative: {
        title: 'Arrumando os Cômodos da Mente',
        description: 'Imagine sua vida financeira como uma casa. A cozinha são os gastos diários (comida, mercado). A sala são as contas fixas (aluguel, internet). O quarto são seus sonhos e metas. E o cofre é sua reserva. Conforme você organiza cada área no app, o cômodo correspondente na sua "casa mental" ganha cor e vida, saindo do escuro e do bagunçado. No final, a casa toda está iluminada e acolhedora.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual o principal benefício psicológico de organizar as finanças, mesmo que de forma simples?',
                options: ['Ficar rico rapidamente', 'Gerar uma sensação imediata de controle e reduzir a ansiedade', 'Poder gastar mais sem culpa'],
                correctAnswer: 'Gerar uma sensação imediata de controle e reduzir a ansiedade'
            },
            {
                question: 'Segundo a trilha, como um hábito financeiro sólido é construído?',
                options: ['Com um grande esforço inicial de organização que dura um fim de semana inteiro', 'Através da repetição de ações pequenas e leves, como a rotina de 3 minutos por dia', 'Contratando um consultor financeiro para fazer tudo por você'],
                correctAnswer: 'Através da repetição de ações pequenas e leves, como a rotina de 3 minutos por dia'
            }
        ]
      },
    },
  },
  {
    slug: 'healthy-financial-life',
    title: 'A Conquista: Rumo à Vida Financeira Saudável',
    description: 'Você organizou o presente, agora é hora de construir o futuro. Esta trilha é sobre manutenção e crescimento: transformar metas em realidade, construir prosperidade e fortalecer sua mentalidade.',
    icon: Sparkles,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800/50',
    content: {
      introduction: 'Sair das dívidas e organizar as contas é uma vitória imensa. Mas a jornada não termina aí. Agora começa a fase mais recompensadora: a de construir ativamente a vida que você deseja. Esta trilha é para quem está pronto para ir além da estabilidade e buscar a prosperidade.',
      psychology: {
        title: 'A Mentalidade da Prosperidade',
        points: [
          'Visão de futuro: a prosperidade não é sobre acumular dinheiro, é sobre ter clareza do que você quer que o dinheiro construa para você.',
          'Metas emocionais: uma meta como "juntar R$ 10.000" é fria. "Juntar R$ 10.000 para a viagem que vai reconectar minha família" tem alma e te mantém motivado.',
          'Consistência suave: a estabilidade financeira não vem de picos de esforço, mas da consistência de bons hábitos aplicados suavemente ao longo do tempo.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios para Construir o Futuro',
        experiences: [
          {
            title: 'Crie Metas de Vida',
            description: 'Use a seção "Reservas" do app não só para emergências, mas para criar metas com nome e sobrenome: "Viagem de Aniversário", "Entrada do Apartamento", "Curso de Programação".'
          },
          {
            title: 'Simule sua Fortaleza Financeira',
            description: 'Qual o seu custo de vida mensal? Use o app para simular quanto você precisaria para ter uma reserva de emergência de 6 meses e crie essa meta.'
          },
          {
            title: 'Exercício de Mentalidade: Quem é você no futuro?',
            description: 'Escreva uma pequena nota no app descrevendo como é sua vida daqui a 5 anos com as finanças organizadas. O que você está fazendo? Como se sente? Isso fortalece a visão.'
          }
        ]
      },
      microHabits: {
        title: 'Hábitos de Manutenção e Crescimento',
        habits: [
          'Revisar suas metas uma vez por mês, ajustando valores ou criando novas.',
          'Pague-se primeiro: ao receber seu salário, a primeira "conta" a pagar é o aporte para suas metas.',
          'Celebrar as pequenas vitórias: completou 10% de uma meta? Marque no app e se dê um pequeno agrado (que não comprometa o orçamento, claro!).'
        ]
      },
      narrative: {
        title: 'O Horizonte Aberto',
        description: 'Se antes você estava em uma névoa ou em um labirinto, agora você chegou a um campo aberto com um horizonte vasto. Cada meta que você cria é um destino diferente que você pode escolher. Seu avatar no app, antes preocupado, agora aparece mais leve, olhando para esse horizonte. A jornada não acabou, ela apenas mudou de fase: de sobrevivência para construção.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual a diferença entre uma meta numérica e uma meta emocional?',
                options: ['Não há diferença', 'Uma meta emocional conecta o valor financeiro a um desejo de vida, o que aumenta a motivação', 'Metas emocionais são apenas para viagens e lazer'],
                correctAnswer: 'Uma meta emocional conecta o valor financeiro a um desejo de vida, o que aumenta a motivação'
            },
            {
                question: 'O que significa o hábito "Pague-se primeiro"?',
                options: ['Gastar o salário com coisas para você antes de pagar as contas', 'Separar o dinheiro para suas metas e investimentos assim que recebe, antes de pagar as outras despesas', 'Sempre deixar para guardar dinheiro no fim do mês, com o que sobra'],
                correctAnswer: 'Separar o dinheiro para suas metas e investimentos assim que recebe, antes de pagar as outras despesas'
            }
        ]
      },
    },
  },
];
