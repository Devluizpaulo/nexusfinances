
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
        title: 'Entendendo sua Mente: Por que evitamos olhar?',
        points: [
          '**Dinheiro é 80% comportamento:** A forma como gastamos, poupamos ou nos endividamos tem mais a ver com nossas emoções e hábitos do que com planilhas. Entender isso tira um peso enorme, pois o foco passa a ser em você, não em fórmulas complexas.',
          '**Não existe "certo ou errado", só o "próximo passo":** A comparação com outras pessoas é paralisante. Sua jornada é única. O objetivo aqui não é julgar seu passado, mas sim iluminar o caminho para a sua próxima decisão.',
          '**Culpa paralisa, contexto liberta:** Sentir culpa por dívidas ou gastos passados nos impede de agir. Olhar para o "contexto" — o que estava acontecendo na sua vida quando aquela dívida surgiu? — gera aprendizado e nos coloca em movimento.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências Práticas: Da Teoria à Realidade',
        experiences: [
          {
            title: 'Reconte a História das suas Dívidas',
            description: 'Para cada dívida que você cadastrar, pare e pense: por que ela surgiu? Foi uma emergência, um impulso, uma necessidade? Como você se sentiu ao fazê-la? Escrever essa pequena história transforma números frios em narrativas de vida, e isso te dá poder e clareza sobre seus próprios padrões.'
          },
          {
            title: 'O Mapa Emocional do seu Dinheiro',
            description: 'Ao olhar seu extrato, sua fatura do cartão ou suas metas, quais emoções surgem? Ansiedade? Esperança? Medo? Vergonha? Anote. Criar esse "mapa emocional" ajuda a identificar quais áreas da sua vida financeira precisam de mais atenção e carinho. Ele será sua bússola.'
          }
        ]
      },
      microHabits: {
        title: 'Micro-hábitos: Pequenas Vitórias Diárias',
        habits: [
          '**Olhar o saldo da conta 1x por dia:** Sem julgamento. Apenas olhe. O objetivo é remover o medo e a surpresa, transformando o ato em algo banal e sob seu controle.',
          '**Registrar UM gasto do seu dia:** Não precisa ser tudo. Comece com um. O cafezinho, o almoço. O objetivo aqui é criar o músculo da consistência, não a perfeição.',
          '**Escolher uma pequena tarefa financeira:** Encontrar a última fatura de um cartão, separar os comprovantes da semana, pesquisar o telefone do seu gerente. Uma pequena ação quebra a inércia.'
        ]
      },
      narrative: {
        title: 'A Bússola na Névoa',
        description: 'Sua vida financeira pode parecer uma estrada coberta por uma névoa densa. Você não sabe para onde ir. Cada registro que você faz, cada pequena tarefa que completa, é como um sopro de vento que dissipa um pouco dessa névoa. Aos poucos, uma bússola surge a seus pés. O caminho ainda não foi percorrido, mas agora você sabe que ele existe e para onde aponta.'
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
      introduction: 'O cartão de crédito é como uma criatura: pode ser um parceiro útil ou um monstro que devora suas finanças. Nesta trilha, você não vai lutar contra ele. Você vai aprender a domá-lo.',
      psychology: {
        title: 'O Cartão e seu Cérebro: A Ilusão do Plástico',
        points: [
          '**A ilusão do "dinheiro infinito":** Passar um plástico não ativa os mesmos centros de dor no cérebro que entregar dinheiro vivo. Isso nos desconecta da sensação de perda e facilita gastos excessivos.',
          '**"Meu limite é minha renda":** Psicologicamente, é comum incorporarmos o limite do cartão como uma extensão do nosso salário, o que é uma armadilha perigosa para o endividamento.',
          '**A tirania das "parcelinhas":** O cérebro adora a recompensa imediata de uma compra. Parcelar em valores pequenos minimiza a percepção do custo total, incentivando mais compras do que o necessário.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências para Quebrar a Fantasia',
        experiences: [
          {
            title: 'Viagem no Tempo dos Juros',
            description: 'Use nossa calculadora para ver uma simulação de como sua fatura atual se parecerá em 3, 6 e 12 meses se você pagar apenas o mínimo. Ver essa "realidade alternativa" é um poderoso choque de realidade.'
          },
          {
            title: 'O Memorial dos Juros Pagos',
            description: 'Estime, mesmo que de forma aproximada, quanto você já pagou de juros do rotativo na sua vida. Ver o número total materializa o custo invisível e fortalece sua decisão de mudar.'
          },
        ]
      },
      microHabits: {
        title: 'Micro-hábitos para o Controle Total',
        habits: [
          '**Instituir o "Dia Sem Cartão":** Um dia fixo da semana (ex: toda quarta-feira) onde você se desafia a não usar o cartão para nada. Isso treina sua consciência sobre a dependência dele.',
          '**Pagar o mínimo nunca mais:** Este app não te dará a opção de calcular o pagamento mínimo. A regra é clara: o mínimo é uma armadilha. A meta é sempre o pagamento total.',
          '**Pagar a fatura assim que ela fecha:** Em vez de esperar o vencimento, pague a fatura assim que ela fechar. Isso te dá uma noção mais clara do "estrago" do mês e libera sua mente.'
        ]
      },
      narrative: {
        title: 'De Monstro a Mascote',
        description: 'Os juros do cartão são um monstro que se alimenta no escuro, crescendo a cada pagamento mínimo. Cada fatura paga integralmente é uma corrente que você coloca nele. Cada "Dia Sem Cartão" é um treinamento de obediência. No final desta trilha, o monstro se transforma em um "pet" dócil: ele ainda existe e pode ser útil, mas quem manda no passeio é você.'
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
      introduction: 'Dever dinheiro para quem amamos é pesado. A vergonha e o medo da decepção paralisam. Esta trilha não é só sobre finanças, é sobre organizar as contas para reconstruir relações de confiança.',
      psychology: {
        title: 'A Psicologia da Dívida Pessoal',
        points: [
          '**Ameaça à "tribo":** Nosso cérebro primitivo interpreta a dívida como uma ameaça ao nosso lugar no "grupo social". Isso gera um estresse profundo, pois coloca em risco laços importantes.',
          '**O peso da decepção:** O medo de ter decepcionado quem confiou em nós pode ser maior e mais paralisante do que as consequências financeiras da dívida em si.',
          '**O orgulho como barreira:** A dificuldade em admitir a vulnerabilidade e negociar um novo prazo muitas vezes vem do orgulho ferido, o que nos impede de tomar a atitude mais inteligente: comunicar-se.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios de Empatia e Ação Concreta',
        experiences: [
          {
            title: 'Exercício de Desconstrução do Medo',
            description: 'Escreva em um papel: "O que eu acho que [nome da pessoa] está pensando sobre mim?". Depois, ao lado, escreva uma versão mais realista e compassiva, como: "Provavelmente, [nome] está mais preocupado(a) comigo do que com o dinheiro em si."'
          },
          {
            title: 'Guia de Conversa Empática',
            description: 'Use nosso passo a passo para iniciar a conversa: 1) Reconheça a dívida e a demora. 2) Assuma a responsabilidade, sem desculpas. 3) Apresente um plano, mesmo que com valores pequenos. 4) Pergunte se o plano é viável para a pessoa.'
          },
        ]
      },
      microHabits: {
        title: 'Pequenos Passos para Reconstruir a Confiança',
        habits: [
          '**Faça um pagamento simbólico:** Mesmo R$10 ou R$20 por semana mostram movimento e comprometimento, quebrando a sensação de estagnação.',
          '**Envie uma atualização proativa:** A cada marco atingido (ex: "Consegui guardar R$50 para te pagar este mês"), envie uma pequena mensagem. A proatividade reduz a ansiedade de quem espera.',
          '**Registre suas emoções:** Anote como se sentiu antes e depois de cada contato ou pagamento. Você verá sua confiança e alívio crescerem com o tempo.'
        ]
      },
      narrative: {
        title: 'A Ponte Quebrada',
        description: 'A dívida entre pessoas queridas é como uma ponte quebrada. O silêncio e a vergonha mantêm as duas pessoas em lados opostos e isolados. Cada pagamento, por menor que seja, é uma nova tábua na reconstrução. Cada conversa honesta são os pregos que firmam a estrutura. Ao final, a ponte não será apenas consertada; ela será mais forte, pois foi testada e reforçada pela honestidade e pelo compromisso.'
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
      introduction: 'Financiar um carro ou uma casa é um compromisso de anos. A sensação de estar "preso" a uma dívida longa pode ser desmotivadora. Esta trilha vai te dar as ferramentas para acelerar a construção do seu futuro e economizar muito dinheiro no processo.',
      psychology: {
        title: 'A Psicologia do Longo Prazo',
        points: [
          '**A "eternidade" da dívida:** Prazos de 20 ou 30 anos são tão longos que nosso cérebro tem dificuldade em processá-los. Isso nos faz focar apenas na parcela mensal, perdendo a noção do custo total absurdo dos juros.',
          '**Desmotivação pelos juros:** No início de um financiamento, é frustrante ver que a maior parte da sua parcela paga juros, e muito pouco vai para abater a dívida de fato. Entender isso é o primeiro passo para querer mudar o jogo.',
          '**A barreira da antecipação:** A ideia de "pagar a mais" parece impossível para quem já está com o orçamento apertado. Vamos quebrar essa barreira mostrando o poder de pequenas antecipações.'
        ]
      },
      practicalExperiences: {
        title: 'Engenharia Financeira na Prática',
        experiences: [
          {
            title: 'Anatomia da sua Parcela',
            description: 'Veja um gráfico que mostra, para sua próxima parcela, quanto é juros (o custo do dinheiro) e quanto é amortização (o que de fato reduz sua dívida). Essa clareza é transformadora.'
          },
          {
            title: 'O Simulador de Amortização',
            description: 'Use nossa ferramenta para descobrir o impacto real de antecipar parcelas. Veja quantos meses (ou anos!) você pode eliminar e quanto dinheiro em juros vai economizar ao pagar R$100, R$500 ou R$1000 a mais.'
          },
        ]
      },
      microHabits: {
        title: 'Pequenos Hábitos, Grande Impacto',
        habits: [
          '**Crie o "cofrinho da amortização":** Guarde pequenos valores que "sobram" (R$5, R$10) em uma meta específica. No fim do mês, use esse valor para antecipar parte de uma parcela.',
          '**Revisão anual do contrato:** Uma vez por ano, revise as condições do seu contrato. As taxas de juros do mercado podem ter caído, e uma portabilidade de crédito pode ser vantajosa.',
          '**Ative um alerta de vencimento:** Programe um alerta para 5 dias antes do vencimento da parcela. Isso te dá tempo para se organizar e evita multas por atraso.'
        ]
      },
      narrative: {
        title: 'Erguendo o Prédio',
        description: 'Seu financiamento é um prédio em construção. Cada parcela normal que você paga é um tijolo que você assenta. Cada amortização, não importa o valor, é como um andar inteiro que sobe de uma vez. A cada andar extra que você constrói, você chega mais perto da cobertura, de onde terá a visão clara do futuro que você mesmo acelerou.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
              question: 'Ao amortizar um financiamento, qual opção geralmente economiza mais juros no longo prazo?',
              options: ['Reduzir o valor das parcelas futuras', 'Reduzir o prazo (o número de parcelas)', 'Investir o dinheiro extra em outro lugar'],
              correctAnswer: 'Reduzir o prazo (o número de parcelas)'
            },
            {
              question: 'No início de um financiamento longo, a maior parte da sua parcela é composta por:',
              options: ['Amortização da dívida', 'Juros', 'Seguros e taxas administrativas'],
              correctAnswer: 'Juros'
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
      introduction: 'O cheque especial é vendido como uma conveniência, uma "ajuda" para momentos de aperto. Na prática, é uma das dívidas mais tóxicas e difíceis de sair. Esta trilha é sua guia de fuga definitiva.',
      psychology: {
        title: 'A Armadilha do Alívio Imediato',
        points: [
          '**Alívio rápido, prisão duradoura:** O cérebro humano ama soluções rápidas. O acesso fácil ao limite gera um alívio momentâneo da ansiedade financeira, mas os juros altíssimos criam um problema muito maior no futuro, gerando um ciclo vicioso.',
          '**A intimidação bancária:** A linguagem complexa, os contratos longos e a posição de "autoridade" do gerente do banco muitas vezes nos fazem sentir pequenos e impotentes para negociar. Vamos quebrar essa barreira.',
          '**Dependência psicológica:** O cérebro se acostuma com o "dinheiro extra" do limite. A simples ideia de viver apenas com o próprio salário pode gerar uma ansiedade que nos mantém presos ao ciclo, mesmo sabendo que é prejudicial.'
        ]
      },
      practicalExperiences: {
        title: 'Experiências para Iluminar o Custo Real',
        experiences: [
          {
            title: 'A Calculadora da Verdade',
            description: 'Use nossa ferramenta para simular o custo real de usar seu cheque especial. Veja quanto você paga de juros ao usar R$ 500 do seu limite por apenas 15 dias. Ver o custo real em reais, não em percentual, é um choque de realidade.'
          },
          {
            title: 'Guia de Diálogo com o Gerente',
            description: 'Disponibilizamos um guia passo a passo para um diálogo simulado com o banco. Ele mostra o que perguntar e como se posicionar para trocar essa dívida cara por uma linha de crédito pessoal com juros muito menores.'
          },
        ]
      },
      microHabits: {
        title: 'Pequenos Passos para a Liberdade',
        habits: [
          '**A meta de "zerar o especial":** Organize-se para que sua conta fique positiva (mesmo que com R$1) pelo menos um dia no mês. Isso quebra o ciclo de juros contínuos.',
          '**Crie uma "mini-reserva anticrise":** Comece uma meta de economia com R$ 50 ou R$ 100. Ter esse pequeno valor disponível é o primeiro passo para não precisar recorrer ao limite na próxima emergência.',
          '**Defina uma meta de comportamento:** Em vez de focar apenas em dinheiro, estabeleça metas como "ficar 10 dias seguidos sem usar o limite do cheque especial".'
        ]
      },
      narrative: {
        title: 'O Labirinto de Vidro',
        description: 'O cheque especial é um labirinto com paredes de vidro. Você consegue ver a saída (sua conta no azul), mas toda vez que tenta alcançá-la, bate em uma parede invisível de juros e taxas. Cada micro-hábito que você cumpre ilumina uma parte do caminho correto. Sua "mini-reserva" é como o fio de Ariadne, que te guia com segurança para fora do labirinto, de uma vez por todas.'
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
                question: 'Se você está preso no ciclo do cheque especial, qual é a primeira ação estratégica recomendada?',
                options: ['Esperar por um aumento de salário', 'Tentar negociar com o banco para trocar essa dívida cara por uma mais barata (empréstimo pessoal)', 'Usar o rotativo do cartão de crédito para cobrir o saldo'],
                correctAnswer: 'Tentar negociar com o banco para trocar essa dívida cara por uma mais barata (empréstimo pessoal)'
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
      introduction: 'A desorganização financeira gera ansiedade, e a ansiedade nos impede de agir. O resultado é um ciclo de estresse e falta de controle. Vamos arrumar essa casa juntos, com um método de pequenas arrumações diárias que trazem paz e clareza imediatas.',
      psychology: {
        title: 'A Mente Organizada: Menos Ansiedade, Mais Controle',
        points: [
          '**Do caos à clareza:** A maior parte da ansiedade financeira não vem da falta de dinheiro, mas da falta de visibilidade. Não saber para onde o dinheiro está indo é assustador. Organizar, mesmo que de forma imperfeita, devolve a sensação de controle.',
          '**O poder das pequenas vitórias:** Um hábito duradouro não nasce de um grande esforço inicial (como passar 8 horas organizando tudo), mas da repetição de ações leves e recompensadoras. Por isso nosso foco é em 3 minutos por dia.',
          '**Categorizar é entender:** Ao dar um "nome" (categoria) aos seus gastos, você começa a entender os gatilhos emocionais por trás deles. "Lazer" é diferente de "Comida por impulso". Essa consciência é o primeiro passo para a mudança de comportamento.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios Práticos de Organização',
        experiences: [
          {
            title: 'Desafio dos 7 Dias de Clareza',
            description: 'Durante uma semana, comprometa-se a registrar absolutamente todos os seus gastos no app, do cafezinho ao aluguel. Ao final dos 7 dias, olhe o relatório de categorias. O resultado pode te surpreender e te mostrar exatamente para onde seu dinheiro está indo.'
          },
          {
            title: 'A Caça às Assinaturas Fantasmas',
            description: 'Tire 15 minutos para listar todas as suas assinaturas recorrentes (streaming, apps, academias, etc.). Compare com o que você realmente usa. Cancele pelo menos uma que não seja mais essencial. É uma economia instantânea e permanente.'
          },
        ]
      },
      microHabits: {
        title: 'A Rotina de 3 Minutos para a Paz Financeira',
        habits: [
          '**Dedique 3 minutos por dia:** No final do dia ou no início da manhã, abra o app e registre os gastos do dia anterior. É rápido e cria um poderoso hábito de consciência.',
          '**Revisão semanal de 5 minutos:** Uma vez por semana, use 5 minutos para olhar o gráfico de categorias. Identifique o maior gasto e pense se ele está alinhado com suas prioridades. Sem julgamento, apenas observação.',
          '**Liste suas 3 prioridades do mês:** No início de cada mês, escreva suas 3 principais metas financeiras. Pode ser "Não usar o cheque especial", "Guardar R$100" ou "Pagar a fatura total do cartão". Isso dá um foco claro para suas decisões.'
        ]
      },
      narrative: {
        title: 'Arrumando os Cômodos da Mente',
        description: 'Sua vida financeira é como uma casa. A cozinha são os gastos diários (comida, mercado). A sala são as contas fixas (aluguel, luz). O quarto são seus sonhos e metas. O cofre é sua reserva de emergência. A desorganização é como deixar tudo espalhado, gerando estresse. Cada vez que você registra um gasto, você está colocando um objeto no seu devido lugar. Aos poucos, cada cômodo se ilumina e a casa fica em ordem, trazendo paz.'
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
      introduction: 'Sair das dívidas e organizar as contas é uma vitória imensa. Você arrumou a casa. Agora, começa a fase mais recompensadora e criativa: a de construir ativamente a vida que você deseja, usando o dinheiro como ferramenta.',
      psychology: {
        title: 'A Mentalidade da Prosperidade Sustentável',
        points: [
          '**Visão de futuro:** Prosperidade não é sobre ter muito dinheiro, é sobre ter clareza do que você quer que o dinheiro construa para você. É usar os recursos para realizar seus valores.',
          '**Metas com alma:** "Juntar R$ 10.000" é uma meta fria. "Guardar R$ 10.000 para a viagem em família que planejamos há anos" tem alma. Conectar suas metas a emoções e desejos reais é o que te mantém motivado.',
          '**Consistência suave:** A estabilidade financeira não vem de picos de esforço e sacrifício, mas da consistência de bons hábitos. É como uma planta que você rega um pouco todo dia, em vez de afogá-la uma vez por mês.'
        ]
      },
      practicalExperiences: {
        title: 'Exercícios para Construir o Futuro',
        experiences: [
          {
            title: 'Crie Metas de Vida, não apenas de Dinheiro',
            description: 'Use a seção "Reservas" do app para criar metas que tenham um propósito claro. Em vez de "Reserva", crie "Reserva para tranquilidade" ou "Fundo de liberdade para mudar de carreira". Dê nome aos seus sonhos.'
          },
          {
            title: 'Simule sua Fortaleza Financeira',
            description: 'Qual é o seu custo de vida mensal? Use esse número para simular o valor necessário para uma reserva de emergência de 3 a 6 meses. Crie essa meta no app. Saber que você tem essa proteção é a base da paz financeira.'
          },
        ]
      },
      microHabits: {
        title: 'Hábitos de Manutenção e Crescimento',
        habits: [
          '**Revisão mensal das metas:** Uma vez por mês, reserve 10 minutos para olhar suas metas. Elas ainda fazem sentido? Os valores precisam de ajuste? Crie novas se sentir necessidade.',
          '**Pague-se primeiro:** Assim que seu salário ou renda entrar na conta, a primeira "conta" a ser paga é o aporte para suas metas de economia. Automatize isso se possível. O que sobra é o que você tem para gastar.',
          '**Celebre as pequenas vitórias:** Completou 10% de uma meta? Se dê um pequeno agrado (que não comprometa o orçamento). Comemorar os marcos reforça o hábito e a motivação.'
        ]
      },
      narrative: {
        title: 'O Horizonte Aberto',
        description: 'Se antes você estava em uma névoa ou em um labirinto, agora você chegou a um campo aberto com um horizonte vasto à sua frente. Cada meta que você cria é um destino diferente que você pode escolher alcançar. Sua jornada mudou de fase: de sobrevivência e reparo para uma fase de criação e construção. O dinheiro deixou de ser um problema e se tornou um aliado.'
      },
      finalQuiz: {
        title: 'Teste seu Conhecimento',
        questions: [
            {
                question: 'Qual a diferença fundamental entre uma meta puramente numérica e uma "meta com alma"?',
                options: ['Não há diferença, o que importa é o valor', 'Uma "meta com alma" conecta o valor financeiro a um desejo de vida concreto, aumentando a motivação', 'Metas com alma são apenas para objetivos de longo prazo, como aposentadoria'],
                correctAnswer: 'Uma "meta com alma" conecta o valor financeiro a um desejo de vida concreto, aumentando a motivação'
            },
            {
                question: 'O que significa o hábito "Pague-se primeiro"?',
                options: ['Gastar com lazer e desejos pessoais antes de pagar as contas essenciais', 'Separar e investir o dinheiro para suas metas assim que a renda é recebida, antes de pagar outras despesas', 'Sempre deixar para guardar o que sobra no final do mês, se sobrar algo'],
                correctAnswer: 'Separar e investir o dinheiro para suas metas assim que a renda é recebida, antes de pagar outras despesas'
            }
        ]
      },
    },
  },
];
