import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify company belongs to user
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .eq('user_id', user.id)
      .single();

    if (error || !company) {
      return NextResponse.json({ error: 'Company not found or unauthorized' }, { status: 404 });
    }

    if (company.tier === 'premium') {
      return NextResponse.json({ error: 'Already subscribed to premium' }, { status: 400 });
    }

    // Replace with your actual Stripe Price ID for the Premium subscription
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID; 

    if (!priceId) {
       console.error("STRIPE_PREMIUM_PRICE_ID is not configured");
       return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pro/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pro/dashboard?canceled=true`,
      client_reference_id: company.id,
      customer_email: user.email,
      metadata: {
        companyId: company.id,
        userId: user.id
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
