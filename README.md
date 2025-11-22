# xô planilhas: Seu Assistente Financeiro Pessoal

xô planilhas é uma aplicação web moderna construída com Next.js e Firebase, projetada para ajudar os usuários a gerenciar suas finanças pessoais de forma inteligente e intuitiva.

## ✨ Funcionalidades Principais

- **Dashboard Interativo:** Visualize um resumo completo da sua saúde financeira com KPIs, gráficos de renda vs. despesas, e análise de gastos por categoria.
- **Gerenciamento de Transações:** Adicione, edite e acompanhe suas rendas e despesas com status de pagamento.
- **Controle de Dívidas:** Cadastre empréstimos e financiamentos, e gerencie o pagamento das parcelas.
- **Metas e Investimentos:** Crie e acompanhe o progresso de suas metas financeiras e reservas.
- **Autenticação Segura:** Login social com Google e sistema de autenticação por e-mail e senha.
- **Personalização:** Crie suas próprias categorias de renda e despesa para adaptar o sistema à sua realidade.
- **Painel de Administração:** Uma área restrita para administradores gerenciarem usuários e visualizarem logs do sistema.

## 🚀 Como Começar

Siga estas instruções para configurar e executar o projeto em seu ambiente local.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### 1. Configure seu Projeto Firebase

Antes de começar, você precisa de um projeto Firebase configurado.

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Clique em **"Adicionar projeto"** e siga as instruções para criar um novo projeto.
3.  No seu novo projeto, vá para **"Authentication"** (Autenticação) no menu lateral e clique em **"Primeiros passos"**. Habilite os provedores de **"E-mail/senha"** e **"Google"**.
4.  Em seguida, vá para **"Firestore Database"** no menu lateral, clique em **"Criar banco de dados"** e inicie no **modo de produção**.

### 2. Configure as Variáveis de Ambiente

O projeto usa variáveis de ambiente para se conectar ao Firebase.

1.  Na raiz do projeto, renomeie o arquivo `.env.example` para `.env`.
2.  Abra o arquivo `.env` e preencha com as credenciais do seu projeto Firebase.
    - Para encontrar essas credenciais, vá para as **Configurações do projeto** (ícone de engrenagem) > **Geral**.
    - Role para baixo até a seção **"Seus apps"**. Se ainda não tiver um app da web, clique no ícone `</>` para criar um.
    - Copie os valores do objeto `firebaseConfig` e cole-os nas variáveis correspondentes em seu arquivo `.env`.

### 3. Instale as Dependências

Navegue até o diretório do projeto e instale as dependências necessárias:

```bash
npm install
```

### 4. Execute o Projeto

Agora você pode iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:9002](http://localhost:9002) em seu navegador para ver a aplicação em funcionamento.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **UI:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [ShadCN/UI](https://ui.shadcn.com/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Gerenciamento de Formulários:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
