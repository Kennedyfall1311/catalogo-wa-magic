import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Candidate {
  id: string;
  name: string;
  code?: string | null;
  brand?: string | null;
  price?: number | null;
  description?: string | null;
  category?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return json({ error: 'AI indisponível' }, 500);

    const body = await req.json().catch(() => null);
    const product = body?.product;
    const candidates: Candidate[] = Array.isArray(body?.candidates) ? body.candidates : [];

    if (!product?.name || candidates.length === 0) {
      return json({ error: 'Dados inválidos' }, 400);
    }

    const list = candidates.slice(0, 40).map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code ?? null,
      brand: c.brand ?? null,
      price: c.price ?? null,
      category: c.category ?? null,
    }));

    const prompt = [
      'Você é um vendedor especialista de uma distribuidora B2B.',
      'O cliente está vendo este produto:',
      JSON.stringify({
        name: product.name,
        code: product.code ?? null,
        brand: product.brand ?? null,
        price: product.price ?? null,
        category: product.category ?? null,
        description: product.description ?? null,
      }),
      '',
      'Catálogo disponível (escolha SOMENTE itens desta lista, pelo id):',
      JSON.stringify(list),
      '',
      'Selecione de 3 a 4 produtos que aumentem o ticket: itens complementares, acessórios necessários para a instalação/uso, ou upgrades.',
      'Não repita o produto atual. Para cada escolha escreva um motivo curto em português (máx. 90 caracteres), voltado a venda.',
      'Responda apenas com JSON no formato: {"suggestions":[{"id":"...","reason":"..."}]}',
    ].join('\n');

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.7-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const status = res.status;
      const message =
        status === 429
          ? 'Muitas solicitações, tente novamente em instantes.'
          : status === 402
            ? 'Créditos de IA esgotados.'
            : 'Não foi possível gerar sugestões agora.';
      return json({ error: message }, status === 429 || status === 402 ? status : 502);
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = {}; }
      }
    }

    const validIds = new Set(list.map((c) => c.id));
    const suggestions = (Array.isArray(parsed?.suggestions) ? parsed.suggestions : [])
      .filter((s: any) => s && validIds.has(s.id))
      .slice(0, 4)
      .map((s: any) => ({ id: String(s.id), reason: String(s.reason ?? '').slice(0, 120) }));

    return json({ suggestions });
  } catch (_err) {
    return json({ error: 'Não foi possível gerar sugestões agora.' }, 500);
  }
});
