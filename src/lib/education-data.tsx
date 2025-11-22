
import { Banknote, BookOpen, Calculator, FileText, Goal, HeartHandshake, Landmark, PiggyBank, Receipt, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { PayoffSimulator } from '@/components/education/PayoffSimulator';
import { InterestCalculator } from '@/components/education/InterestCalculator';
import type { Debt, Goal as GoalType, Transaction } from './types';


export type EducationTrack = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  content: {
    introduction: string;
    diagnostic: {
      title: string;
      questions: string[];
    };
    metaphor: {
      title: string;
      description: string;
    };
    actionSteps: {
      title: string;
      steps: {
        title: string;
        description: string;
      }[];
    };
    examples: {
      scenario: string;
      consequence: string;
    }[];
    finalQuiz: {
      title: string;
      questions: {
        question: string;
        options: string[];
        correctAnswer: string;
      }[];
    };
    tool?: React.ComponentType;
  };
};

export interface Mission {
  id: string;
  description: string;
  isCompleted: boolean;
  points: number;
}

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
    const debtProgress = totalDebtAmount > 0 ? totalPaidAmount / totalDebtAmount : 1;
    const mission3 = {
      id: 'm3',
      description: `Pagar mais de 50% do total de dívidas (${(debtProgress * 100).toFixed(0)}% pago)`,
      isCompleted: debtProgress > 0.5,
      points: 25,
    };
    maxScore += mission3.points;
    if (mission3.isCompleted) score += mission3.points;

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
    slug: 'credit-card',
    title: 'Cartão de Crédito: A Bola de Neve',
    description: 'Entenda os juros rotativos e como sair do ciclo vicioso.',
    icon: Banknote,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800/50',
    content: {
      introduction: 'O cartão de crédito pode ser um ótimo aliado, mas também um vilão perigoso. O "rotativo" acontece quando você não paga a fatura inteira e joga o restante para o próximo mês. É aí que a bola de neve começa.',
      diagnostic: {
        title: 'Diagnóstico Rápido',
        questions: [
          'Você já pagou apenas o valor mínimo da fatura?',
          'Você costuma parcelar a fatura do cartão?',
          'Você usa o limite do cartão como se fosse parte do seu salário?',
          'Você não sabe exatamente qual a taxa de juros do seu cartão?',
        ]
      },
      metaphor: {
        title: 'O Monstro dos Juros Compostos',
        description: 'Imagine um monstrinho que come dinheiro. Se você deve R$100 e a taxa é 10%, no fim do mês ele comeu R$10. No mês seguinte, ele não come só mais R$10, mas R$11 (10% dos R$110 que você deve agora). Ele cresce e come mais a cada mês. Isso são os juros compostos do rotativo.',
      },
      actionSteps: {
        title: 'Plano de Ação para Dominar o Cartão',
        steps: [
          {
            title: '1. Pare de usar o cartão IMEDIATAMENTE',
            description: 'O primeiro passo para sair de um buraco é parar de cavar. Guarde o cartão físico e remova-o dos apps de compra online.',
          },
          {
            title: '2. Troque a dívida por uma mais barata',
            description: 'Os juros do rotativo são os mais altos do mercado. Veja se consegue um empréstimo pessoal com juros menores para quitar o cartão. Use a calculadora abaixo para ver a diferença.',
          },
          {
            title: '3. NUNCA pague só o mínimo',
            description: 'O pagamento mínimo é uma armadilha que alimenta o monstro dos juros. Ele mal cobre os juros e sua dívida quase não diminui. Pague o máximo que puder, sempre.',
          },
        ],
      },
      examples: [
          {
              scenario: "Exemplo 1: Maria pagou o mínimo de uma fatura de R$ 1.000.",
              consequence: "No mês seguinte, a dívida dela já era de quase R$ 1.150, mesmo sem usar mais o cartão, por causa dos juros rotativos de 15%."
          },
           {
              scenario: "Exemplo 2: João parcelou uma compra de R$ 500 em 10x 'sem juros'.",
              consequence: "Ele comprometeu R$ 50 do seu orçamento por 10 meses. Quando precisou de dinheiro para uma emergência, não tinha, pois seu orçamento já estava comprometido com parcelas."
          }
      ],
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'O que acontece quando você paga apenas o valor mínimo da fatura do cartão?',
                options: ['A dívida é congelada', 'O restante da dívida entra no rotativo, com juros muito altos', 'O banco perdoa o restante da dívida'],
                correctAnswer: 'O restante da dívida entra no rotativo, com juros muito altos'
            },
            {
                question: 'Qual é a melhor estratégia para lidar com uma dívida alta no cartão de crédito?',
                options: ['Continuar pagando o mínimo', 'Tentar negociar a dívida ou trocá-la por um empréstimo com juros menores', 'Ignorar a dívida'],
                correctAnswer: 'Tentar negociar a dívida ou trocá-la por um empréstimo com juros menores'
            }
        ]
      },
      tool: InterestCalculator
    },
  },
  {
    slug: 'financing',
    title: 'Financiamentos (Carro, Casa)',
    description: 'Aprenda sobre amortização e como antecipar parcelas.',
    icon: Landmark,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    content: {
      introduction: 'Financiamentos são compromissos de longo prazo. Entender como eles funcionam pode economizar milhares de reais. A chave é a "amortização".',
       diagnostic: {
        title: 'Diagnóstico Rápido',
        questions: [
          'Você sabe o que é "amortizar" uma dívida?',
          'Você já tentou pagar uma parcela a mais do seu financiamento?',
          'Você sabe qual sistema de amortização do seu contrato (SAC ou Price)?',
          'Você sabe qual o Custo Efetivo Total (CET) do seu financiamento?',
        ]
      },
      metaphor: {
        title: 'A Plantação de Dívidas',
        description: 'Um financiamento é como uma plantação. Cada parcela que você paga é a colheita. Parte dela paga os "juros" (o custo da terra) e parte paga o "principal" (a dívida real). Amortizar é como arrancar as ervas daninhas (o principal) direto na raiz, fazendo a plantação diminuir mais rápido.',
      },
      actionSteps: {
        title: 'Plano de Ação para Quitar Mais Rápido',
        steps: [
          {
            title: '1. Descubra seu Saldo Devedor',
            description: 'Entre em contato com o banco e pergunte qual o seu saldo devedor atual. Este é o valor que você precisa para quitar a dívida hoje.',
          },
          {
            title: '2. Amortize: Pague o Principal',
            description: 'Qualquer dinheiro extra (13º, bônus) deve ser usado para amortizar. Ao fazer isso, você pode escolher reduzir o número de parcelas ou o valor delas. Reduzir o número de parcelas quase sempre economiza mais juros.',
          },
          {
            title: '3. Use o Simulador',
            description: 'Veja na prática o poder de pagar um pouco a mais todo mês. Use a ferramenta abaixo para simular quanto tempo e dinheiro você pode economizar.',
          },
        ],
      },
      examples: [
          {
            scenario: "Exemplo: Carlos tinha um financiamento de 360 meses. Ele começou a pagar R$ 200 a mais por mês.",
            consequence: "Com essa pequena amortização mensal, ele conseguiu reduzir o tempo do financiamento em quase 10 anos e economizou dezenas de milhares de reais em juros."
          }
      ],
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
              question: 'O que é "amortizar" um financiamento?',
              options: ['Pagar apenas os juros da parcela', 'Adiantar o pagamento de parcelas futuras, abatendo do saldo devedor principal', 'Renegociar a taxa de juros'],
              correctAnswer: 'Adiantar o pagamento de parcelas futuras, abatendo do saldo devedor principal'
            },
            {
              question: 'Ao amortizar um financiamento, o que geralmente economiza mais dinheiro em juros?',
              options: ['Reduzir o valor das parcelas futuras', 'Reduzir o prazo, ou seja, o número de parcelas restantes', 'Pedir um desconto no saldo devedor'],
              correctAnswer: 'Reduzir o prazo, ou seja, o número de parcelas restantes'
            }
        ]
      },
      tool: PayoffSimulator,
    },
  },
   {
    slug: 'negotiation-scripts',
    title: 'Scripts de Negociação',
    description: 'Modelos prontos para conversar com credores e conseguir acordos.',
    icon: HeartHandshake,
    color: 'text-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800/50',
    content: {
      introduction: 'Negociar uma dívida pode ser intimidante, mas é um direito seu. Ter um roteiro em mãos te dá confiança e clareza para conseguir as melhores condições. O segredo é estar preparado.',
       diagnostic: {
        title: 'Diagnóstico Rápido',
        questions: [
          'Você já tentou negociar uma dívida antes?',
          'Você se sente ansioso só de pensar em ligar para um credor?',
          'Você sabe exatamente quanto pode pagar em um acordo?',
          'Você tem medo de dizer "não" para a primeira oferta?',
        ]
      },
      metaphor: {
        title: 'O Jogo de Cartas',
        description: 'Negociar é como um jogo de cartas. Você precisa saber quais cartas tem (sua situação financeira, quanto pode pagar) e entender as possíveis cartas do seu oponente (o credor quer receber, mesmo que seja um valor menor). Um bom roteiro é a sua carta na manga.',
      },
      actionSteps: {
        title: 'Plano de Ação para uma Boa Negociação',
        steps: [
          {
            title: '1. Conheça sua Situação',
            description: 'Antes de ligar, saiba exatamente quanto você deve e, mais importante, quanto pode pagar por mês de forma realista. Use o "xô planilhas" para ter essa clareza.',
          },
          {
            title: '2. Use o Script Base',
            description: '"Olá, meu nome é [Seu Nome] e estou ligando sobre [sua dívida]. Estou passando por um momento financeiro delicado, mas tenho total interesse em resolver minha pendência. Gostaria de saber quais são as opções de negociação que vocês podem me oferecer."',
          },
          {
            title: '3. Seja Firme, mas Educado',
            description: 'Ouça a proposta, mas não aceite a primeira oferta se ela não couber no seu bolso. Use frases como: "Agradeço a proposta, mas esse valor ainda está fora da minha realidade. O que mais podemos fazer?" ou "Com base no meu orçamento, o valor que consigo pagar é R$ X por mês. É possível chegarmos a um acordo com base nisso?"',
          },
          {
            title: '4. Formalize o Acordo',
            description: 'Após chegar a um acordo, peça para que tudo seja enviado por e-mail ou por escrito. Não faça nenhum pagamento antes de ter o acordo formalizado.',
          }
        ],
      },
       examples: [
          {
              scenario: "Exemplo: Ana devia R$ 5.000 no cheque especial. O banco ofereceu pagar em 10x de R$ 750 (total R$ 7.500).",
              consequence: 'Ela usou o script, explicou que só podia pagar R$ 450. O banco contrapropôs 12x de R$ 480 (total R$ 5.760). Ela aceitou e economizou quase R$ 2.000.'
          }
      ],
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual o primeiro passo antes de ligar para negociar uma dívida?',
                options: ['Juntar o máximo de dinheiro possível', 'Saber exatamente sua situação financeira e quanto você pode pagar', 'Pedir dinheiro emprestado'],
                correctAnswer: 'Saber exatamente sua situação financeira e quanto você pode pagar'
            },
            {
                question: 'O que você deve fazer ao receber a primeira proposta do credor?',
                options: ['Aceitar imediatamente para não perder a oportunidade', 'Analisar se ela cabe no seu orçamento e contrapropor se necessário', 'Desligar o telefone'],
                correctAnswer: 'Analisar se ela cabe no seu orçamento e contrapropor se necessário'
            }
        ]
      },
    },
  },
   {
    slug: 'daily-habits',
    title: 'Construindo Hábitos: Pequenas Vitórias',
    description: 'Use o app para criar hábitos que transformam sua vida financeira.',
    icon: Sparkles,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    borderColor: 'border-violet-200 dark:border-violet-800/50',
    content: {
      introduction: 'A saúde financeira não vem de uma grande ação, mas da soma de pequenas atitudes diárias. O "xô planilhas" foi feito para te ajudar a criar esses hábitos de forma leve e motivadora.',
       diagnostic: {
        title: 'Diagnóstico Rápido',
        questions: [
          'Você anota seus gastos todos os dias?',
          'Você sabe exatamente para onde seu dinheiro foi no mês passado?',
          'Você costuma guardar dinheiro que "sobra" sem um objetivo claro?',
          'Você se sente no controle de suas finanças?',
        ]
      },
      metaphor: {
        title: 'O Treino na Academia',
        description: 'Ir na academia uma vez não te deixa forte. Mas ir um pouco a cada dia, sim. Com as finanças é igual. Cada pequena ação, como registrar um gasto ou fazer um pequeno aporte, é um "exercício" que fortalece seu "músculo financeiro".',
      },
      actionSteps: {
        title: 'Missões para Criar Hábitos Vencedores',
        steps: [
          {
            title: 'Missão Diária: Registre Tudo',
            description: 'Tire 2 minutos no fim do dia e registre todas as suas despesas na aba "Despesas". Este é o hábito mais importante para ter clareza.',
          },
          {
            title: 'Missão Semanal: Revise o Painel',
            description: 'Uma vez por semana, abra o "Painel" e veja o resumo. Onde você mais gastou? Seu balanço está positivo? Essa revisão te mantém no controle.',
          },
          {
            title: 'Missão do Aporte: Guarde um Pouco',
            description: 'Recebeu um dinheiro extra ou economizou em algo? Vá em "Reservas", escolha uma meta e use o botão "Adicionar aporte" para guardar esse valor. Comemore cada pequena contribuição!',
          },
           {
            title: 'Missão da Dívida: Pague uma Parcela',
            description: 'Vá em "Dívidas", escolha uma e pague a próxima parcela. Marcar como "pago" no app te dá uma sensação incrível de progresso.',
          },
        ],
      },
       examples: [
          {
              scenario: "Exemplo: Lucas começou a registrar até o cafezinho.",
              consequence: 'No fim do mês, ele percebeu que gastava R$ 200 só com lanches fora de hora. No mês seguinte, reduziu pela metade e usou a economia para fazer um aporte em sua reserva de emergência.'
          }
      ],
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual o hábito mais fundamental para a organização financeira?',
                options: ['Investir na bolsa', 'Registrar todos os gastos diariamente', 'Cortar todos os luxos'],
                correctAnswer: 'Registrar todos os gastos diariamente'
            },
            {
                question: 'Qual o propósito da "Missão Semanal"?',
                options: ['Pagar todas as contas da semana', 'Revisar o painel para entender seus gastos e progresso', 'Criar um novo orçamento para a semana'],
                correctAnswer: 'Revisar o painel para entender seus gastos e progresso'
            }
        ]
      },
    },
  },
  {
    slug: 'bank-debts',
    title: 'Dívidas Bancárias (Cheque Especial)',
    description: 'Estratégias para negociar e sair do cheque especial.',
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    content: {
      introduction: 'O cheque especial é uma das formas mais caras de crédito. Ele foi feito para emergências curtas, não para ser uma extensão do seu salário. Sair dele é uma libertação.',
       diagnostic: {
        title: 'Diagnóstico Rápido',
        questions: [
          'Seu saldo bancário fica negativo com frequência?',
          'Você usa o limite do cheque especial para pagar contas do mês?',
          'Você considera o limite do cheque especial como parte da sua renda?',
          'Você já pagou juros sobre juros no cheque especial?',
        ]
      },
      metaphor: {
        title: 'A Areia Movediça Financeira',
        description: 'Usar o cheque especial é como pisar em areia movediça. Quanto mais você usa, mais fundo afunda, e os juros tornam cada vez mais difícil sair. O segredo é parar de se debater e encontrar um galho firme para se puxar.',
      },
      actionSteps: {
        title: 'Plano de Ação para Sair do Vermelho',
        steps: [
          {
            title: '1. Crie uma "Operação Saída"',
            description: 'Defina uma data para sair do cheque especial. Durante esse período, corte todos os gastos não essenciais e jogue todo dinheiro extra para cobrir o limite.',
          },
          {
            title: '2. Negocie uma Dívida Melhor',
            description: 'Converse com seu gerente. É muito provável que ele possa oferecer um empréstimo pessoal com juros muito menores para cobrir o saldo do cheque especial. Você troca uma dívida ruim por uma "menos ruim".',
          },
          {
            title: '3. Crie sua Reserva de Emergência',
            description: 'Depois de sair, o próximo passo é criar uma reserva de emergência. É ela que vai te proteger de cair na areia movediça de novo.',
          },
        ],
      },
       examples: [
          {
              scenario: "Exemplo: Julia usava R$ 800 do cheque especial todo mês.",
              consequence: 'Ela pegou um empréstimo pessoal para quitar o saldo, cancelou o limite do cheque especial com o gerente e começou a construir uma reserva de emergência. Nunca mais pagou juros abusivos.'
          }
      ],
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Para que serve o cheque especial?',
                options: ['Para complementar o salário todo mês', 'Para emergências muito curtas, de um ou dois dias', 'Para fazer compras parceladas'],
                correctAnswer: 'Para emergências muito curtas, de um ou dois dias'
            },
            {
                question: 'Qual a melhor alternativa para sair de uma dívida de cheque especial?',
                options: ['Esperar a dívida caducar', 'Tentar cobrir o saldo com o rotativo do cartão de crédito', 'Negociar um empréstimo pessoal com juros menores para quitar o saldo'],
                correctAnswer: 'Negociar um empréstimo pessoal com juros menores para quitar o saldo'
            }
        ]
      },
    },
  },
  {
    slug: 'daily-bills',
    title: 'Contas do Dia a Dia',
    description: 'Técnicas para organizar e priorizar contas de consumo.',
    icon: Receipt,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-200 dark:border-cyan-800/50',
    content: {
      introduction: 'Contas de água, luz, internet... Elas parecem pequenas, mas quando se acumulam, podem virar um grande problema, incluindo o risco de corte de serviços essenciais.',
       diagnostic: {
        title: 'Diagnóstico Rápido',
        questions: [
          'Você já teve algum serviço cortado por falta de pagamento?',
          'Você costuma pagar contas depois do vencimento e com juros?',
          'Você não tem um lugar central para ver todas as suas contas do mês?',
          'Você se sente sobrecarregado com a quantidade de boletos para pagar?',
        ]
      },
      metaphor: {
        title: 'O Jogo dos Pratos Giratórios',
        description: 'Cada conta é um prato que você precisa manter girando. Se você se descuida, um deles cai (vence). Se muitos caem, o show para (cortam o serviço). O segredo é saber qual prato girar primeiro.',
      },
      actionSteps: {
        title: 'Plano de Ação para Organizar as Contas',
        steps: [
          {
            title: '1. Liste Todas as Contas e Datas',
            description: 'Pegue todas as suas contas do mês. Registre no "xô planilhas" como despesas recorrentes e com status "pendente". Use a data de vencimento de cada uma.',
          },
          {
            title: '2. Priorize o Essencial',
            description: 'Se o dinheiro está curto, priorize o que não pode faltar: aluguel/moradia, luz, água. Estas são as contas que garantem sua segurança e bem-estar.',
          },
          {
            title: '3. Automatize o que Puder',
            description: 'Coloque as contas que têm valor fixo (como internet, plano de celular, assinaturas) em débito automático. Isso diminui a chance de esquecimento e multas.',
          },
        ],
      },
      examples: [
          {
              scenario: "Exemplo: Felipe sempre pagava a conta de internet com atraso.",
              consequence: 'Ele colocou a conta em débito automático. Além de nunca mais pagar juros, ele parou de gastar energia mental se preocupando com o vencimento.'
          }
      ],
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Se o dinheiro está curto, qual tipo de conta deve ser priorizada?',
                options: ['Assinaturas de streaming', 'Contas essenciais como aluguel, água e luz', 'Fatura do cartão de crédito'],
                correctAnswer: 'Contas essenciais como aluguel, água e luz'
            },
            {
                question: 'Qual a principal vantagem de colocar contas em débito automático?',
                options: ['Receber descontos na fatura', 'Evitar o esquecimento e o pagamento de multas por atraso', 'Aumentar seu score de crédito'],
                correctAnswer: 'Evitar o esquecimento e o pagamento de multas por atraso'
            }
        ]
      },
    },
  },
];
