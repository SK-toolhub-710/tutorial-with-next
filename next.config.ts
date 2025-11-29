import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/scrape") {
    return new Response(JSON.stringify({ msg: "Server running!" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  return new Response("Hello World", { status: 200 });
});
