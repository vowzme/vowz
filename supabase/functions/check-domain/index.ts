const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RDAP bootstrap servers for different TLDs
const RDAP_SERVERS: Record<string, string> = {
  com: 'https://rdap.verisign.com/com/v1',
  net: 'https://rdap.verisign.com/net/v1',
  org: 'https://rdap.org/org/v1',
  in: 'https://rdap.registry.in/v1',
  love: 'https://rdap.donuts.co/rdap/v1',
  wedding: 'https://rdap.donuts.co/rdap/v1',
  life: 'https://rdap.donuts.co/rdap/v1',
  xyz: 'https://rdap.nic.xyz/v1',
  me: 'https://rdap.nic.me/v1',
  co: 'https://rdap.nic.co/v1',
};

async function checkDomainRDAP(domain: string): Promise<boolean | null> {
  const tld = domain.split('.').pop()?.toLowerCase() || '';
  const rdapServer = RDAP_SERVERS[tld];

  // Method 1: RDAP lookup (most accurate)
  if (rdapServer) {
    try {
      const res = await fetch(`${rdapServer}/domain/${encodeURIComponent(domain)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 404) return true;   // Not found = available
      if (res.status === 200) return false;   // Found = taken
    } catch {
      // RDAP failed, fall through to DNS
    }
  }

  // Method 2: DNS fallback via Google DoH
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      { signal: AbortSignal.timeout(4000) }
    );
    const data = await res.json();
    // NXDOMAIN (status 3) = likely available
    if (data.Status === 3) return true;
    // Has answer records = taken
    if (data.Answer && data.Answer.length > 0) return false;
    // No records but no NXDOMAIN = might be available (parked/unused)
    return null;
  } catch {
    return null;
  }
}

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

    // Limit to 20 domains per request
    const domainsToCheck = domains.slice(0, 20);

    // Check in parallel with concurrency limit of 5
    const results: { domain: string; available: boolean | null }[] = [];
    for (let i = 0; i < domainsToCheck.length; i += 5) {
      const batch = domainsToCheck.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(async (domain: string) => {
          const available = await checkDomainRDAP(domain);
          return { domain, available };
        })
      );
      results.push(...batchResults);
    }

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
