# Sync Products to Production

Sync all product data (categories, tags, products, variants, images) from local dev to the production Medusa backend on Railway.

## Prerequisites

- Local backend must be running at `http://localhost:9000`
- Production backend: `https://backend-production-0de0.up.railway.app`

## Steps

1. First, confirm the local backend is running by checking `http://localhost:9000/health`
2. Ask the user if they want to run a `--dry-run` first to preview changes, or sync directly
3. Run the sync script:

```bash
TARGET_URL=https://backend-production-0de0.up.railway.app \
TARGET_EMAIL=admin@yourmail.com \
TARGET_PASSWORD=b9n80rbbs6v5ehd1dfz6ssgnk2adkt93 \
node backend/src/scripts/sync-to-prod.mjs $ARGUMENTS
```

The `$ARGUMENTS` variable should include any flags the user requests:
- `--dry-run` — Preview what would be synced without making changes
- `--skip-delete` — Don't delete existing products/tags on target before syncing (useful for preserving production images)

4. After the sync completes, check if the user wants to clean up any leftover default Medusa categories (shirts, sweatshirts, pants, merch) on production by authenticating and deleting them via the admin API.

5. Optionally trigger a storefront redeploy to clear the Next.js cache:

```bash
railway redeploy -s Storefront --yes
```

## Important Notes

- **Images**: The sync transfers images only if products have them on the source. Local dev products created by the seed script have no images — those must be uploaded via the Medusa Admin panel first.
- **Regions**: The sync does NOT transfer regions/currencies. Production has Europe (eur) only. Local dev may have additional regions (US, etc.).
- **The sync deletes existing products on target by default.** If production has images or data you want to preserve, use `--skip-delete`.
