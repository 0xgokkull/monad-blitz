Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ 
      status: "ok", 
      message: "Monad x402 API Working!",
      timestamp: new Date().toISOString(),
      path: new URL(req.url).pathname
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
