import GlassCard from "@/components/GlassCard";
import NavBar from "@/components/NavBar";

const AdminPage = () => {
  const curlCommand = `curl -X POST https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "YOUR_PROJECT"}.supabase.co/functions/v1/trigger-analysis \\
  -H "x-admin-key: YOUR_ADMIN_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "conflict_id": "YOUR_CONFLICT_UUID",
    "date": "2025-03-04",
    "title": "Event title",
    "description": "What happened and why it matters.",
    "category": "military",
    "significance": "high",
    "sources": ["Reuters", "AP"]
  }'`;

  return (
    <div className="min-h-screen bg-base">
      <NavBar />
      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4 md:px-8 space-y-6">
        <h1 className="font-display text-3xl font-extrabold text-foreground">Admin — Trigger Analysis</h1>
        <p className="text-muted-foreground">
          Use the following curl command to trigger a new AI analysis for a conflict. You need:
        </p>
        <ul className="text-sm text-muted-foreground list-disc pl-6 space-y-1">
          <li><code className="font-mono text-accent-color">OPENROUTER_API_KEY</code> — set as Supabase Edge Function secret</li>
          <li><code className="font-mono text-accent-color">ADMIN_SECRET</code> — set as Supabase Edge Function secret</li>
        </ul>
        <GlassCard>
          <pre className="font-mono text-sm text-foreground overflow-x-auto whitespace-pre-wrap">
            {curlCommand}
          </pre>
        </GlassCard>
        <button
          onClick={() => navigator.clipboard.writeText(curlCommand)}
          className="font-mono-label px-4 py-2 rounded-lg bg-accent-dim text-accent-color hover:bg-[hsl(var(--bg-glass-hover))] transition-all"
        >
          COPY TO CLIPBOARD
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
