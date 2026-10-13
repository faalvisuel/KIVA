# KIVA

KIVA is an AI-assisted brand-aware design studio. Businesses upload brand guidelines, validate a reusable brand profile, then create editable marketing visuals from controlled templates.

## Stack
React + TypeScript + Vite, Tailwind CSS, Supabase Auth/Postgres/Storage/Edge Functions, Fabric.js.

## Local setup
1. Install Node.js 20+.
2. Copy .env.example to .env.local.
3. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
4. Run npm install, then npm run dev.

## Supabase
Use the Supabase CLI to link your project and apply migrations:

    npx supabase login
    npx supabase link --project-ref YOUR_PROJECT_REF
    npx supabase db push

Set AI_API_KEY using Supabase Function secrets. The AI provider adapter is intentionally a placeholder and must be implemented before live AI analysis.

## Security
Never commit service-role keys or AI secrets. Keep private uploads in private storage, enforce RLS, validate file types and sizes, and validate AI output against a schema.

## Status
MVP scaffold. Dashboard and a local canvas starter are included. Cloud persistence, production auth screens, provider-specific AI, robust PDF parsing, billing and end-to-end tests remain to be implemented.