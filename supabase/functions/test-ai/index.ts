import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

serve(async (req) => {
  const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!openrouterKey) {
    return new Response(JSON.stringify({ error: "KEY_MISSING", details: "OPENROUTER_API_KEY non trovata nei segreti" }), { status: 500 });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey}`,
        "HTTP-Referer": "https://synapsi.app",
        "X-Title": "Synapsi Diagnostic",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Rispondi 'OK' se mi senti." }],
        max_tokens: 10,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ 
      status: res.status, 
      ok: res.ok, 
      response: data,
      key_preview: openrouterKey.substring(0, 10) + "..." 
    }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "FETCH_ERROR", details: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
});
