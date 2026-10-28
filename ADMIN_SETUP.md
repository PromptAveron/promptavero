# PromptAvero admin setup

The `/admin` area uses Supabase Auth, PostgreSQL row-level security, and the `prompt-images` Storage bucket. Admin signup is not exposed by the application.

## Configure Supabase

1. Create a Supabase project and copy its project URL and publishable/anon key to `.env.local` using [.env.example](./.env.example) as the template. Never put a service-role key in a `NEXT_PUBLIC_` variable or browser code.
2. Apply [`supabase/migrations/202610260001_admin_cms.sql`](./supabase/migrations/202610260001_admin_cms.sql) in the Supabase SQL editor or through the Supabase CLI.
3. Apply [`supabase/migrations/202610260002_branding_consent.sql`](./supabase/migrations/202610260002_branding_consent.sql) to enable site logo/favicon storage and the safely filtered public settings function.
4. Apply [`supabase/migrations/202610260003_ad_network_codes.sql`](./supabase/migrations/202610260003_ad_network_codes.sql) to expose the configured ad snippets through the public-safe settings function.
5. Apply [`supabase/migrations/202610280001_prompt_engagement.sql`](./supabase/migrations/202610280001_prompt_engagement.sql) to enable prompt likes and copy counts.
6. Apply [`supabase/migrations/202610280002_prompt_copy_cooldown.sql`](./supabase/migrations/202610280002_prompt_copy_cooldown.sql) to count no more than one prompt copy per browser per 30 seconds.
7. Apply [`supabase/migrations/202610280003_toggle_prompt_likes.sql`](./supabase/migrations/202610280003_toggle_prompt_likes.sql) to allow visitors to remove their likes.
8. Apply [`supabase/migrations/202610280004_fix_prompt_like_counts.sql`](./supabase/migrations/202610280004_fix_prompt_like_counts.sql) to increment totals correctly and reconcile counts for existing likes.
9. In Supabase Auth, create the initial administrator through a trusted operator-only process. Disable public signups.
10. Set the initial admin user's **app metadata** role to `admin` using the Supabase dashboard's trusted user-management controls or a server-side administrative script. Do not set `user_metadata.role`; users can edit their own user metadata. The RLS policies and server checks use only the signed app-metadata claim.
11. For a fresh project, run `pnpm seed:content` once to import the bundled public prompt and category content, including images. Set `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ADMIN_USER_ID` only in the private environment used by the one-time import process. The importer skips existing slugs and is safe to rerun; it does not overwrite admin-managed records.
12. Restart the Next.js process and visit `/admin/`.

The application's database client uses the signed-in user's session and the anon key. No service-role key is needed by the dashboard or public website. The migration creates the `prompt-images` public-read/private-write bucket, restricts upload MIME types and size, grants writes only to app-metadata administrators, and enforces a maximum of five image rows per prompt with a transaction-scoped database lock. `proxy.ts` refreshes Supabase auth cookies; every protected page and mutation additionally verifies the current administrator claim.

## Included admin capabilities

- Email/password sign-in; no public registration; server-checked `app_metadata.role === "admin"`.
- Dashboard counts and recently edited prompt rows sourced from PostgreSQL.
- Prompt draft/publish, editing, searching, filtering, ordering, pagination, duplication, trashing, and image upload/metadata/order/primary-image management.
- Category create/edit/delete with usage checks.
- Media library with prompt associations and metadata edits.
- Persisted global SEO and site settings, including branding, automatically loaded analytics/advertising, and search verification.

When Supabase is configured, public home, category, prompt, explore, and sitemap routes use published database records; without Supabase configuration, the existing bundled JSON content continues to render. Configured analytics and ads load automatically on public routes and are not included on admin routes. Ad-unit snippets are isolated in sandboxed frames; only paste code from ad networks you trust. Ensure your privacy disclosures and consent behavior comply with requirements that apply to your site. Prompt-level SEO title, description, canonical URL, and indexing preferences are applied by public prompt pages and the sitemap.

Public visitors can toggle their like on each prompt using a random identifier stored in local storage. Prompt copies increment a shared database counter at most once per browser per prompt every 30 seconds. Engagement counts are fetched without the public-content cache so refreshes show current global totals.

## Run locally

```sh
pnpm install
pnpm dev
```

Build/type-check before deployment with:

```sh
pnpm exec tsc --noEmit
pnpm build
```

Do not claim production authentication, database policies, or uploads have been verified until the migration and auth setup are applied to a Supabase project and exercised there.

## Verification checklist

- With no Supabase URL/key configured, `/admin/` shows setup guidance; the existing public JSON content still renders.
- After setup, an unauthenticated `/admin/` request redirects to `/admin/login/`; a signed-in account without app metadata role `admin` is rejected.
- An admin can create a category, create a draft, edit/publish/unpublish it, and find it through list search and filters.
- After the initial import or creating a published prompt with at least one image, verify it appears on the home/explore/category routes and is included in the sitemap.
- Upload five supported images to a prompt; a sixth must fail in the UI and at the database policy/trigger layer. Check reordering, primary image, alt text, replacement, and deletion.
- Verify category deletion is refused while prompts reference it; check SEO fields, settings save/refresh, mobile navigation, and sign-out.
- Verify public analytics/ad code loads only when configured, including listing ads and both prompt-page placements; confirm none load in admin routes.
- After applying the prompt engagement migration, verify likes increment once per browser and successful prompt copies update the displayed count.
- Apply the copy cooldown migration, then verify repeated copies from one browser within 30 seconds only increment once; counts should match across browsers after reload.
