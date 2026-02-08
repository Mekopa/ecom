#!/usr/bin/env node

/**
 * sync-to-prod.mjs
 *
 * Reads all product data (categories, tags, products, variants, images)
 * from a source Medusa instance and recreates them on a target instance.
 *
 * Usage:
 *   TARGET_URL=https://backend-production-0de0.up.railway.app \
 *   TARGET_EMAIL=admin@yourmail.com \
 *   TARGET_PASSWORD=your-password \
 *   node backend/src/scripts/sync-to-prod.mjs
 *
 * Optional:
 *   SOURCE_URL=http://localhost:9000  (default)
 *   --skip-delete   Skip deleting existing products/tags on target
 *   --dry-run       Show what would be synced without making changes
 */

// ── Config ──────────────────────────────────────────────────────────────────

const SOURCE = {
  base: process.env.SOURCE_URL || "http://localhost:9000",
  email: process.env.SOURCE_EMAIL || "admin@electrostore.com",
  password: process.env.SOURCE_PASSWORD || "supersecret",
}

const TARGET = {
  base: process.env.TARGET_URL,
  email: process.env.TARGET_EMAIL,
  password: process.env.TARGET_PASSWORD,
}

const SKIP_DELETE = process.argv.includes("--skip-delete")
const DRY_RUN = process.argv.includes("--dry-run")

if (!TARGET.base || !TARGET.email || !TARGET.password) {
  console.error("Missing required env vars: TARGET_URL, TARGET_EMAIL, TARGET_PASSWORD")
  process.exit(1)
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

function createApi(base, token) {
  return async function api(method, path, body) {
    const url = `${base}${path}`
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(url, opts)
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
    }
    if (res.status === 204) return null
    return res.json()
  }
}

