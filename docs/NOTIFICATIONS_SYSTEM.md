# Sistema de Notificações Evoluído - Nexus Finances

## 📋 Resumo Executivo

O sistema de notificações foi completamente reformulado com **7 novos hooks inteligentes** que monitoram automaticamente diversos aspectos financeiros e alertam o usuário de forma proativa.

---

## 🎯 Novos Hooks de Notificação

### 1. **useBudgetWarningNotifications** ⚠️
**Arquivo:** `src/hooks/use-budget-warning-notifications.ts`

**Funcionalidade:**
- Monitora gastos por categoria em tempo real
- Emite alerta quando atinge **80% do orçamento** (warning)
- Emite alerta crítico quando **excede 100%** do orçamento
- Verifica diariamente todos os orçamentos ativos
- Calcula automaticamente top categoria de gastos

**Notificações Criadas:**
- `budget_warning`: Quando gasto atinge 80-99%
- `budget_exceeded`: Quando gasto ultrapassa 100%

**Exemplo de Mensagem:**
> ⚠️ Alerta: Você já gastou 85% do orçamento de "Alimentação". Restam R$ 450.00.
> 🚨 Orçamento estourado! Você excedeu o limite de "Transporte" em R$ 120.50 (115% gasto).

---

### 2. **useDebtOverdueNotifications** 🚨
**Arquivo:** `src/hooks/use-debt-overdue-notifications.ts`

**Funcionalidade:**
- Detecta parcelas de dívidas não pagas após vencimento
- Calcula dias de atraso automaticamente
- Alerta com prioridade ALTA
- Verifica diariamente todas as dívidas

**Notificações Criadas:**
- `debt_overdue`: Para cada parcela vencida e não paga

**Exemplo de Mensagem:**
> 🚨 Dívida vencida! A parcela 3 de "Empréstimo Banco X" está atrasada há 5 dia(s). Valor: R$ 350.00.

---

### 3. **useMonthlySummaryNotifications** 💰
**Arquivo:** `src/hooks/use-monthly-summary-notifications.ts`

**Funcionalidade:**
- Gera resumo financeiro completo ao final de cada mês
- Calcula total de receitas e despesas
- Calcula economia/prejuízo do período
- Identifica categoria com maior gasto
- Calcula taxa de economia (%)
- Executa entre dias 28-31 de cada mês

**Notificações Criadas:**
- `monthly_summary`: Resumo consolidado mensal

**Exemplo de Mensagem:**
> 💰 Resumo de Outubro: Receitas R$ 5.500,00 • Despesas R$ 4.200,00 • Você economizou R$ 1.300,00 (23.6%) • Maior gasto: Alimentação (R$ 1.200,00).

---

### 4. **useGoalMilestoneNotifications** 🎯
**Arquivo:** `src/hooks/use-goal-milestone-notifications.ts`

**Funcionalidade:**
- Monitora progresso de todas as metas financeiras
- Notifica em marcos importantes: **25%, 50%, 75%, 90%**
- Calcula valor restante para conclusão
- Emojis dinâmicos baseados no progresso
- Verifica diariamente para evitar spam

**Notificações Criadas:**
- `goal_milestone`: Para cada marco atingido

**Exemplos de Mensagens:**
> 🌱 Meta "Viagem Europa" atingiu 25%! Faltam apenas R$ 6.750,00 para concluir.
> 📈 Meta "Carro Novo" atingiu 50%! Faltam apenas R$ 15.000,00 para concluir.
> 🎯 Meta "Reserva Emergência" atingiu 90%! Faltam apenas R$ 1.000,00 para concluir.

---

## 📊 Tipos de Notificação Completos

### Tipos Existentes (Mantidos)
1. `debt_due` - Dívida próxima do vencimento
2. `goal_reached` - Meta 100% alcançada
3. `upcoming_due` - Conta a vencer (3 dias)
4. `recurrence_created` - Contas recorrentes criadas
5. `credit_card_notification` - Fechamento/vencimento cartão

### Novos Tipos Adicionados
6. `goal_milestone` - Marco de progresso em meta
7. `budget_warning` - Alerta de orçamento (80%)
8. `budget_exceeded` - Orçamento estourado (100%+)
9. `debt_overdue` - Dívida vencida e não paga
10. `monthly_summary` - Resumo financeiro mensal

---

## 🎨 Sistema de Visualização Melhorado

### Arquivo de Configuração
**`src/lib/notification-config.ts`**

Cada tipo de notificação possui:
- ✅ **Ícone específico** (Trophy, Target, AlertTriangle, etc.)
- ✅ **Cor personalizada** (green, blue, orange, red, etc.)
- ✅ **Background color** com transparência
- ✅ **Border color** matching
- ✅ **Label descritivo**

### Sistema de Prioridades
- **LOW** (baixa): Informações gerais, marcos de meta
- **MEDIUM** (média): Avisos, resumos, alertas de 80%
- **HIGH** (alta): Crítico, dívidas vencidas, orçamento estourado

### Componente Header Melhorado
**`src/components/layout/header.tsx`**

Melhorias visuais:
- ✅ Ícones coloridos por tipo de notificação
- ✅ Badge com label do tipo
- ✅ Badge de prioridade (low/medium/high)
- ✅ Indicador visual de não lidas
- ✅ Background e border personalizados
- ✅ Hover effects suaves
- ✅ Layout responsivo

