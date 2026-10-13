# KIVA architecture

1. User authenticates with Supabase.
2. User creates a workspace and brand.
3. Brand assets go into a private Storage bucket.
4. The analyze-brand Edge Function verifies the user, workspace membership, usage limits and asset ownership.
5. AI returns structured brand tokens and visual rules.
6. User reviews and approves the profile.
7. Templates apply approved tokens to Fabric.js objects.
8. Canvas rendering and PNG export happen in the browser to reduce server compute.

Principles: deterministic layout for exact text, logos and colors; AI suggests rather than redraws logos; store editable canvas JSON as the primary project; keep secrets server-side; protect every workspace-owned row with RLS.