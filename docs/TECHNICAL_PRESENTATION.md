
# Apresentação Técnica do Projeto: Xô Planilhas

## 1. Visão Geral

O "Xô Planilhas" é uma aplicação web moderna de controle financeiro pessoal, projetada para oferecer uma experiência de usuário intuitiva, segura e escalável. O objetivo é substituir o uso de planilhas complexas por uma interface visual e centralizada, ajudando os usuários a gerenciar rendas, despesas, dívidas, metas e aprimorar sua educação financeira.

## 2. Arquitetura e Tecnologias Principais

O projeto é construído sobre uma base de tecnologias modernas e robustas, focadas em performance e experiência do desenvolvedor.

- **Framework Frontend:** **Next.js 14+** com **App Router**. Utilizamos Server Components por padrão para otimizar o carregamento e Client Components (`'use client'`) para interatividade.
- **Linguagem:** **TypeScript** em todo o projeto para garantir a segurança de tipos e a manutenibilidade do código.
- **Backend e Banco de Dados:** **Firebase** (Google Cloud).
    - **Authentication:** Gerencia o login de usuários com provedores de E-mail/Senha e Google.
    - **Firestore:** Banco de dados NoSQL para armazenar todos os dados do usuário, como transações, metas, dívidas, etc. A estrutura de dados é otimizada para segurança e escalabilidade.
- **Estilização e UI:**
    - **Tailwind CSS:** Framework CSS utility-first para estilização rápida e consistente.
    - **ShadCN/UI:** Coleção de componentes de UI reusáveis, acessíveis e customizáveis, construídos sobre Radix UI e Tailwind CSS.
- **Controle de Acesso no Frontend:** **CASL (Component-Driven Access Control)** para gerenciar permissões da interface do usuário de forma declarativa e desacoplada.
- **Inteligência Artificial:** **Genkit (Google AI)** para funcionalidades generativas, como análise de extratos em PDF e geração de insights financeiros.
- **Gerenciamento de Formulários:** **React Hook Form** com **Zod** para validação de schemas, garantindo a integridade dos dados inseridos pelos usuários.
- **Visualização de Dados:** **Recharts** para a criação de gráficos interativos no dashboard.

## 3. Estrutura do Projeto

A organização dos diretórios segue as convenções do Next.js e foi estruturada para separar responsabilidades.

```
/
├── src/
│   ├── app/                    # Rotas da aplicação (App Router)
│   │   ├── (auth)/             # Páginas públicas (ex: landing page, login)
│   │   ├── (main)/             # Páginas autenticadas (dashboard, etc.)
│   │   ├── api/                # API Routes (ex: webhooks de pagamento)
│   │   └── layout.tsx          # Layout principal
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── ui/                 # Componentes base do ShadCN/UI
│   │   ├── dashboard/          # Componentes específicos do Dashboard
│   │   └── ...                 # Outros componentes específicos de features
│   ├── firebase/               # Configuração e hooks do Firebase
│   │   ├── client-provider.tsx # Provedor que inicializa o Firebase no cliente
│   │   ├── provider.tsx        # Contexto principal do Firebase (App, Auth, Firestore)
│   │   └── hooks/              # Hooks customizados (useUser, useCollection)
│   ├── ai/                     # Lógica de Inteligência Artificial
│   │   └── flows/              # Fluxos do Genkit para interagir com a IA
│   ├── lib/                    # Funções utilitárias, tipos e constantes
│   │   └── ability.ts          # Definições de permissões do CASL
│   ├── hooks/                  # Hooks customizados da aplicação
│   └── context/                # Contextos React globais
├── docs/
│   └── backend.json            # Definição da estrutura de dados do Firestore
└── firestore.rules             # Regras de segurança do Firestore
```

## 4. Lógica de Funcionalidades por Página

### 4.1. Autenticação e Acesso (`/login`, `/admin/login`)

-   **`src/app/login/page.tsx`**: Página de login e cadastro para usuários.
    -   **Lógica:** Utiliza o hook `useAuth` do Firebase. Oferece login com Google (`signInWithPopup`) e com E-mail/Senha (`signInWithEmailAndPassword` e `createUserWithEmailAndPassword`).
    -   **Criação de Usuário:** Após o primeiro login bem-sucedido, um novo documento de usuário é criado na coleção `/users/{userId}` no Firestore, contendo informações básicas como nome, e-mail e data de registro.
-   **`src/app/admin/login/page.tsx`**: Página de login restrita para administradores.
    -   **Lógica:** Após a autenticação, verifica no documento do usuário no Firestore se o campo `role` é igual a `"superadmin"`. Se não for, o acesso é negado, e o usuário é deslogado.

### 4.2. Dashboard (`/dashboard`)

-   **`src/app/dashboard/page.tsx`**: O hub principal da aplicação.
    -   **Lógica:**
        -   Utiliza o hook `useDashboardDate` para gerenciar o período de visualização (mês/ano).
        -   Realiza múltiplas consultas ao Firestore para buscar dados do período selecionado: rendas, despesas, dívidas e metas.
        -   Usa o hook `useManageRecurrences` para verificar se há transações recorrentes a serem criadas para o mês atual.
        -   Usa o hook `useNotificationGenerator` para verificar e criar notificações (ex: parcelas de dívidas vencidas).
        -   Calcula KPIs (Renda Total, Despesas Totais, Balanço, Progresso de Metas).
        -   Chama o fluxo do Genkit `getFinancialInsights` para gerar a análise com IA.
    -   **Componentes:** Exibe `KpiCard` para os indicadores, `IncomeExpenseChart` e `ExpenseCategoryChart` para os gráficos, um `Calendar` para a visão mensal, e `FinancialHealthScore` para gamificação.

