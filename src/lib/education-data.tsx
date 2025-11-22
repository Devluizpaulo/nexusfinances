import { Banknote, BookOpen, Calculator, FileText, Goal, HeartHandshake, Landmark, PiggyBank, Receipt, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { PayoffSimulator } from '@/components/education/PayoffSimulator';
import { InterestCalculator } from '@/components/education/InterestCalculator';

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
    tool?: React.ComponentType;
  };
};

export const educationTracks: EducationTrack[] = [
  {
    slug: 'credit-card',
    title: 'Cartão de Crédito: A Bola de Neve',
    description: 'Entenda os juros rotativos e como sair do ciclo vicioso.',
    icon: Banknote,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    content: {
      introduction: 'O cartão de crédito pode ser um ótimo aliado, mas também um vilão perigoso. O "rotativo" acontece quando você não paga a fatura inteira e joga o restante para o próximo mês. É aí que a bola de neve começa.',
      metaphor: {
        title: 'Metáfora: O Monstro dos Juros Compostos',
        description: 'Imagine um monstrinho que come dinheiro. Se você deve R$100 e a taxa é 10%, no fim do mês ele comeu R$10. No mês seguinte, ele não come só mais R$10, mas R$11 (10% dos R$110 que você deve agora). Ele cresce e come mais a cada mês. Isso são os juros compostos do rotativo.',
      },
      actionSteps: {
        title: 'Plano de Ação para Dominar o Cartão',
        steps: [
          {
            title: '1. Pare de usar o cartão IMEDIATAMENTE',
            description: 'O primeiro passo para sair de um buraco é parar de cavar. Guarde o cartão físico e remova-o dos apps de compra.',
          },
          {
            title: '2. Troque a dívida por uma mais barata',
            description: 'Os juros do rotativo são os mais altos. Veja se consegue um empréstimo pessoal com juros menores para quitar o cartão. Use a calculadora abaixo para ver a diferença.',
          },
          {
            title: '3. NUNCA pague só o mínimo',
            description: 'O pagamento mínimo é uma armadilha. Ele mal cobre os juros e sua dívida quase não diminui. Pague o máximo que puder.',
          },
        ],
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
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    content: {
      introduction: 'Financiamentos são compromissos de longo prazo. Entender como eles funcionam pode economizar milhares de reais. A chave é a "amortização".',
      metaphor: {
        title: 'Metáfora: A Plantação de Dívidas',
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
      tool: PayoffSimulator,
    },
  },
   {
    slug: 'friends-family',
    title: 'Dívidas com Amigos e Família',
    description: 'Como lidar com empréstimos informais e preservar relações.',
    icon: HeartHandshake,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    content: {
      introduction: 'Misturar dinheiro e relações pessoais é delicado. A falta de clareza é a principal causa de problemas. A chave aqui é comunicação e formalização.',
      metaphor: {
        title: 'Metáfora: O Contrato da Confiança',
        description: 'Mesmo sem papel, um empréstimo com um ente querido é um contrato baseado na confiança. Se a confiança é quebrada, o "contrato" se rasga. Proteger essa relação é mais importante que o dinheiro.',
      },
      actionSteps: {
        title: 'Plano de Ação para Manter a Paz',
        steps: [
          {
            title: '1. Converse Abertamente',
            description: 'Não evite a pessoa. Seja honesto sobre sua situação. Diga quando e como planeja pagar, mesmo que seja aos poucos. A incerteza é pior que uma má notícia.',
          },
          {
            title: '2. Faça um Acordo (mesmo que simples)',
            description: 'Coloque no papel (ou numa mensagem) o valor, a data de pagamento e como será feito. Isso evita mal-entendidos e mostra que você leva a sério.',
          },
          {
            title: '3. Priorize este pagamento',
            description: 'Pagar de volta a um amigo ou familiar deve ser uma prioridade. Mostre que você valoriza a confiança que depositaram em você.',
          },
        ],
      },
    },
  },
  {
    slug: 'bank-debts',
    title: 'Dívidas Bancárias (Cheque Especial)',
    description: 'Estratégias para negociar e sair do cheque especial.',
    icon: PiggyBank,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    content: {
      introduction: 'O cheque especial é uma das formas mais caras de crédito. Ele foi feito para emergências curtas, não para ser uma extensão do seu salário. Sair dele é uma libertação.',
      metaphor: {
        title: 'Metáfora: A Areia Movediça Financeira',
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
    },
  },
  {
    slug: 'daily-bills',
    title: 'Contas do Dia a Dia',
    description: 'Técnicas para organizar e priorizar contas de consumo.',
    icon: Receipt,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    content: {
      introduction: 'Contas de água, luz, internet... Elas parecem pequenas, mas quando se acumulam, podem virar um grande problema, incluindo o risco de corte de serviços essenciais.',
      metaphor: {
        title: 'Metáfora: O Jogo dos Pratos Giratórios',
        description: 'Cada conta é um prato que você precisa manter girando. Se você se descuida, um deles cai (vence). Se muitos caem, o show para (cortam o serviço). O segredo é saber qual prato girar primeiro.',
      },
      actionSteps: {
        title: 'Plano de Ação para Organizar as Contas',
        steps: [
          {
            title: '1. Liste Todas as Contas e Datas',
            description: 'Pegue todas as suas contas do mês. Coloque em uma lista simples o nome da conta, o valor e a data de vencimento. Use o xô planilhas para isso!',
          },
          {
            title: '2. Priorize o Essencial',
            description: 'Se o dinheiro está curto, priorize o que não pode faltar: aluguel/moradia, luz, água. Estas são as contas que garantem sua segurança e bem-estar.',
          },
          {
            title: '3. Automatize o que Puder',
            description: 'Coloque as contas que têm valor fixo (como internet, plano de celular, assinaturas) em débito automático. Isso diminui a chance de esquecimento.',
          },
        ],
      },
    },
  },
];


export const comingSoonTools = [
    {
        icon: Zap,
        title: "Simulador de Quitação",
        description: "Veja o impacto de antecipar parcelas."
    },
    {
        icon: Calculator,
        title: "Calculadora de Juros",
        description: "Entenda o custo real de uma dívida."
    },
    {
        icon: FileText,
        title: "Scripts de Negociação",
        description: "Modelos prontos para conversar com credores."
    },
    {
        icon: Goal,
        title: "Missões Diárias",
        description: "Pequenas vitórias para criar grandes hábitos."
    }
];