async function authenticate(base, email, password) {
  const res = await fetch(`${base}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`Auth failed on ${base}: ${res.status}`)
  const data = await res.json()
  return data.token
}

async function uploadImage(base, token, imageUrl) {
  // Download image from source
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) {
    console.warn(`    ⚠ Could not download image: ${imageUrl}`)
    return null
  }

  const contentType = imgRes.headers.get("content-type") || "image/jpeg"
  const buffer = Buffer.from(await imgRes.arrayBuffer())

  // Determine filename from URL
  const urlPath = new URL(imageUrl).pathname
  const filename = urlPath.split("/").pop() || "image.jpg"

  // Upload to target via multipart form data
  const boundary = `----FormBoundary${Date.now()}`
  const ext = filename.split(".").pop() || "jpg"
  const mimeType = contentType.startsWith("image/") ? contentType : `image/${ext}`

  const header = `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  const footer = `\r\n--${boundary}--\r\n`

  const headerBuf = Buffer.from(header)
  const footerBuf = Buffer.from(footer)
  const body = Buffer.concat([headerBuf, buffer, footerBuf])

  const uploadRes = await fetch(`${base}/admin/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body,
  })

  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "")
    console.warn(`    ⚠ Upload failed: ${uploadRes.status} ${text.slice(0, 200)}`)
    return null
  }

  const uploadData = await uploadRes.json()
  return uploadData.files?.[0]?.url || null
}

// ── Fetch all pages ─────────────────────────────────────────────────────────

async function fetchAll(api, path, key, extraQuery = "") {
  const items = []
  let offset = 0
  const limit = 100
  while (true) {
    const sep = path.includes("?") ? "&" : "?"
    const data = await api("GET", `${path}${sep}limit=${limit}&offset=${offset}${extraQuery}`)
    const page = data[key] || []
    items.push(...page)
    if (page.length < limit) break
    offset += limit
  }
  return items
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Medusa Sync: Source → Target")
  console.log("═══════════════════════════════════════")
  console.log(`  Source: ${SOURCE.base}`)
  console.log(`  Target: ${TARGET.base}`)
  if (DRY_RUN) console.log("  ⚡ DRY RUN — no changes will be made")
  if (SKIP_DELETE) console.log("  ⏭  Skipping delete of existing data")
  console.log()

  // ── 1. Authenticate ────────────────────────────────────────────────────
  console.log("🔐 Authenticating...")
  const sourceToken = await authenticate(SOURCE.base, SOURCE.email, SOURCE.password)
  const srcApi = createApi(SOURCE.base, sourceToken)
  console.log("  ✓ Source authenticated")

  const targetToken = await authenticate(TARGET.base, TARGET.email, TARGET.password)
  const tgtApi = createApi(TARGET.base, targetToken)
  console.log("  ✓ Target authenticated")
  console.log()

  // ── 2. Read source data ────────────────────────────────────────────────
  console.log("📖 Reading source data...")

  const srcCategories = await fetchAll(srcApi, "/admin/product-categories", "product_categories")
  console.log(`  Categories: ${srcCategories.length}`)

  const srcTags = await fetchAll(srcApi, "/admin/product-tags", "product_tags")
  console.log(`  Tags: ${srcTags.length}`)

  const srcProducts = await fetchAll(
    srcApi,
    "/admin/products?fields=*variants,*variants.prices,*variants.options,*options,*options.values,*images,*tags,*categories,+metadata",
    "products"
  )
  console.log(`  Products: ${srcProducts.length}`)

  const totalVariants = srcProducts.reduce((n, p) => n + (p.variants?.length || 0), 0)
  console.log(`  Variants: ${totalVariants}`)

  const totalImages = srcProducts.reduce(
    (n, p) => n + (p.thumbnail ? 1 : 0) + (p.images?.length || 0),
    0
  )
  console.log(`  Images to sync: ${totalImages}`)
  console.log()

  if (DRY_RUN) {
    console.log("✅ Dry run complete. No changes made.")
    return
  }

  // ── 3. Map/create categories on target ─────────────────────────────────
  console.log("📁 Syncing categories...")
  const tgtCategories = await fetchAll(tgtApi, "/admin/product-categories", "product_categories")
  const tgtCatByHandle = new Map(tgtCategories.map((c) => [c.handle, c]))

  const categoryIdMap = new Map() // source ID → target ID

  for (const srcCat of srcCategories) {
    const existing = tgtCatByHandle.get(srcCat.handle)
    if (existing) {
      categoryIdMap.set(srcCat.id, existing.id)
      console.log(`  ✓ ${srcCat.name} (exists)`)
    } else {
      // Create missing category
      const { product_category } = await tgtApi("POST", "/admin/product-categories", {
        name: srcCat.name,
        handle: srcCat.handle,
        description: srcCat.description || undefined,
        is_active: true,
        is_internal: false,
        metadata: srcCat.metadata || undefined,
      })
      categoryIdMap.set(srcCat.id, product_category.id)
      tgtCatByHandle.set(srcCat.handle, product_category)
      console.log(`  ✓ ${srcCat.name} (created)`)
    }
  }

  // Handle parent-child relationships
  for (const srcCat of srcCategories) {
    if (srcCat.parent_category_id) {
      const tgtId = categoryIdMap.get(srcCat.id)
      const tgtParentId = categoryIdMap.get(srcCat.parent_category_id)
      if (tgtId && tgtParentId) {
        const existing = tgtCatByHandle.get(srcCat.handle)
        if (existing && existing.parent_category_id !== tgtParentId) {
          await tgtApi("POST", `/admin/product-categories/${tgtId}`, {
            parent_category_id: tgtParentId,
          })
        }
      }
    }
  }
  console.log()

  // ── 4. Sync tags ───────────────────────────────────────────────────────
  console.log("🏷️  Syncing tags...")

  if (!SKIP_DELETE) {
    const existingTags = await fetchAll(tgtApi, "/admin/product-tags", "product_tags")
    if (existingTags.length > 0) {
      console.log(`  Deleting ${existingTags.length} existing tags...`)
      for (const t of existingTags) {
        await tgtApi("DELETE", `/admin/product-tags/${t.id}`)
      }
    }
  }

  const tagIdMap = new Map() // source tag ID → target tag ID
  for (const srcTag of srcTags) {
    const { product_tag } = await tgtApi("POST", "/admin/product-tags", {
      value: srcTag.value,
      metadata: srcTag.metadata || undefined,
    })
    tagIdMap.set(srcTag.id, product_tag.id)
    console.log(`  ✓ ${srcTag.value} → ${product_tag.id}`)
  }
  console.log()

  // ── 5. Get target sales channel + shipping profile ─────────────────────
  console.log("⚙️  Fetching target defaults...")
  const { sales_channels } = await tgtApi("GET", "/admin/sales-channels?limit=1")
  const salesChannelId = sales_channels[0]?.id
  if (!salesChannelId) throw new Error("No sales channel found on target")
  console.log(`  Sales channel: ${salesChannelId}`)

  const { shipping_profiles } = await tgtApi("GET", "/admin/shipping-profiles?limit=1")
  const shippingProfileId = shipping_profiles[0]?.id
  if (!shippingProfileId) throw new Error("No shipping profile found on target")
  console.log(`  Shipping profile: ${shippingProfileId}`)
  console.log()

  // ── 6. Delete existing products on target ──────────────────────────────
  if (!SKIP_DELETE) {
    console.log("🗑️  Deleting existing products on target...")
    const existingProducts = await fetchAll(tgtApi, "/admin/products", "products")
    if (existingProducts.length > 0) {
      console.log(`  Deleting ${existingProducts.length} products...`)
      for (const p of existingProducts) {
        await tgtApi("DELETE", `/admin/products/${p.id}`)
      }
      console.log("  ✓ All products deleted")
    } else {
      console.log("  No existing products")
    }
    console.log()
  }

  // ── 7. Create products on target ───────────────────────────────────────
  console.log(`🛒 Creating ${srcProducts.length} products...`)
  console.log()

  let created = 0
  let imagesSynced = 0

  for (const srcProduct of srcProducts) {
    const idx = `[${++created}/${srcProducts.length}]`

    // Map category IDs
    const categories = (srcProduct.categories || [])
      .map((c) => categoryIdMap.get(c.id))
      .filter(Boolean)
      .map((id) => ({ id }))

    // Map tag IDs
    const tags = (srcProduct.tags || [])
      .map((t) => tagIdMap.get(t.id))
      .filter(Boolean)
      .map((id) => ({ id }))

    // Sync images
    let thumbnail = null
    const images = []

    if (srcProduct.thumbnail) {
      const url = await uploadImage(TARGET.base, targetToken, srcProduct.thumbnail)
      if (url) {
        thumbnail = url
        imagesSynced++
      }
    }

    if (srcProduct.images?.length > 0) {
      for (const img of srcProduct.images) {
        const url = await uploadImage(TARGET.base, targetToken, img.url)
        if (url) {
          images.push({ url })
          imagesSynced++
        }
      }
    }

    // Build options
    const options = (srcProduct.options || []).map((opt) => ({
      title: opt.title,
      values: (opt.values || []).map((v) => v.value),
    }))

    // Build variants
    const variants = (srcProduct.variants || []).map((v) => {
      const optionsObj = {}
      for (const vo of v.options || []) {
        // Find the option title from the product options
        const opt = srcProduct.options?.find((o) => o.id === vo.option_id)
        if (opt) {
          optionsObj[opt.title] = vo.value
        }
      }

      const prices = (v.prices || [])
        .filter((p) => p.currency_code)
        .map((p) => ({
          amount: p.amount,
          currency_code: p.currency_code,
        }))

      return {
        title: v.title,
        sku: v.sku || undefined,
        barcode: v.barcode || undefined,
        ean: v.ean || undefined,
        upc: v.upc || undefined,
        manage_inventory: false,
        options: optionsObj,
        prices,
      }
    })

    // Create product
    const productPayload = {
      title: srcProduct.title,
      handle: srcProduct.handle,
      subtitle: srcProduct.subtitle || undefined,
      description: srcProduct.description || undefined,
      status: srcProduct.status || "published",
      thumbnail: thumbnail || undefined,
      images: images.length > 0 ? images : undefined,
      metadata: srcProduct.metadata || undefined,
      weight: srcProduct.weight || undefined,
      length: srcProduct.length || undefined,
      height: srcProduct.height || undefined,
      width: srcProduct.width || undefined,
      material: srcProduct.material || undefined,
      origin_country: srcProduct.origin_country || undefined,
      hs_code: srcProduct.hs_code || undefined,
      categories: categories.length > 0 ? categories : undefined,
      tags: tags.length > 0 ? tags : undefined,
      sales_channels: [{ id: salesChannelId }],
      shipping_profile_id: shippingProfileId,
      options,
      variants,
    }

    try {
      await tgtApi("POST", "/admin/products", productPayload)
      const varCount = variants.length
      const imgCount = (thumbnail ? 1 : 0) + images.length
      const imgNote = imgCount > 0 ? ` (${imgCount} images)` : ""
      console.log(`  ${idx} ✓ ${srcProduct.title} (${varCount} variants)${imgNote}`)
    } catch (err) {
      console.error(`  ${idx} ✗ ${srcProduct.title}: ${err.message}`)
    }
  }

  console.log()
  console.log("═══════════════════════════════════════")
  console.log(`✅ Done! ${created} products synced.`)
  if (imagesSynced > 0) console.log(`   ${imagesSynced} images transferred.`)
  console.log()
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