### 4.3. Rendas e Despesas (`/income/**`, `/expenses/**`)

-   **Páginas Principais (`/income`, `/expenses`):**
    -   **Lógica:** Listam todas as transações do respectivo tipo em um `DataTable`. Permitem filtrar por período (mês, ano, tudo).
-   **Páginas Específicas (ex: `/income/salary`, `/expenses/housing`):**
    -   **Lógica:** Cada página é focada em uma categoria ou tipo de transação. Elas realizam uma consulta ao Firestore filtrando pela categoria correspondente (ex: `where('category', '==', 'Salário')`).
    -   **Funcionalidades Adicionais:**
        -   `/income/salary`: Permite gerenciar "contratos de salário" para registrar o salário base e o nome da empresa.
        -   `/expenses/housing`: Gerencia "contratos de aluguel", que podem gerar despesas recorrentes automaticamente.
        -   `/expenses/subscriptions`: Agrupa despesas recorrentes por subcategorias (Mídia, Software, etc.).
-   **Componente Chave (`AddTransactionSheet`):**
    -   Um formulário em modal (sheet) usado para adicionar ou editar qualquer tipo de transação (renda ou despesa). Ele é reutilizável e se adapta com base no `transactionType` passado como prop.

### 4.4. Dívidas e Parcelamentos (`/debts`)

-   **`src/app/debts/page.tsx`**:
    -   **Lógica:** Exibe um `DebtCard` para cada dívida cadastrada. Cada card busca as parcelas (`installments`) da sua subcoleção no Firestore (`/users/{uid}/debts/{debtId}/installments`).
    -   **Funcionalidade:** O usuário pode marcar uma parcela como "paga", o que atualiza o status da parcela e o `paidAmount` do documento da dívida principal.
-   **Componente Chave (`AddDebtSheet`):**
    -   Formulário para criar uma nova dívida. Ao submeter, ele cria o documento da dívida e, em um único `writeBatch` do Firestore, gera todos os documentos de parcelas na subcoleção correspondente.

### 4.5. Metas e Reservas (`/goals`)

-   **`src/app/goals/page.tsx`**:
    -   **Lógica:** Mostra um `GoalCard` para cada meta. Os cards exibem o progresso e permitem a adição de novos aportes.
-   **Componentes Chave:**
    -   **`AddGoalSheet`:** Permite criar ou editar uma meta, definindo nome, valor alvo e valor inicial.
    -   **`AddContributionSheet`:** Um modal simples para adicionar um novo valor (`currentAmount`) a uma meta existente.

### 4.6. Central de Saúde (`/health`)

-   **`src/app/health/page.tsx`**:
    -   **Lógica:** Centraliza informações de saúde em três seções: Planos de Saúde/Odontológico, Empresas (clínicas, academias) e Profissionais.
    -   **Estrutura:** Utiliza três coleções separadas no Firestore (`healthInsurances`, `healthProviders`, `healthProfessionals`) para manter os dados organizados. Os profissionais podem ser vinculados a uma empresa.
    -   **Componentes:** `HealthProviderCard` exibe os detalhes de uma empresa e lista os profissionais associados a ela.

### 4.7. Jornada Financeira (`/education/**`)

-   **`src/app/education/page.tsx`**: A página principal da jornada.
    -   **Lógica:** Busca todas as `EducationTrack` da coleção `/education`. Compara com o campo `completedTracks` do documento do usuário para separar as trilhas concluídas das pendentes e calcular o nível de progresso.
-   **`src/app/education/[slug]/page.tsx`**: Página de uma trilha específica.
    -   **Lógica:** Renderiza os módulos da trilha de forma interativa usando um componente de abas (`Tabs`). O progresso do usuário (itens lidos, hábitos marcados) é salvo no estado do componente. A conclusão do quiz final atualiza o documento do usuário no Firestore, adicionando o `slug` da trilha ao array `completedTracks`.

### 4.8. Painel do Administrador (`/admin/dashboard`)

-   **Lógica de Acesso:** O layout (`AuthenticatedLayout`) e a própria página verificam se `user.role === 'superadmin'`.
-   **Funcionalidades:**
    -   **Gerenciamento de Usuários:** Lista todos os usuários do sistema. Usa o `CASL` para controlar as ações (ex: um admin não pode excluir a si mesmo).
    -   **Visualização de Logs:** Exibe logs de eventos importantes do sistema, que são registrados na coleção `/logs`.
    -   **Gerenciamento de Conteúdo:** Permite criar e editar as trilhas de educação (`EducationTrack`).

## 5. Lógica de Backend e Firestore

-   **Estrutura de Dados (`docs/backend.json`):** Este arquivo serve como a "planta" do nosso banco de dados. Ele define o schema de cada entidade (User, Transaction, Debt, etc.).
-   **Regras de Segurança (`firestore.rules`):** As regras garantem que:
    -   Um usuário só pode ler e escrever seus próprios dados (`isOwner(userId)`).
    -   Coleções públicas, como `/education`, podem ser lidas por qualquer usuário autenticado.
    -   Apenas `superadmin` pode escrever em coleções públicas ou acessar dados de outros usuários.
-   **Recorrências (`useManageRecurrences.ts`):** Este hook é executado no `AuthenticatedLayout`. Uma vez por mês, ele verifica todas as transações marcadas como `isRecurring` e cria cópias delas para o mês atual com o status "pendente", automatizando o lançamento de contas fixas.
-   **Notificações (`useNotificationGenerator.ts`):** Também executado no layout, este hook verifica periodicamente (a cada 4 horas, controlado por `localStorage`) se há parcelas de dívidas vencidas e cria uma notificação na subcoleção `/users/{uid}/notifications` caso encontre alguma.

Essa estrutura garante que a aplicação seja robusta, segura e preparada para futuras expansões.
