const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domains } = await req.json();

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'domains array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check availability via DNS lookup - if no DNS records exist, domain is likely available
    const results = await Promise.all(
      domains.map(async (domain: string) => {
        try {
          const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
          const data = await res.json();
          // Status 3 = NXDOMAIN (domain doesn't exist = likely available)
          // If Answer exists with records, domain is taken
          const isAvailable = data.Status === 3 || (!data.Answer || data.Answer.length === 0);
          return { domain, available: isAvailable };
        } catch {
          return { domain, available: null }; // unknown
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
