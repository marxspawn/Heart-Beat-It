import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Fitbit subscription verification (GET with verify param)
  const url = new URL(req.url);
  const verifyCode = url.searchParams.get("verify");
  if (req.method === "GET" && verifyCode !== null) {
    // Fitbit sends a verification code; respond 204 if it matches your configured code
    const expectedCode = Deno.env.get("FITBIT_VERIFY_CODE");
    if (verifyCode === expectedCode) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    return new Response(null, { status: 404, headers: corsHeaders });
  }

  // POST: Fitbit sends heart rate notifications
  if (req.method === "POST") {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const body = await req.json();

      // Fitbit webhook payload can be an array of notification objects
      // Each contains collectionType, date, ownerId, ownerType, subscriptionId
      // We need to fetch actual HR data using the Fitbit API, or accept direct BPM posts

      // Support two modes:
      // 1. Direct BPM post: { bpm: number, status?: string }
      // 2. Array of direct posts: [{ bpm: number, status?: string }, ...]
      const entries = Array.isArray(body) ? body : [body];

      const rows = entries
        .filter((e: any) => typeof e.bpm === "number")
        .map((e: any) => ({
          bpm: e.bpm,
          status: e.status || (e.bpm > 110 ? "high" : e.bpm < 50 ? "low" : "normal"),
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("heart_rates").insert(rows);
        if (error) {
          console.error("Insert error:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Always return 204 for Fitbit webhook compatibility
      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
