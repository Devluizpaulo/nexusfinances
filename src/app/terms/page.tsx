
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | Xô Planilhas',
  description: 'Leia nossos Termos de Uso para entender as regras e diretrizes para usar o aplicativo Xô Planilhas.',
};


export default function TermsOfServicePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Termos de Uso</CardTitle>
        <CardDescription>
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
        <p>Bem-vindo ao Xô Planilhas! Ao usar nosso aplicativo, você concorda com estes Termos de Uso. Por favor, leia-os com atenção.</p>
        
        <h2>1. Identificação do Provedor</h2>
        <p>O aplicativo Xô Planilhas é fornecido e administrado por:</p>
        <ul>
            <li><strong>Razão Social:</strong> LUIZ PAULO GONCALVES MIGUEL DE JESUS DESENVOLVIMENTO DE SOFTWARE LTDA</li>
            <li><strong>CNPJ:</strong> 62.618.880/0001-11</li>
            <li><strong>Endereço:</strong> R PAIS LEME, Nº 215, CONJ 1713, PINHEIROS, SAO PAULO - SP, CEP: 05.424-150</li>
        </ul>

        <h2>2. Aceitação dos Termos</h2>
        <p>Ao criar uma conta e usar o Xô Planilhas, você concorda em cumprir estes Termos e nossa Política de Privacidade. Se você não concordar com qualquer parte dos termos, não poderá usar nossos serviços.</p>

        <h2>3. Uso do Serviço</h2>
        <p>O Xô Planilhas é uma ferramenta para controle financeiro pessoal. Você concorda em usar o serviço apenas para fins legais e pessoais.</p>
        <ul>
            <li><strong>Sua Conta:</strong> Você é responsável por manter a segurança de sua conta e senha. O Xô Planilhas não se responsabiliza por perdas ou danos decorrentes de sua falha em proteger suas informações de login.</li>
            <li><strong>Precisão dos Dados:</strong> A precisão das informações financeiras, relatórios e insights gerados depende inteiramente dos dados que você insere. Você é o único responsável pela veracidade e exatidão dos dados fornecidos.</li>
            <li><strong>Uso Indevido:</strong> Você não deve usar o serviço para qualquer finalidade ilegal ou não autorizada.</li>
        </ul>

        <h2>4. Funcionalidades de IA</h2>
        <p>O Xô Planilhas utiliza modelos de Inteligência Artificial para fornecer resumos e insights financeiros. Ao usar esses recursos, você entende que:</p>
        <ul>
            <li>As análises são geradas por um algoritmo e devem ser consideradas como sugestões, não como aconselhamento financeiro profissional.</li>
            <li>A precisão dos insights depende da qualidade dos dados que você fornece.</li>
            <li>Não nos responsabilizamos por decisões financeiras tomadas com base nas sugestões da IA. Sempre consulte um profissional financeiro para decisões importantes.</li>
        </ul>

        <h2>5. Propriedade Intelectual</h2>
        <p>O serviço e seu conteúdo original, recursos e funcionalidades são e continuarão sendo propriedade exclusiva do Xô Planilhas. Nossos direitos autorais e marcas registradas não podem ser usados em conexão com qualquer produto ou serviço sem nosso consentimento prévio por escrito.</p>

        <h2>6. Rescisão</h2>
        <p>Podemos rescindir ou suspender seu acesso ao nosso serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos. Você pode parar de usar o serviço a qualquer momento.</p>

        <h2>7. Limitação de Responsabilidade</h2>
        <p>Em nenhuma circunstância o Xô Planilhas, nem seus diretores, funcionários ou parceiros, serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes do seu acesso ou uso ou incapacidade de acessar ou usar o serviço.</p>
        <p>O serviço é fornecido "COMO ESTÁ" e "COMO DISPONÍVEL", sem garantias de qualquer tipo.</p>

        <h2>8. Alterações nos Termos</h2>
        <p>Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.</p>

        <h2>9. Contato</h2>
        <p>Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco através da seção de Suporte no aplicativo.</p>
      </CardContent>
    </Card>
  );
}
