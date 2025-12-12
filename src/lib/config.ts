import { Film, Cpu, Repeat } from 'lucide-react';

export const subscriptionCategoriesConfig = [
  {
    id: 'media' as const,
    title: 'Mídia & Streaming',
    keywords: ['netflix', 'youtube', 'spotify', 'amazon prime', 'disney+', 'hbo max', 'música', 'filmes', 'jornal', 'revista', 'notícias', 'kindle', 'livros', 'globoplay', 'streaming'],
    icon: Film,
  },
  {
    id: 'software' as const,
    title: 'Software & IAs',
    keywords: ['software', 'assinatura', 'ia', 'adobe', 'office', 'nuvem', 'produtividade', 'notion', 'chatgpt', 'contabilizei', 'aws', 'google cloud', 'vps'],
    icon: Cpu,
  },
  {
    id: 'services' as const,
    title: 'Outros Serviços',
    keywords: ['academia', 'gympass', 'yoga', 'meditação', 'saúde'],
    icon: Repeat,
  },
];