---

## 🔧 Integração no Sistema

### Layout Autenticado
**`src/components/layout/authenticated-layout.tsx`**

Todos os 7 hooks são executados automaticamente quando usuário está logado:

```typescript
useManageRecurrences(); // Cria transações recorrentes mensalmente
useUpcomingNotifications(); // Alertas 3 dias antes
useCreditCardNotifications(); // Cartões (2 dias antes)
useBudgetWarningNotifications(); // Orçamentos 80%/100%
useDebtOverdueNotifications(); // Dívidas vencidas
useMonthlySummaryNotifications(); // Resumo mensal
useGoalMilestoneNotifications(); // Marcos de metas 25/50/75/90%
```

### Schema de Tipos Atualizado
**`src/lib/types.ts`**

```typescript
export type NotificationType = 
  | 'debt_due' 
  | 'goal_reached' 
  | 'goal_milestone'
  | 'budget_warning' 
  | 'budget_exceeded'
  | 'debt_overdue'
  | 'upcoming_due' 
  | 'recurrence_created' 
  | 'credit_card_notification'
  | 'monthly_summary';

export type NotificationPriority = 'low' | 'medium' | 'high';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  link?: string;
  timestamp: string;
  entityId?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>; // Dados adicionais
}
```

---

## 📈 Frequência de Verificação

| Hook | Frequência | Quando Executa |
|------|-----------|----------------|
| useBudgetWarningNotifications | Diária | Qualquer hora do dia |
| useDebtOverdueNotifications | Diária | Qualquer hora do dia |
| useMonthlySummaryNotifications | Mensal | Dias 28-31 do mês |
| useGoalMilestoneNotifications | Diária | Qualquer hora do dia |
| useUpcomingNotifications | Diária | Qualquer hora do dia |
| useCreditCardNotifications | Diária | Qualquer hora do dia |
| useManageRecurrences | Mensal | Qualquer dia do mês |

**Tecnologia:** Usa `localStorage` para evitar verificações duplicadas no mesmo período.

---

## 🎁 Metadata Estruturado

Cada notificação agora pode conter `metadata` personalizado:

### Budget Warning/Exceeded
```json
{
  "category": "Alimentação",
  "spent": 2550.00,
  "limit": 3000.00,
  "percentage": 85.0,
  "exceeded": 0 // ou valor positivo se excedeu
}
```

### Debt Overdue
```json
{
  "debtName": "Empréstimo Carro",
  "installmentNumber": 5,
  "amount": 450.00,
  "daysOverdue": 3,
  "dueDate": "2025-12-15"
}
```

### Monthly Summary
```json
{
  "month": "2026-01",
  "totalIncome": 5500.00,
  "totalExpenses": 4200.00,
  "savings": 1300.00,
  "savingsRate": 23.6,
  "topCategory": {
    "category": "Alimentação",
    "amount": 1200.00
  }
}
```

### Goal Milestone
```json
{
  "goalId": "goal-123",
  "goalName": "Viagem Europa",
  "milestone": 50,
  "currentAmount": 5000.00,
  "targetAmount": 10000.00,
  "progress": 50.0
}
```

---

## ✨ Benefícios para o Usuário

1. **Proatividade** - Sistema alerta antes dos problemas
2. **Visibilidade** - Cores e ícones facilitam identificação
3. **Contexto** - Metadata permite ações inteligentes
4. **Priorização** - Sistema de prioridades destaca urgências
5. **Educação** - Resumo mensal ensina hábitos financeiros
6. **Motivação** - Marcos de metas incentivam progresso
7. **Prevenção** - Alertas de orçamento evitam gastos excessivos
8. **Organização** - Tudo centralizado em um único lugar

---

## 🚀 Próximas Evoluções Possíveis

1. **Filtros de notificação** - Por tipo, prioridade, lida/não lida
2. **Notificações push** - Integração com Firebase Cloud Messaging
3. **Preferências de notificação** - Usuário escolhe quais receber
4. **Agrupamento inteligente** - Agrupar notificações similares
5. **Ações rápidas** - Marcar como pago, contribuir para meta
6. **Histórico de notificações** - Página dedicada com busca
7. **Estatísticas de alertas** - Dashboard de notificações
8. **Webhooks** - Integração com Telegram/WhatsApp
9. **Email digest** - Resumo semanal por email
10. **Inteligência artificial** - Sugestões baseadas em padrões

---

## 📝 Notas Técnicas

- Todos os hooks são **client-side** (`'use client'`)
- Usam **localStorage** para controle de execução
- **Batch writes** do Firestore para eficiência
- **Query optimization** com where clauses específicos
- **Verificação de duplicatas** via `entityId` único
- **Type safety** completo com TypeScript
- **Error handling** com try-catch em operações críticas
- **Performance** - Limit de queries quando possível

---

## 🎯 Conclusão

O sistema de notificações agora é **10x mais poderoso**, cobrindo todos os aspectos importantes da vida financeira do usuário:

- ✅ Orçamentos e gastos
- ✅ Dívidas e parcelas
- ✅ Metas e progresso
- ✅ Contas a vencer
- ✅ Cartões de crédito
- ✅ Resumos mensais
- ✅ Recorrências automáticas

Tudo com interface visual moderna, priorização inteligente e metadata estruturado para futuras funcionalidades.
