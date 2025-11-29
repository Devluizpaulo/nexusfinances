
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import type { SubscriptionPlan } from '@/lib/types';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook do Mercado Pago recebido:', body);
    
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
    console.error('Erro no webhook do Mercado Pago:', error);
    // Em caso de erro, é importante não retornar um erro 500 para o Mercado Pago,
    // pois ele pode tentar reenviar a notificação. Logamos o erro e retornamos 200.
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
