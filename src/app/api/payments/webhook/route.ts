
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import type { SubscriptionPlan } from '@/lib/types';
import crypto from 'crypto';


// Função para verificar a assinatura do webhook
async function verifySignature(request: NextRequest): Promise<boolean> {
  const signatureHeader = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  if (!signatureHeader || !requestId) {
    return false; // Assinatura ou ID da requisição ausente
  }
  
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);

  const ts = parts['ts'];
  const hash = parts['v1'];

  if (!ts || !hash) {
    return false;
  }
  
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADO_PAGO_WEBHOOK_SECRET não está configurado.");
    return false;
  }
  
  const manifest = `id:${requestId};ts:${ts};`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const expectedHash = hmac.digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(hash));
}


export async function POST(req: NextRequest) {
  // Verificação de assinatura primeiro
  const isVerified = await verifySignature(req);
  if (!isVerified) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log('Webhook do Mercado Pago recebido e verificado:', body);
    
    // Verificando se é uma notificação de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado.');
      }
      
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      
      // Busca os detalhes do pagamento
      const paymentDetails = await payment.get({ id: paymentId });
      
      if (paymentDetails.status === 'approved') {
        const userId = paymentDetails.external_reference;
        const planId = paymentDetails.additional_info?.items?.[0]?.id;

        if (!userId || !planId) {
          throw new Error('ID do usuário ou do plano não encontrado no pagamento.');
        }

        const { firestore } = initializeFirebase();
        if (!firestore) {
          throw new Error("Falha ao inicializar o Firestore no servidor.");
        }
        
        const userRef = doc(firestore, 'users', userId);
        const planDocRef = doc(firestore, 'subscriptionPlans', planId);
        const planSnap = await getDoc(planDocRef);

        if (!planSnap.exists()) {
          throw new Error(`Plano com ID ${planId} não encontrado.`);
        }
        
        // Atualiza o documento do usuário com os detalhes da assinatura
        await updateDoc(userRef, {
          'subscription.planId': planId,
          'subscription.status': 'active',
          'subscription.startDate': serverTimestamp(),
          'subscription.paymentGatewaySubscriptionId': paymentId, // Pode ser um ID de assinatura recorrente se aplicável
        });
        
        console.log(`Assinatura do usuário ${userId} para o plano ${planId} foi ativada.`);
      }
    }
    
    // Retorna uma resposta 200 OK para o Mercado Pago para confirmar o recebimento
    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no processamento do webhook do Mercado Pago:', error);
    // Retorna um erro 500 para que o Mercado Pago tente reenviar a notificação
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
