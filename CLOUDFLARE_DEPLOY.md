# Cloudflare Workers deployment

This Next.js app is configured for Cloudflare Workers with the OpenNext adapter.

## Deploy

1. In Cloudflare, create an application under **Workers & Pages**, select **GitHub**, and connect `PromptAveron/PromptAveron-site` on the `main` branch.
2. Set the Workers Builds command to `pnpm run build:cloudflare` and the deploy command to `pnpm run deploy:cloudflare`.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, and `IMAGEKIT_URL_ENDPOINT` to the build variables. Set the Supabase URL and anon key as runtime Worker secrets as well. Configure `IMAGEKIT_URL_ENDPOINT` as a Worker variable and `IMAGEKIT_PRIVATE_KEY` as a Worker secret for authenticated admin uploads. Do not commit any secret values.
4. Visit `https://promptavero.imgprompts.workers.dev`. The Worker URL is also the canonical public site URL; update `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` and the Cloudflare build variable if the canonical domain changes.

The Worker uses the `promptavero-site-opennext-cache` KV namespace for incremental caching and the `promptavero-site-tags` D1 database for on-demand cache-tag revalidation. KV is eventually consistent, so cache updates may take time to propagate globally. R2 was not enabled on the selected Cloudflare account; enabling R2 and switching to the R2 incremental-cache adapter is recommended if immediate cache consistency is required. Cloudflare image transformations are disabled for this deployment to avoid usage-based image transformation charges; existing images are served directly from their source URLs.

The app uses bundled prompt data when Supabase is not configured. For the Supabase-backed CMS, configure both Supabase values as Worker secrets before deployment. `SUPABASE_SERVICE_ROLE_KEY` is not used by the deployed app and must not be added as a Worker secret.
