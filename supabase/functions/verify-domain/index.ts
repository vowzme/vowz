import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EXPECTED_IP = '185.158.133.1';
const EXPECTED_CNAME = 'wedding-tales-ai.lovable.app';

async function checkDNS(domain: string): Promise<{ hasA: boolean; hasCNAME: boolean; records: string[] }> {
  const records: string[] = [];
  let hasA = false;
  let hasCNAME = false;

  // Check A records
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const data = await res.json();
    if (data.Answer) {
      for (const ans of data.Answer) {
        records.push(`A: ${ans.data}`);
        if (ans.data === EXPECTED_IP) hasA = true;
      }
    }
  } catch (e) {
    console.error('A record check failed:', e);
  }

  // Check CNAME records
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`);
    const data = await res.json();
    if (data.Answer) {
      for (const ans of data.Answer) {
        records.push(`CNAME: ${ans.data}`);
        if (ans.data.replace(/\.$/, '') === EXPECTED_CNAME) hasCNAME = true;
      }
    }
  } catch (e) {
    console.error('CNAME record check failed:', e);
  }

  // Also check www subdomain
  try {
    const res = await fetch(`https://dns.google/resolve?name=www.${encodeURIComponent(domain)}&type=A`);
    const data = await res.json();
    if (data.Answer) {
      for (const ans of data.Answer) {
        records.push(`www A: ${ans.data}`);
      }
    }
  } catch (e) {
    // non-critical
  }

  return { hasA, hasCNAME, records };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const { siteId, domain, action } = await req.json();

    if (!siteId || !domain) {
      return new Response(
        JSON.stringify({ error: 'siteId and domain are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(domain)) {
      return new Response(
        JSON.stringify({ error: 'Invalid domain format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify site ownership
    const { data: site, error: siteError } = await supabase
      .from('wedding_sites')
      .select('id, user_id, custom_domain, domain_status')
      .eq('id', siteId)
      .eq('user_id', userId)
      .single();

    if (siteError || !site) {
      return new Response(
        JSON.stringify({ error: 'Site not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'save') {
      // Save domain and set status to pending
      const { error: updateError } = await supabase
        .from('wedding_sites')
        .update({ custom_domain: domain.toLowerCase(), domain_status: 'pending' })
        .eq('id', siteId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, status: 'pending', message: 'Domain saved. Configure your DNS records and verify.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      // Check DNS records
      const dns = await checkDNS(domain.toLowerCase());
      console.log(`DNS check for ${domain}:`, dns);

      let newStatus: string;
      let message: string;

      if (dns.hasA) {
        // A record points to our IP — domain is verified and will be live once SSL is provisioned
        newStatus = 'verified';
        message = 'DNS verified! Your domain is pointing to our servers. SSL will be provisioned automatically.';
      } else if (dns.hasCNAME) {
        newStatus = 'verified';
        message = 'CNAME verified! Your domain is pointing to our servers.';
      } else {
        newStatus = 'pending';
        message = `DNS records not yet detected. Found: ${dns.records.length > 0 ? dns.records.join(', ') : 'none'}. It may take up to 72 hours to propagate.`;
      }

      // Update status in database
      const { error: updateError } = await supabase
        .from('wedding_sites')
        .update({ domain_status: newStatus })
        .eq('id', siteId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, status: newStatus, message, dns_records: dns.records }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      const { error: updateError } = await supabase
        .from('wedding_sites')
        .update({ custom_domain: null, domain_status: 'none' })
        .eq('id', siteId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, status: 'none', message: 'Domain disconnected.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use save, verify, or disconnect.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
