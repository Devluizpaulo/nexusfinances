
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Xô Planilhas',
  description: 'Entenda como coletamos, usamos e protegemos seus dados em nossa Política de Privacidade.',
};

export default function PrivacyPolicyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
        <CardDescription>
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
        <p>Bem-vindo à Política de Privacidade do Xô Planilhas. Sua privacidade é de extrema importância para nós. Este documento explica quais dados coletamos, como os usamos e as medidas que tomamos para protegê-los.</p>
        
        <h2>1. Coleta de Informações</h2>
        <p>Coletamos informações que você nos fornece diretamente, como:</p>
        <ul>
            <li><strong>Informações de Cadastro:</strong> Nome, e-mail e senha (criptografada) quando você cria uma conta. Se você se cadastrar via Google, recebemos as informações básicas do seu perfil público.</li>
            <li><strong>Dados Financeiros:</strong> Todas as informações que você insere no aplicativo, incluindo rendas, despesas, dívidas, metas e orçamentos.</li>
        </ul>
        <p>Também coletamos informações técnicas automaticamente, como endereço IP, tipo de navegador e informações sobre seu dispositivo para garantir o bom funcionamento e a segurança do serviço.</p>

        <h2>2. Uso das Informações</h2>
        <p>Utilizamos suas informações para:</p>
        <ul>
            <li>Fornecer, manter e melhorar nossos serviços.</li>
            <li>Personalizar sua experiência no aplicativo.</li>
            <li>Processar transações e gerar seus relatórios financeiros.</li>
            <li>Comunicar com você sobre sua conta, atualizações e suporte.</li>
            <li>Analisar o uso do serviço de forma anônima para desenvolver novos recursos.</li>
            <li>Para funcionalidades de IA, seus dados financeiros (rendas, despesas, etc.) são enviados de forma anônima para a API da IA para gerar insights. Não compartilhamos informações de identificação pessoal (como nome ou e-mail) com a IA.</li>
        </ul>

        <h2>3. Segurança dos Dados</h2>
        <p>A segurança dos seus dados é nossa prioridade. Implementamos as seguintes medidas:</p>
        <ul>
            <li><strong>Criptografia:</strong> Seus dados são criptografados em trânsito (usando SSL/TLS) e em repouso.</li>
            <li><strong>Controle de Acesso:</strong> Utilizamos as regras de segurança do Firebase Firestore para garantir que apenas você tenha acesso aos seus próprios dados financeiros. Nossos administradores não têm acesso direto aos seus registros financeiros.</li>
            <li><strong>Boas Práticas:</strong> Seguimos as melhores práticas de segurança para proteger nossa infraestrutura contra acesso não autorizado.</li>
        </ul>

        <h2>4. Compartilhamento de Informações</h2>
        <p><strong>Nós não vendemos, alugamos ou compartilhamos suas informações financeiras pessoais com terceiros para fins de marketing.</strong></p>
        <p>Podemos compartilhar informações nas seguintes circunstâncias:</p>
        <ul>
            <li>Com provedores de serviços que nos ajudam a operar o aplicativo (ex: Google Cloud para infraestrutura, Google Generative AI para recursos de IA), sob estritos acordos de confidencialidade.</li>
            <li>Se exigido por lei ou para proteger os direitos e a segurança do Xô Planilhas e de seus usuários.</li>
        </ul>

        <h2>5. Seus Direitos</h2>
        <p>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Você pode gerenciar a maioria das suas informações diretamente na página de perfil ou entrando em contato conosco.</p>

        <h2>6. Cookies</h2>
        <p>Usamos cookies essenciais para o funcionamento do site, como manter sua sessão de login ativa. Também usamos cookies para análise de tráfego anônima (via Google Analytics) para entender como nosso site é usado e como podemos melhorá-lo.</p>

        <h2>7. Alterações nesta Política</h2>
        <p>Podemos atualizar esta Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações significativas através do aplicativo ou por e-mail.</p>

        <h2>8. Contato</h2>
        <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco através da seção de Suporte no aplicativo.</p>
      </CardContent>
    </Card>
  );
}
