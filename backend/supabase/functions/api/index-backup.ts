import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";

const app = new Hono().basePath("/api");
app.use("/*", cors());

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

app.get("/", (c) => c.json({ status: "ok", message: "Monad x402 API" }));
app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/snippets", async (c) => {
  const { data, error } = await supabase.from("snippets").select("*").eq("is_active", true);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, data });
});

app.get("/stats", async (c) => {
  const { count } = await supabase.from("snippets").select("*", { count: "exact", head: true });
  return c.json({ success: true, data: { total_snippets: count || 0 } });
});

Deno.serve(app.fetch);
