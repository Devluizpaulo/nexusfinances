
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server-init';
import type { SubscriptionPlan } from '@/lib/types';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, userId, userEmail } = body;

    if (!planId || !userId || !userEmail) {
      return NextResponse.json({ error: 'Dados insuficientes para criar a preferência.' }, { status: 400 });
    }

    // Acesso seguro ao Token de Acesso do Mercado Pago
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN não está configurado.");
      return NextResponse.json({ error: 'Erro de configuração do servidor.' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    // Inicialize o Firestore no lado do servidor para buscar os detalhes do plano
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error("Falha ao inicializar o Firestore no servidor.");
    }
    
    const planDocRef = doc(firestore, 'subscriptionPlans', planId);
    const planSnap = await getDoc(planDocRef);

    if (!planSnap.exists()) {
      return NextResponse.json({ error: 'Plano não encontrado.' }, { status: 404 });
    }

    const plan = planSnap.data() as SubscriptionPlan;

    // Cria a preferência de pagamento no Mercado Pago
    const result = await preference.create({
      body: {
        items: [
          {
            id: planId,
            title: `Assinatura Xô Planilhas - Plano ${plan.name}`,
            quantity: 1,
            unit_price: plan.price,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: userEmail,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment_status=success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/monetization/plans?payment_status=failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment_status=pending`,
        },
        auto_return: 'approved',
        external_reference: userId, // Vincula a preferência ao ID do usuário no seu sistema
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`, // URL para receber webhooks
      },
    });
    
    // Retorna a URL de checkout para o cliente
    return NextResponse.json({ checkoutUrl: result.init_point });

  } catch (error: any) {
    console.error('Erro ao criar preferência no Mercado Pago:', error);
    return NextResponse.json({ error: error.message || 'Falha ao criar a preferência de pagamento.' }, { status: 500 });
  }
}
