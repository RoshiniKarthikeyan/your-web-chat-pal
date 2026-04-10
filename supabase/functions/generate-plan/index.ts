import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subjects, hoursPerDay, durationDays, goals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a study planner. Create a detailed, day-by-day study schedule.
Return ONLY valid JSON with this structure:
{
  "title": "Study Plan Title",
  "schedule": [
    {
      "day": 1,
      "date": "Day 1",
      "tasks": [
        { "subject": "...", "topic": "...", "duration": "1h", "type": "study|review|practice" }
      ]
    }
  ],
  "tips": ["tip1", "tip2"]
}
Do not include any text outside the JSON.`,
          },
          {
            role: "user",
            content: `Create a study plan:
- Subjects: ${subjects}
- Hours per day: ${hoursPerDay}
- Duration: ${durationDays} days
- Goals: ${goals || "General preparation"}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to generate plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      plan = { title: "Study Plan", schedule: [], tips: [] };
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
