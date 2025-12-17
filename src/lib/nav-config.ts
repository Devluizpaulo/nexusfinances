
import { 
    LayoutDashboard, Landmark, CreditCard, Banknote, PiggyBank, GraduationCap, 
    ShieldCheck, LifeBuoy, Home, Zap, FileText, HeartPulse, Repeat, WalletCards, 
    List, LineChart, PieChart, Briefcase, PenSquare, BookOpen, Target, Trophy, 
    Clapperboard, Car, Utensils, ShoppingCart, Activity 
} from 'lucide-react';

export const navSections = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        subItems: [
            { href: '/dashboard', label: 'Resumo', icon: LineChart },
            { href: '/reports', label: 'Relatórios', icon: PieChart },
        ]
    },
    {
        label: 'Rendas',
        icon: Landmark,
        href: '/income',
        subItems: [
            { href: '/income', label: 'Visão Geral', icon: List },
            { href: '/income/salary', label: 'Salário', icon: Briefcase },
            { href: '/income/freelancer', label: 'Freelancer', icon: PenSquare },
            { href: '/income/others', label: 'Outras', icon: WalletCards },
        ]
    },
    {
        label: 'Despesas',
        icon: CreditCard,
        href: '/expenses',
        subItems: [
            { href: '/expenses', label: 'Visão Geral', icon: List },
            { href: '/expenses/housing', label: 'Moradia', icon: Home },
            { href: '/expenses/utilities', label: 'Contas', icon: Zap },
            { href: '/expenses/food', label: 'Alimentação', icon: Utensils },
            { href: '/expenses/transport', label: 'Transporte', icon: Car },
            { href: '/expenses/taxes', label: 'Impostos', icon: FileText },
            { href: '/expenses/health', label: 'Saúde', icon: HeartPulse },
            { href: '/expenses/education', label: 'Educação', icon: BookOpen },
            { href: '/expenses/leisure', label: 'Lazer', icon: Clapperboard },
            { href: '/expenses/subscriptions', label: 'Assinaturas', icon: Repeat },
            { href: '/expenses/others', label: 'Outras', icon: PenSquare },
        ]
    },
    {
        label: 'Dívidas',
        icon: Banknote,
        href: '/debts',
        subItems: []
    },
     {
        label: 'Cartões',
        icon: WalletCards,
        href: '/credit-cards',
        subItems: []
    },
    {
        label: 'Orçamentos',
        icon: Target,
        href: '/budgets',
        subItems: []
    },
     {
        label: 'Saúde',
        icon: HeartPulse,
        href: '/health',
        subItems: []
    },
    {
        label: 'Metas',
        icon: PiggyBank,
        href: '/goals',
        subItems: []
    },
    {
        label: 'Desafios',
        icon: Trophy,
        href: '/challenges',
        subItems: []
    },
    {
        label: 'Jornada',
        icon: GraduationCap,
        href: '/education',
        subItems: []
    },
];
