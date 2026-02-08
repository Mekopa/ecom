#!/usr/bin/env node

/**
 * seed-electronics.mjs
 *
 * Standalone seed script for Medusa 2.0 Admin API.
 * Creates ~50 realistic electronics products across 6 categories
 * with full variant matrices (Color × Storage, Color × Size, etc.).
 *
 * Images are intentionally omitted — manage them via the Admin panel.
 *
 * Usage: node backend/src/scripts/seed-electronics.mjs
 * Requires: Node 22+ (native fetch)
 */

const BASE_URL = "http://localhost:9000";

// ── IDs from the database ────────────────────────────────────────────
const SALES_CHANNEL_ID = "sc_01KGREJWRZ02J0PD1J7KKKKK5A";
const SHIPPING_PROFILE_ID = "sp_01KGREJSHEE00F0JNGMRGCNV9Y";

const CATEGORIES = {
  smartphones: "pcat_01KGRGE1TV9BVVXTSEPN0NSMNH",
  laptops: "pcat_01KGRGE1TWK62VKPDB60MPJH4C",
  audio: "pcat_01KGRGE1TWDDFEPA8WET43Z62Q",
  wearables: "pcat_01KGRGE1TWN7C78V4H8CN9D2PT",
  cameras: "pcat_01KGRGE1TX9PKM0BS8HEDMJ8DG",
  accessories: "pcat_01KGRGE1TXWGBXTQJQBRKVXJ2X",
};

// ── Currency multipliers (relative to USD) ───────────────────────────
const FX = { usd: 1, eur: 0.92, gbp: 0.79, try: 32 };

function prices(usdCents) {
  return Object.entries(FX).map(([code, rate]) => ({
    amount: Math.round(usdCents * rate),
    currency_code: code,
  }));
}

// ── Variant matrix helpers ───────────────────────────────────────────

/** Cartesian product of option value arrays */
function crossProduct(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = crossProduct(rest);
  return first.flatMap((val) => restProduct.map((combo) => [val, ...combo]));
}

/** Abbreviate an option value for SKU generation */
function abbrev(value, codes) {
  if (codes && codes[value]) return codes[value];
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
}

// ── API helpers ──────────────────────────────────────────────────────
let TOKEN = "";

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function authenticate() {
  const { token } = await api("POST", "/auth/user/emailpass", {
    email: "admin@electrostore.com",
    password: "supersecret",
  });
  TOKEN = token;
  console.log("✓ Authenticated");
}

async function deleteAllProducts() {
  const { products } = await api("GET", "/admin/products?limit=100");
  if (!products.length) {
    console.log("  No existing products to delete.");
    return;
  }
  console.log(`  Deleting ${products.length} existing products...`);
  for (const p of products) {
    await api("DELETE", `/admin/products/${p.id}`);
  }
  console.log("✓ All products deleted");
}

async function createProduct(data, index, total) {
  try {
    const { product } = await api("POST", "/admin/products", data);
    console.log(
      `  [${String(index + 1).padStart(2)}/${total}] ✓ ${product.title} (${data.variants.length} variants)`
    );
    return product;
  } catch (err) {
    console.error(
      `  [${String(index + 1).padStart(2)}/${total}] ✗ ${data.title}: ${err.message}`
    );
    return null;
  }
}

// ── Product builder ──────────────────────────────────────────────────
function buildProduct(def) {
  const { title, handle, description, category, options, basePriceUsd, priceAdders, skuBase, valueCodes, i18n } = def;

  const optionValues = options.map((o) => o.values);
  const combos = crossProduct(optionValues);

  const variants = combos.map((combo) => {
    const optMap = {};
    options.forEach((o, i) => {
      optMap[o.title] = combo[i];
    });

    let variantPrice = basePriceUsd;
    for (const [optTitle, adders] of Object.entries(priceAdders || {})) {
      const val = optMap[optTitle];
      if (adders && adders[val] !== undefined) variantPrice += adders[val];
    }

    const skuParts = combo.map((v) => abbrev(v, valueCodes));
    const sku = `${skuBase}-${skuParts.join("-")}`;
    const varTitle = combo.length === 1 ? combo[0] : combo.join(" / ");

    return {
      title: varTitle,
      sku,
      options: optMap,
      manage_inventory: false,
      prices: prices(variantPrice),
    };
  });

  return {
    title,
    handle,
    description,
    status: "published",
    categories: [{ id: CATEGORIES[category] }],
    sales_channels: [{ id: SALES_CHANNEL_ID }],
    options: options.map((o) => ({ title: o.title, values: o.values })),
    variants,
    metadata: { i18n },
  };
}

// ══════════════════════════════════════════════════════════════════════
// PRODUCT DATA
// ══════════════════════════════════════════════════════════════════════

const SMARTPHONES = [
  {
    title: "iPhone 16 Pro Max",
    handle: "iphone-16-pro-max",
    description: "The ultimate iPhone experience with a 6.9-inch Super Retina XDR display, A18 Pro chip, 48MP camera system with 5x optical zoom, and all-day battery life. Features titanium design and USB-C connectivity.",
    category: "smartphones",
    skuBase: "IPH16PM",
    options: [
      { title: "Color", values: ["Natural Titanium", "Black Titanium", "Desert Titanium"] },
      { title: "Storage", values: ["256GB", "512GB", "1TB"] },
    ],
    basePriceUsd: 119900,
    priceAdders: { Storage: { "256GB": 0, "512GB": 20000, "1TB": 40000 } },
    valueCodes: { "Natural Titanium": "NAT", "Black Titanium": "BLK", "Desert Titanium": "DST", "256GB": "256", "512GB": "512", "1TB": "1TB" },
    i18n: {
      tr: { title: "iPhone 16 Pro Max", description: "6.9 inç Super Retina XDR ekran, A18 Pro çip, 48MP kamera sistemi ve 5x optik zoom ile en üst düzey iPhone deneyimi. Titanyum tasarım ve tüm gün süren pil ömrü." },
      de: { title: "iPhone 16 Pro Max", description: "Das ultimative iPhone-Erlebnis mit 6,9-Zoll Super Retina XDR Display, A18 Pro Chip, 48MP Kamerasystem mit 5x optischem Zoom und ganztägiger Akkulaufzeit. Titandesign und USB-C." },
      fr: { title: "iPhone 16 Pro Max", description: "L'expérience iPhone ultime avec écran Super Retina XDR de 6,9 pouces, puce A18 Pro, système photo 48MP avec zoom optique 5x et autonomie d'une journée. Design en titane et USB-C." },
      pl: { title: "iPhone 16 Pro Max", description: "Najlepsze doświadczenie z iPhone z 6,9-calowym wyświetlaczem Super Retina XDR, chipem A18 Pro, systemem aparatów 48MP z 5-krotnym zoomem optycznym i całodzienną baterią." },
      lt: { title: "iPhone 16 Pro Max", description: "Aukščiausios klasės iPhone patirtis su 6,9 colio Super Retina XDR ekranu, A18 Pro lustu, 48MP kamerų sistema su 5x optiniu priartinimu ir visos dienos baterija." },
      et: { title: "iPhone 16 Pro Max", description: "Parim iPhone'i kogemus 6,9-tollise Super Retina XDR ekraani, A18 Pro kiibi, 48MP kaamerasüsteemi ja 5x optilise suumiga. Titaanist disain ja terve päeva aku." },
      lv: { title: "iPhone 16 Pro Max", description: "Augstākā līmeņa iPhone pieredze ar 6,9 collu Super Retina XDR displeju, A18 Pro čipu, 48MP kameru sistēmu ar 5x optisko tālummaiņu un pilnas dienas akumulatoru." },
    },
  },
  {
    title: "iPhone 16",
    handle: "iphone-16",
    description: "Powerful and colorful. Features a 6.1-inch Super Retina XDR display, A18 chip, advanced dual-camera system with 48MP main sensor, and Dynamic Island.",
    category: "smartphones",
    skuBase: "IPH16",
    options: [
      { title: "Color", values: ["Black", "White", "Ultramarine"] },
      { title: "Storage", values: ["128GB", "256GB", "512GB"] },
    ],
    basePriceUsd: 79900,
    priceAdders: { Storage: { "128GB": 0, "256GB": 10000, "512GB": 30000 } },
    valueCodes: { Ultramarine: "ULT", "128GB": "128", "256GB": "256", "512GB": "512" },
    i18n: {
      tr: { title: "iPhone 16", description: "Güçlü ve renkli. 6,1 inç Super Retina XDR ekran, A18 çip, 48MP ana sensörlü gelişmiş çift kamera sistemi ve Dynamic Island." },
      de: { title: "iPhone 16", description: "Leistungsstark und farbenfroh. 6,1-Zoll Super Retina XDR Display, A18 Chip, fortschrittliches Dual-Kamerasystem mit 48MP Hauptsensor und Dynamic Island." },
      fr: { title: "iPhone 16", description: "Puissant et coloré. Écran Super Retina XDR de 6,1 pouces, puce A18, double caméra avancée avec capteur principal 48MP et Dynamic Island." },
      pl: { title: "iPhone 16", description: "Wydajny i kolorowy. Wyświetlacz Super Retina XDR 6,1 cala, chip A18, zaawansowany podwójny aparat z sensorem głównym 48MP i Dynamic Island." },
      lt: { title: "iPhone 16", description: "Galingas ir spalvingas. 6,1 colio Super Retina XDR ekranas, A18 lustas, pažangi dviejų kamerų sistema su 48MP pagrindiniu jutikliu ir Dynamic Island." },
      et: { title: "iPhone 16", description: "Võimas ja värviline. 6,1-tolline Super Retina XDR ekraan, A18 kiip, täiustatud topeltkaamera 48MP põhisensoriga ja Dynamic Island." },
      lv: { title: "iPhone 16", description: "Jaudīgs un krāsains. 6,1 collu Super Retina XDR displejs, A18 čips, uzlabota dubultkameru sistēma ar 48MP galveno sensoru un Dynamic Island." },
    },
  },
  {
    title: "Samsung Galaxy S25 Ultra",
    handle: "galaxy-s25-ultra",
    description: "Samsung's most powerful smartphone with a 6.8-inch QHD+ Dynamic AMOLED display, Snapdragon 8 Elite chip, 200MP camera with AI-enhanced photography, built-in S Pen, and titanium frame.",
    category: "smartphones",
    skuBase: "GS25U",
    options: [
      { title: "Color", values: ["Titanium Black", "Titanium Gray", "Titanium Blue"] },
      { title: "Storage", values: ["256GB", "512GB", "1TB"] },
    ],
    basePriceUsd: 129900,
    priceAdders: { Storage: { "256GB": 0, "512GB": 12000, "1TB": 36000 } },
    valueCodes: { "Titanium Black": "BLK", "Titanium Gray": "GRY", "Titanium Blue": "BLU", "256GB": "256", "512GB": "512", "1TB": "1TB" },
    i18n: {
      tr: { title: "Samsung Galaxy S25 Ultra", description: "Samsung'un en güçlü akıllı telefonu. 6,8 inç QHD+ Dynamic AMOLED ekran, Snapdragon 8 Elite çip, AI destekli 200MP kamera, dahili S Pen ve titanyum çerçeve." },
      de: { title: "Samsung Galaxy S25 Ultra", description: "Samsungs leistungsstärkstes Smartphone mit 6,8-Zoll QHD+ Dynamic AMOLED Display, Snapdragon 8 Elite Chip, 200MP Kamera mit KI-Fotografie, integriertem S Pen und Titanrahmen." },
      fr: { title: "Samsung Galaxy S25 Ultra", description: "Le smartphone le plus puissant de Samsung avec écran Dynamic AMOLED QHD+ de 6,8 pouces, Snapdragon 8 Elite, appareil photo 200MP avec IA, S Pen intégré et cadre en titane." },
      pl: { title: "Samsung Galaxy S25 Ultra", description: "Najpotężniejszy smartfon Samsunga z 6,8-calowym wyświetlaczem QHD+ Dynamic AMOLED, chipem Snapdragon 8 Elite, aparatem 200MP z AI, wbudowanym S Pen i tytanową ramką." },
      lt: { title: "Samsung Galaxy S25 Ultra", description: "Galingiausias Samsung išmanusis telefonas su 6,8 colio QHD+ Dynamic AMOLED ekranu, Snapdragon 8 Elite lustu, 200MP kamera su AI fotografija, integruotu S Pen ir titano rėmeliu." },
      et: { title: "Samsung Galaxy S25 Ultra", description: "Samsungi võimsaim nutitelefon 6,8-tollise QHD+ Dynamic AMOLED ekraaniga, Snapdragon 8 Elite kiibiga, 200MP AI-kaameraga, sisseehitatud S Pen ja titaanraamiga." },
      lv: { title: "Samsung Galaxy S25 Ultra", description: "Samsung jaudīgākais viedtālrunis ar 6,8 collu QHD+ Dynamic AMOLED displeju, Snapdragon 8 Elite čipu, 200MP AI kameru, iebūvētu S Pen un titāna rāmi." },
    },
  },
  {
    title: "Samsung Galaxy S25",
    handle: "galaxy-s25",
    description: "A premium flagship experience in a compact form. 6.2-inch FHD+ Dynamic AMOLED display, Snapdragon 8 Elite, 50MP triple camera system, and 4000mAh battery with fast charging.",
    category: "smartphones",
    skuBase: "GS25",
    options: [
      { title: "Color", values: ["Navy", "Icy Blue", "Silver"] },
      { title: "Storage", values: ["128GB", "256GB"] },
    ],
    basePriceUsd: 79900,
    priceAdders: { Storage: { "128GB": 0, "256GB": 6000 } },
    valueCodes: { "Icy Blue": "ICY", Navy: "NAV", Silver: "SLV", "128GB": "128", "256GB": "256" },
    i18n: {
      tr: { title: "Samsung Galaxy S25", description: "Kompakt formda premium amiral gemisi deneyimi. 6,2 inç FHD+ Dynamic AMOLED ekran, Snapdragon 8 Elite, 50MP üçlü kamera sistemi ve hızlı şarjlı 4000mAh pil." },
      de: { title: "Samsung Galaxy S25", description: "Premium-Flaggschiff-Erlebnis in kompakter Form. 6,2-Zoll FHD+ Dynamic AMOLED Display, Snapdragon 8 Elite, 50MP Triple-Kamera und 4000mAh Akku mit Schnellladung." },
      fr: { title: "Samsung Galaxy S25", description: "Une expérience flagship premium en format compact. Écran Dynamic AMOLED FHD+ de 6,2 pouces, Snapdragon 8 Elite, triple caméra 50MP et batterie 4000mAh avec charge rapide." },
      pl: { title: "Samsung Galaxy S25", description: "Flagowe doświadczenie premium w kompaktowej formie. Wyświetlacz FHD+ Dynamic AMOLED 6,2 cala, Snapdragon 8 Elite, potrójny aparat 50MP i bateria 4000mAh z szybkim ładowaniem." },
      lt: { title: "Samsung Galaxy S25", description: "Aukščiausios klasės flagmano patirtis kompaktiškame formate. 6,2 colio FHD+ Dynamic AMOLED ekranas, Snapdragon 8 Elite, 50MP triguba kamera ir 4000mAh baterija su greitu įkrovimu." },
      et: { title: "Samsung Galaxy S25", description: "Tipptasemel lipulaeva kogemus kompaktses vormis. 6,2-tolline FHD+ Dynamic AMOLED ekraan, Snapdragon 8 Elite, 50MP kolmikkaamera ja 4000mAh aku kiirlaadimisega." },
      lv: { title: "Samsung Galaxy S25", description: "Premium flagmaņa pieredze kompaktā formā. 6,2 collu FHD+ Dynamic AMOLED displejs, Snapdragon 8 Elite, 50MP trīskamera un 4000mAh akumulators ar ātro uzlādi." },
    },
  },
  {
    title: "Google Pixel 9 Pro",
    handle: "pixel-9-pro",
    description: "Google's smartest phone yet with the Tensor G4 chip, 50MP triple camera with AI-powered Magic Eraser and Best Take, 6.3-inch Super Actua display, and 7 years of OS updates.",
    category: "smartphones",
    skuBase: "PX9P",
    options: [
      { title: "Color", values: ["Obsidian", "Porcelain", "Hazel"] },
      { title: "Storage", values: ["128GB", "256GB", "512GB"] },
    ],
    basePriceUsd: 99900,
    priceAdders: { Storage: { "128GB": 0, "256GB": 6000, "512GB": 18000 } },
    valueCodes: { Obsidian: "OBS", Porcelain: "PRC", Hazel: "HZL", "128GB": "128", "256GB": "256", "512GB": "512" },
    i18n: {
      tr: { title: "Google Pixel 9 Pro", description: "Tensor G4 çip, AI destekli Magic Eraser ve Best Take özellikli 50MP üçlü kamera, 6,3 inç Super Actua ekran ve 7 yıl işletim sistemi güncellemesi ile Google'ın en akıllı telefonu." },
      de: { title: "Google Pixel 9 Pro", description: "Googles smartestes Telefon mit Tensor G4 Chip, 50MP Triple-Kamera mit KI-gestütztem Magic Eraser und Best Take, 6,3-Zoll Super Actua Display und 7 Jahre OS-Updates." },
      fr: { title: "Google Pixel 9 Pro", description: "Le téléphone le plus intelligent de Google avec puce Tensor G4, triple caméra 50MP avec Magic Eraser et Best Take alimentés par l'IA, écran Super Actua de 6,3 pouces et 7 ans de mises à jour." },
      pl: { title: "Google Pixel 9 Pro", description: "Najinteligentniejszy telefon Google z chipem Tensor G4, potrójnym aparatem 50MP z AI Magic Eraser i Best Take, wyświetlaczem Super Actua 6,3 cala i 7-letnimi aktualizacjami systemu." },
      lt: { title: "Google Pixel 9 Pro", description: "Protingiausias Google telefonas su Tensor G4 lustu, 50MP triguba kamera su AI Magic Eraser ir Best Take, 6,3 colio Super Actua ekranu ir 7 metų OS atnaujinimais." },
      et: { title: "Google Pixel 9 Pro", description: "Google'i nutikam telefon Tensor G4 kiibiga, 50MP kolmikkaamera AI-toega Magic Eraser ja Best Take funktsiooniga, 6,3-tolline Super Actua ekraan ja 7 aastat OS-i värskendusi." },
      lv: { title: "Google Pixel 9 Pro", description: "Google gudrākais tālrunis ar Tensor G4 čipu, 50MP trīskameru ar AI Magic Eraser un Best Take, 6,3 collu Super Actua displeju un 7 gadu OS atjauninājumiem." },
    },
  },
  {
    title: "OnePlus 13",
    handle: "oneplus-13",
    description: "Flagship killer reborn. Snapdragon 8 Elite, 6.82-inch 2K LTPO AMOLED with 120Hz, Hasselblad-tuned 50MP triple camera, 6000mAh battery with 100W SUPERVOOC charging, and OxygenOS 15.",
    category: "smartphones",
    skuBase: "OP13",
    options: [
      { title: "Color", values: ["Midnight Ocean", "Arctic Dawn"] },
      { title: "Storage", values: ["256GB", "512GB"] },
    ],
    basePriceUsd: 89900,
    priceAdders: { Storage: { "256GB": 0, "512GB": 10000 } },
    valueCodes: { "Midnight Ocean": "MID", "Arctic Dawn": "ARC", "256GB": "256", "512GB": "512" },
    i18n: {
      tr: { title: "OnePlus 13", description: "Amiral gemisi katili geri döndü. Snapdragon 8 Elite, 120Hz 2K LTPO AMOLED ekran, Hasselblad ayarlı 50MP üçlü kamera, 100W SUPERVOOC şarjlı 6000mAh pil ve OxygenOS 15." },
      de: { title: "OnePlus 13", description: "Der Flaggschiff-Killer ist zurück. Snapdragon 8 Elite, 6,82-Zoll 2K LTPO AMOLED mit 120Hz, Hasselblad 50MP Triple-Kamera, 6000mAh Akku mit 100W SUPERVOOC und OxygenOS 15." },
      fr: { title: "OnePlus 13", description: "Le tueur de flagships est de retour. Snapdragon 8 Elite, écran 2K LTPO AMOLED 120Hz de 6,82 pouces, triple caméra Hasselblad 50MP, batterie 6000mAh avec charge 100W SUPERVOOC et OxygenOS 15." },
      pl: { title: "OnePlus 13", description: "Pogromca flagowców powrócił. Snapdragon 8 Elite, wyświetlacz 2K LTPO AMOLED 120Hz 6,82 cala, potrójny aparat Hasselblad 50MP, bateria 6000mAh ze 100W SUPERVOOC i OxygenOS 15." },
      lt: { title: "OnePlus 13", description: "Flagmanų žudikas sugrįžo. Snapdragon 8 Elite, 6,82 colio 2K LTPO AMOLED su 120Hz, Hasselblad 50MP triguba kamera, 6000mAh baterija su 100W SUPERVOOC ir OxygenOS 15." },
      et: { title: "OnePlus 13", description: "Lipulaevade tapja on tagasi. Snapdragon 8 Elite, 6,82-tolline 2K LTPO AMOLED 120Hz, Hasselblad 50MP kolmikkaamera, 6000mAh aku 100W SUPERVOOC laadimisega ja OxygenOS 15." },
      lv: { title: "OnePlus 13", description: "Flagmaņu slepkava ir atgriezies. Snapdragon 8 Elite, 6,82 collu 2K LTPO AMOLED ar 120Hz, Hasselblad 50MP trīskamera, 6000mAh akumulators ar 100W SUPERVOOC un OxygenOS 15." },
    },
  },
  {
    title: "Xiaomi 15 Pro",
    handle: "xiaomi-15-pro",
    description: "Premium performance meets Leica optics. Snapdragon 8 Elite, 6.73-inch 2K AMOLED with 120Hz, Leica Summilux 50MP triple camera, 5400mAh battery with 120W HyperCharge, and HyperOS 2.",
    category: "smartphones",
    skuBase: "XI15P",
    options: [
      { title: "Color", values: ["Black", "White"] },
      { title: "Storage", values: ["256GB", "512GB"] },
    ],
    basePriceUsd: 69900,
    priceAdders: { Storage: { "256GB": 0, "512GB": 10000 } },
    valueCodes: { Black: "BLK", White: "WHT", "256GB": "256", "512GB": "512" },
    i18n: {
      tr: { title: "Xiaomi 15 Pro", description: "Premium performans ve Leica optik bir arada. Snapdragon 8 Elite, 120Hz 2K AMOLED ekran, Leica Summilux 50MP üçlü kamera, 120W HyperCharge şarjlı 5400mAh pil ve HyperOS 2." },
      de: { title: "Xiaomi 15 Pro", description: "Premium-Leistung trifft Leica-Optik. Snapdragon 8 Elite, 6,73-Zoll 2K AMOLED mit 120Hz, Leica Summilux 50MP Triple-Kamera, 5400mAh Akku mit 120W HyperCharge und HyperOS 2." },
      fr: { title: "Xiaomi 15 Pro", description: "Performance premium et optique Leica. Snapdragon 8 Elite, écran 2K AMOLED 120Hz de 6,73 pouces, triple caméra Leica Summilux 50MP, batterie 5400mAh avec 120W HyperCharge et HyperOS 2." },
      pl: { title: "Xiaomi 15 Pro", description: "Premium wydajność i optyka Leica. Snapdragon 8 Elite, wyświetlacz 2K AMOLED 120Hz 6,73 cala, potrójny aparat Leica Summilux 50MP, bateria 5400mAh ze 120W HyperCharge i HyperOS 2." },
      lt: { title: "Xiaomi 15 Pro", description: "Aukščiausios klasės našumas su Leica optika. Snapdragon 8 Elite, 6,73 colio 2K AMOLED su 120Hz, Leica Summilux 50MP triguba kamera, 5400mAh baterija su 120W HyperCharge ir HyperOS 2." },
      et: { title: "Xiaomi 15 Pro", description: "Tipptasemel jõudlus kohtub Leica optikaga. Snapdragon 8 Elite, 6,73-tolline 2K AMOLED 120Hz, Leica Summilux 50MP kolmikkaamera, 5400mAh aku 120W HyperCharge ja HyperOS 2." },
      lv: { title: "Xiaomi 15 Pro", description: "Premium veiktspēja satiek Leica optiku. Snapdragon 8 Elite, 6,73 collu 2K AMOLED ar 120Hz, Leica Summilux 50MP trīskamera, 5400mAh akumulators ar 120W HyperCharge un HyperOS 2." },
    },
  },
  {
    title: "Nothing Phone 3",
    handle: "nothing-phone-3",
    description: "Transparent design meets flagship specs. Unique Glyph Interface LED system, Snapdragon 7+ Gen 3, 6.55-inch OLED 120Hz display, 50MP dual camera, and Nothing OS 3.",
    category: "smartphones",
    skuBase: "NP3",
    options: [
      { title: "Color", values: ["Black", "White"] },
      { title: "Storage", values: ["128GB", "256GB"] },
    ],
    basePriceUsd: 49900,
    priceAdders: { Storage: { "128GB": 0, "256GB": 5000 } },
    valueCodes: { Black: "BLK", White: "WHT", "128GB": "128", "256GB": "256" },
    i18n: {
      tr: { title: "Nothing Phone 3", description: "Şeffaf tasarım amiral gemisi özelliklerle buluşuyor. Benzersiz Glyph Arayüzü LED sistemi, Snapdragon 7+ Gen 3, 120Hz OLED ekran, 50MP çift kamera ve temiz Nothing OS 3 deneyimi." },
      de: { title: "Nothing Phone 3", description: "Transparentes Design trifft Flaggschiff-Specs. Einzigartiges Glyph Interface LED-System, Snapdragon 7+ Gen 3, 6,55-Zoll OLED 120Hz, 50MP Dual-Kamera und Nothing OS 3." },
      fr: { title: "Nothing Phone 3", description: "Design transparent et specs flagship. Système LED Glyph Interface unique, Snapdragon 7+ Gen 3, écran OLED 120Hz de 6,55 pouces, double caméra 50MP et Nothing OS 3 épuré." },
      pl: { title: "Nothing Phone 3", description: "Przezroczysty design i flagowe specyfikacje. Unikalny system LED Glyph Interface, Snapdragon 7+ Gen 3, wyświetlacz OLED 120Hz 6,55 cala, podwójny aparat 50MP i czysty Nothing OS 3." },
      lt: { title: "Nothing Phone 3", description: "Skaidrus dizainas su flagmano specifikacijomis. Unikalus Glyph Interface LED sistema, Snapdragon 7+ Gen 3, 6,55 colio OLED 120Hz ekranas, 50MP dviguba kamera ir Nothing OS 3." },
      et: { title: "Nothing Phone 3", description: "Läbipaistev disain kohtub lipulaeva spetsifikatsioonidega. Unikaalne Glyph Interface LED-süsteem, Snapdragon 7+ Gen 3, 6,55-tolline OLED 120Hz, 50MP topeltkaamera ja Nothing OS 3." },
      lv: { title: "Nothing Phone 3", description: "Caurspīdīgs dizains ar flagmaņa specifikācijām. Unikāla Glyph Interface LED sistēma, Snapdragon 7+ Gen 3, 6,55 collu OLED 120Hz, 50MP dubultkamera un Nothing OS 3." },
    },
  },
];

const LAPTOPS = [
  {
    title: 'MacBook Pro 16" M4',
    handle: "macbook-pro-16-m4",
    description: "The most powerful MacBook Pro ever. M4 Pro or M4 Max chip, 16.2-inch Liquid Retina XDR display, up to 48GB unified memory, Thunderbolt 5, and up to 24 hours of battery life. Built for pros.",
    category: "laptops",
    skuBase: "MBP16M4",
    options: [
      { title: "Color", values: ["Space Black", "Silver"] },
      { title: "Configuration", values: ["M4 Pro 24GB/512GB", "M4 Pro 48GB/1TB", "M4 Max 48GB/1TB"] },
    ],
    basePriceUsd: 249900,
    priceAdders: { Configuration: { "M4 Pro 24GB/512GB": 0, "M4 Pro 48GB/1TB": 50000, "M4 Max 48GB/1TB": 100000 } },
    valueCodes: { "Space Black": "SBK", Silver: "SLV", "M4 Pro 24GB/512GB": "P24", "M4 Pro 48GB/1TB": "P48", "M4 Max 48GB/1TB": "X48" },
    i18n: {
      tr: { title: 'MacBook Pro 16" M4', description: "Şimdiye kadarki en güçlü MacBook Pro. M4 Pro veya M4 Max çip, 16,2 inç Liquid Retina XDR ekran, 48GB'a kadar birleşik bellek, Thunderbolt 5 ve 24 saate kadar pil ömrü." },
      de: { title: 'MacBook Pro 16" M4', description: "Das leistungsstärkste MacBook Pro aller Zeiten. M4 Pro oder M4 Max Chip, 16,2-Zoll Liquid Retina XDR Display, bis zu 48GB gemeinsamer Speicher, Thunderbolt 5 und bis zu 24 Stunden Akkulaufzeit." },
      fr: { title: 'MacBook Pro 16" M4', description: "Le MacBook Pro le plus puissant jamais conçu. Puce M4 Pro ou M4 Max, écran Liquid Retina XDR de 16,2 pouces, jusqu'à 48Go de mémoire unifiée, Thunderbolt 5 et jusqu'à 24h d'autonomie." },
      pl: { title: 'MacBook Pro 16" M4', description: "Najpotężniejszy MacBook Pro w historii. Chip M4 Pro lub M4 Max, wyświetlacz Liquid Retina XDR 16,2 cala, do 48GB zunifikowanej pamięci, Thunderbolt 5 i do 24 godzin pracy na baterii." },
      lt: { title: 'MacBook Pro 16" M4', description: "Galingiausias MacBook Pro visų laikų. M4 Pro arba M4 Max lustas, 16,2 colio Liquid Retina XDR ekranas, iki 48GB bendros atminties, Thunderbolt 5 ir iki 24 valandų baterija." },
      et: { title: 'MacBook Pro 16" M4', description: "Võimsaim MacBook Pro kunagi. M4 Pro või M4 Max kiip, 16,2-tolline Liquid Retina XDR ekraan, kuni 48GB ühismälu, Thunderbolt 5 ja kuni 24 tundi akuaega." },
      lv: { title: 'MacBook Pro 16" M4', description: "Jaudīgākais MacBook Pro jebkad. M4 Pro vai M4 Max čips, 16,2 collu Liquid Retina XDR displejs, līdz 48GB vienotā atmiņa, Thunderbolt 5 un līdz 24 stundu akumulators." },
    },
  },
  {
    title: 'MacBook Air 15" M3',
    handle: "macbook-air-15-m3",
    description: "Impossibly thin, incredibly capable. M3 chip, 15.3-inch Liquid Retina display, 18 hours of battery, MagSafe charging, and fanless silent operation. Just 11.5mm thin.",
    category: "laptops",
    skuBase: "MBA15M3",
    options: [
      { title: "Color", values: ["Midnight", "Starlight", "Space Gray"] },
      { title: "Configuration", values: ["8GB/256GB", "16GB/512GB", "24GB/1TB"] },
    ],
    basePriceUsd: 129900,
    priceAdders: { Configuration: { "8GB/256GB": 0, "16GB/512GB": 20000, "24GB/1TB": 50000 } },
    valueCodes: { Midnight: "MID", Starlight: "STR", "Space Gray": "SGR", "8GB/256GB": "8-256", "16GB/512GB": "16-512", "24GB/1TB": "24-1TB" },
    i18n: {
      tr: { title: 'MacBook Air 15" M3', description: "İnanılmaz ince, inanılmaz yetenekli. M3 çip, 15,3 inç Liquid Retina ekran, 18 saat pil ömrü, MagSafe şarj ve fansız sessiz çalışma. Sadece 11,5mm inceliğinde." },
      de: { title: 'MacBook Air 15" M3', description: "Unglaublich dünn, unglaublich leistungsfähig. M3 Chip, 15,3-Zoll Liquid Retina Display, 18 Stunden Akku, MagSafe und lüfterloses Design. Nur 11,5mm dünn." },
      fr: { title: 'MacBook Air 15" M3', description: "Incroyablement fin, incroyablement performant. Puce M3, écran Liquid Retina 15,3 pouces, 18h d'autonomie, MagSafe et fonctionnement silencieux sans ventilateur. Seulement 11,5mm." },
      pl: { title: 'MacBook Air 15" M3', description: "Niewiarygodnie cienki, niesamowicie wydajny. Chip M3, wyświetlacz Liquid Retina 15,3 cala, 18 godzin baterii, MagSafe i bezwentylatorowa cicha praca. Zaledwie 11,5mm grubości." },
      lt: { title: 'MacBook Air 15" M3', description: "Neįtikėtinai plonas, neįtikėtinai galingas. M3 lustas, 15,3 colio Liquid Retina ekranas, 18 valandų baterija, MagSafe ir tylus veikimas be ventiliatoriaus. Tik 11,5mm storio." },
      et: { title: 'MacBook Air 15" M3', description: "Uskumatult õhuke, uskumatult võimekas. M3 kiip, 15,3-tolline Liquid Retina ekraan, 18 tundi akuaega, MagSafe ja ventilaatorivaba vaikne töö. Vaid 11,5mm õhuke." },
      lv: { title: 'MacBook Air 15" M3', description: "Neticami plāns, neticami spējīgs. M3 čips, 15,3 collu Liquid Retina displejs, 18 stundu akumulators, MagSafe un klusā darbība bez ventilatora. Tikai 11,5mm plāns." },
    },
  },
  {
    title: "Dell XPS 15",
    handle: "dell-xps-15",
    description: "Stunning 15.6-inch 3.5K OLED InfinityEdge display, Intel Core Ultra 7 processor, NVIDIA GeForce RTX 4060, up to 32GB DDR5 RAM, and premium CNC-machined aluminum chassis.",
    category: "laptops",
    skuBase: "XPS15",
    options: [{ title: "Configuration", values: ["16GB/512GB", "32GB/1TB"] }],
    basePriceUsd: 149900,
    priceAdders: { Configuration: { "16GB/512GB": 0, "32GB/1TB": 40000 } },
    valueCodes: { "16GB/512GB": "16-512", "32GB/1TB": "32-1TB" },
    i18n: {
      tr: { title: "Dell XPS 15", description: "15,6 inç 3.5K OLED InfinityEdge ekran, Intel Core Ultra 7 işlemci, NVIDIA GeForce RTX 4060, 32GB'a kadar DDR5 RAM ve premium CNC-işlenmiş alüminyum kasa." },
      de: { title: "Dell XPS 15", description: "Atemberaubendes 15,6-Zoll 3.5K OLED InfinityEdge Display, Intel Core Ultra 7, NVIDIA GeForce RTX 4060, bis zu 32GB DDR5 RAM und CNC-gefrästes Aluminiumgehäuse." },
      fr: { title: "Dell XPS 15", description: "Écran OLED InfinityEdge 3.5K de 15,6 pouces, processeur Intel Core Ultra 7, NVIDIA GeForce RTX 4060, jusqu'à 32Go DDR5 et châssis aluminium usiné CNC." },
      pl: { title: "Dell XPS 15", description: "15,6-calowy wyświetlacz 3.5K OLED InfinityEdge, procesor Intel Core Ultra 7, NVIDIA GeForce RTX 4060, do 32GB DDR5 RAM i obudowa z frezowanego aluminium CNC." },
      lt: { title: "Dell XPS 15", description: "15,6 colio 3.5K OLED InfinityEdge ekranas, Intel Core Ultra 7 procesorius, NVIDIA GeForce RTX 4060, iki 32GB DDR5 RAM ir CNC frezuotas aliuminio korpusas." },
      et: { title: "Dell XPS 15", description: "15,6-tolline 3.5K OLED InfinityEdge ekraan, Intel Core Ultra 7 protsessor, NVIDIA GeForce RTX 4060, kuni 32GB DDR5 RAM ja CNC-freesitud alumiiniumkorpus." },
      lv: { title: "Dell XPS 15", description: "15,6 collu 3.5K OLED InfinityEdge displejs, Intel Core Ultra 7 procesors, NVIDIA GeForce RTX 4060, līdz 32GB DDR5 RAM un CNC frēzēts alumīnija korpuss." },
    },
  },
  {
    title: "ThinkPad X1 Carbon Gen 12",
    handle: "thinkpad-x1-carbon-gen12",
    description: "The legendary business ultrabook. Intel Core Ultra 7, 14-inch 2.8K OLED display, legendary keyboard, fingerprint reader, IR camera for Windows Hello, and MIL-STD-810H durability.",
    category: "laptops",
    skuBase: "X1C12",
    options: [{ title: "Configuration", values: ["16GB/512GB", "32GB/1TB"] }],
    basePriceUsd: 164900,
    priceAdders: { Configuration: { "16GB/512GB": 0, "32GB/1TB": 35000 } },
    valueCodes: { "16GB/512GB": "16-512", "32GB/1TB": "32-1TB" },
    i18n: {
      tr: { title: "ThinkPad X1 Carbon Gen 12", description: "Efsanevi iş ultrabook'u. Intel Core Ultra 7, 14 inç 2.8K OLED ekran, 64GB'a kadar RAM, efsanevi klavye, parmak izi okuyucu ve MIL-STD-810H dayanıklılık." },
      de: { title: "ThinkPad X1 Carbon Gen 12", description: "Das legendäre Business-Ultrabook. Intel Core Ultra 7, 14-Zoll 2.8K OLED Display, bis zu 64GB RAM, legendäre Tastatur, Fingerabdruckleser und MIL-STD-810H Haltbarkeit." },
      fr: { title: "ThinkPad X1 Carbon Gen 12", description: "L'ultrabook professionnel légendaire. Intel Core Ultra 7, écran OLED 2.8K de 14 pouces, jusqu'à 64Go RAM, clavier légendaire, lecteur d'empreintes et robustesse MIL-STD-810H." },
      pl: { title: "ThinkPad X1 Carbon Gen 12", description: "Legendarny biznesowy ultrabook. Intel Core Ultra 7, wyświetlacz OLED 2.8K 14 cali, do 64GB RAM, legendarna klawiatura, czytnik linii papilarnych i wytrzymałość MIL-STD-810H." },
      lt: { title: "ThinkPad X1 Carbon Gen 12", description: "Legendinis verslo ultrabukas. Intel Core Ultra 7, 14 colių 2.8K OLED ekranas, iki 64GB RAM, legendinė klaviatūra, pirštų atspaudų skaitytuvas ir MIL-STD-810H patvarumas." },
      et: { title: "ThinkPad X1 Carbon Gen 12", description: "Legendaarne äri-ultrabuk. Intel Core Ultra 7, 14-tolline 2.8K OLED ekraan, kuni 64GB RAM, legendaarne klaviatuur, sõrmejäljelugeja ja MIL-STD-810H vastupidavus." },
      lv: { title: "ThinkPad X1 Carbon Gen 12", description: "Leģendārais biznesa ultrabūks. Intel Core Ultra 7, 14 collu 2.8K OLED displejs, līdz 64GB RAM, leģendārā tastatūra, pirkstu nospiedumu lasītājs un MIL-STD-810H izturība." },
    },
  },
  {
    title: "ASUS ROG Strix G16",
    handle: "asus-rog-strix-g16",
    description: "Dominate every game. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, 16-inch QHD+ 240Hz display, 32GB DDR5, per-key RGB keyboard, and advanced thermal system with liquid metal cooling.",
    category: "laptops",
    skuBase: "ROGG16",
    options: [{ title: "Configuration", values: ["RTX 4070 32GB/1TB", "RTX 4080 32GB/2TB"] }],
    basePriceUsd: 179900,
    priceAdders: { Configuration: { "RTX 4070 32GB/1TB": 0, "RTX 4080 32GB/2TB": 50000 } },
    valueCodes: { "RTX 4070 32GB/1TB": "4070", "RTX 4080 32GB/2TB": "4080" },
    i18n: {
      tr: { title: "ASUS ROG Strix G16", description: "Her oyunda domine edin. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, 16 inç QHD+ 240Hz ekran, 32GB DDR5, tuş başına RGB klavye ve sıvı metal soğutmalı gelişmiş termal sistem." },
      de: { title: "ASUS ROG Strix G16", description: "Dominiere jedes Spiel. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, 16-Zoll QHD+ 240Hz Display, 32GB DDR5, Per-Key RGB-Tastatur und Flüssigmetall-Kühlung." },
      fr: { title: "ASUS ROG Strix G16", description: "Dominez chaque jeu. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, écran QHD+ 240Hz de 16 pouces, 32Go DDR5, clavier RGB par touche et refroidissement au métal liquide." },
      pl: { title: "ASUS ROG Strix G16", description: "Dominuj w każdej grze. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, wyświetlacz QHD+ 240Hz 16 cali, 32GB DDR5, klawiatura RGB per-key i zaawansowany system chłodzenia ciekłym metalem." },
      lt: { title: "ASUS ROG Strix G16", description: "Dominuokite kiekviename žaidime. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, 16 colių QHD+ 240Hz ekranas, 32GB DDR5, RGB klaviatūra ir skystojo metalo aušinimas." },
      et: { title: "ASUS ROG Strix G16", description: "Domineeri igas mängus. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, 16-tolline QHD+ 240Hz ekraan, 32GB DDR5, klahvipõhine RGB-klaviatuur ja vedela metalli jahutus." },
      lv: { title: "ASUS ROG Strix G16", description: "Dominējiet katrā spēlē. Intel Core i9-14900HX, NVIDIA GeForce RTX 4070, 16 collu QHD+ 240Hz displejs, 32GB DDR5, RGB tastatūra un šķidrā metāla dzesēšana." },
    },
  },
  {
    title: "HP Spectre x360 16",
    handle: "hp-spectre-x360-16",
    description: "Elegant 2-in-1 convertible. Intel Core Ultra 7, 16-inch 3K OLED touchscreen with stylus support, quad speakers by Bang & Olufsen, and gem-cut design in Nightfall Black.",
    category: "laptops",
    skuBase: "SPEC360",
    options: [{ title: "Configuration", values: ["16GB/512GB", "32GB/1TB"] }],
    basePriceUsd: 139900,
    priceAdders: { Configuration: { "16GB/512GB": 0, "32GB/1TB": 30000 } },
    valueCodes: { "16GB/512GB": "16-512", "32GB/1TB": "32-1TB" },
    i18n: {
      tr: { title: "HP Spectre x360 16", description: "Zarif 2'si 1 arada dönüştürülebilir. Intel Core Ultra 7, 16 inç 3K OLED dokunmatik ekran, kalem desteği, Bang & Olufsen hoparlörler ve mücevher kesim tasarım." },
      de: { title: "HP Spectre x360 16", description: "Elegantes 2-in-1 Convertible. Intel Core Ultra 7, 16-Zoll 3K OLED Touchscreen mit Stylus, 16GB RAM, Bang & Olufsen Lautsprecher und Gem-Cut Design in Nightfall Black." },
      fr: { title: "HP Spectre x360 16", description: "Élégant convertible 2-en-1. Intel Core Ultra 7, écran tactile OLED 3K de 16 pouces avec stylet, haut-parleurs Bang & Olufsen et design gem-cut en Nightfall Black." },
      pl: { title: "HP Spectre x360 16", description: "Elegancki konwertowalny 2w1. Intel Core Ultra 7, 16-calowy ekran dotykowy 3K OLED z rysikiem, głośniki Bang & Olufsen i design gem-cut w kolorze Nightfall Black." },
      lt: { title: "HP Spectre x360 16", description: "Elegantiška 2-viename konvertuojama. Intel Core Ultra 7, 16 colių 3K OLED jutiklinis ekranas su rašikliu, Bang & Olufsen garsiakalbiai ir brangakmenio pjūvio dizainas." },
      et: { title: "HP Spectre x360 16", description: "Elegantne 2-ühes konverteeritav. Intel Core Ultra 7, 16-tolline 3K OLED puuteekraan pliiatsiga, Bang & Olufsen kõlarid ja gem-cut disain Nightfall Black värvis." },
      lv: { title: "HP Spectre x360 16", description: "Elegants 2-vienā konvertējams. Intel Core Ultra 7, 16 collu 3K OLED skārienekrāns ar irbuļu, Bang & Olufsen skaļruņi un gem-cut dizains Nightfall Black krāsā." },
    },
  },
  {
    title: "Surface Laptop 6",
    handle: "surface-laptop-6",
    description: "Beautiful and productive. Intel Core Ultra 7, 15-inch PixelSense touchscreen, Copilot+ AI features, up to 20 hours battery, and Windows 11 with Copilot integration.",
    category: "laptops",
    skuBase: "SL6",
    options: [
      { title: "Color", values: ["Black", "Platinum"] },
      { title: "Configuration", values: ["16GB/256GB", "16GB/512GB", "32GB/1TB"] },
    ],
    basePriceUsd: 129900,
    priceAdders: { Configuration: { "16GB/256GB": 0, "16GB/512GB": 20000, "32GB/1TB": 50000 } },
    valueCodes: { Platinum: "PLT", Black: "BLK", "16GB/256GB": "16-256", "16GB/512GB": "16-512", "32GB/1TB": "32-1TB" },
    i18n: {
      tr: { title: "Surface Laptop 6", description: "Güzel ve üretken. Intel Core Ultra 7, 15 inç PixelSense dokunmatik ekran, Copilot+ AI özellikleri, 20 saate kadar pil ömrü ve Alcantara klavye yüzeyi." },
      de: { title: "Surface Laptop 6", description: "Schön und produktiv. Intel Core Ultra 7, 15-Zoll PixelSense Touchscreen, Copilot+ KI-Funktionen, bis zu 20 Stunden Akku und Alcantara-Tastaturoberfläche." },
      fr: { title: "Surface Laptop 6", description: "Beau et productif. Intel Core Ultra 7, écran tactile PixelSense 15 pouces, fonctions IA Copilot+, jusqu'à 20h d'autonomie et clavier en Alcantara." },
      pl: { title: "Surface Laptop 6", description: "Piękny i produktywny. Intel Core Ultra 7, 15-calowy ekran dotykowy PixelSense, funkcje AI Copilot+, do 20 godzin baterii i podkładka klawiatury Alcantara." },
      lt: { title: "Surface Laptop 6", description: "Gražus ir produktyvus. Intel Core Ultra 7, 15 colių PixelSense jutiklinis ekranas, Copilot+ AI funkcijos, iki 20 valandų baterija ir Alcantara klaviatūros paviršius." },
      et: { title: "Surface Laptop 6", description: "Ilus ja produktiivne. Intel Core Ultra 7, 15-tolline PixelSense puuteekraan, Copilot+ AI funktsioonid, kuni 20 tundi akuaega ja Alcantara klaviatuuripind." },
      lv: { title: "Surface Laptop 6", description: "Skaists un produktīvs. Intel Core Ultra 7, 15 collu PixelSense skārienekrāns, Copilot+ AI funkcijas, līdz 20 stundu akumulators un Alcantara tastatūras virsma." },
    },
  },
  {
    title: "Acer Swift Go 14",
    handle: "acer-swift-go-14",
    description: "Portable productivity champion. Intel Core Ultra 5, 14-inch 2.8K OLED display, 16GB LPDDR5x, weighs just 1.3kg, Wi-Fi 7, and up to 13 hours of battery life. Outstanding value.",
    category: "laptops",
    skuBase: "SWGO14",
    options: [{ title: "Configuration", values: ["16GB/512GB", "16GB/1TB"] }],
    basePriceUsd: 89900,
    priceAdders: { Configuration: { "16GB/512GB": 0, "16GB/1TB": 10000 } },
    valueCodes: { "16GB/512GB": "512", "16GB/1TB": "1TB" },
    i18n: {
      tr: { title: "Acer Swift Go 14", description: "Taşınabilir üretkenlik şampiyonu. Intel Core Ultra 5, 14 inç 2.8K OLED ekran, 16GB LPDDR5x, sadece 1,3kg ağırlık, Wi-Fi 7 ve 13 saate kadar pil ömrü. Mükemmel değer." },
      de: { title: "Acer Swift Go 14", description: "Portabler Produktivitäts-Champion. Intel Core Ultra 5, 14-Zoll 2.8K OLED Display, 16GB LPDDR5x, nur 1,3kg, Wi-Fi 7 und bis zu 13 Stunden Akku. Hervorragendes Preis-Leistungs-Verhältnis." },
      fr: { title: "Acer Swift Go 14", description: "Champion de la productivité portable. Intel Core Ultra 5, écran OLED 2.8K de 14 pouces, 16Go LPDDR5x, seulement 1,3kg, Wi-Fi 7 et jusqu'à 13h d'autonomie. Excellent rapport qualité-prix." },
      pl: { title: "Acer Swift Go 14", description: "Mistrz przenośnej produktywności. Intel Core Ultra 5, wyświetlacz OLED 2.8K 14 cali, 16GB LPDDR5x, waga tylko 1,3kg, Wi-Fi 7 i do 13 godzin baterii. Doskonała wartość." },
      lt: { title: "Acer Swift Go 14", description: "Nešiojamo produktyvumo čempionas. Intel Core Ultra 5, 14 colių 2.8K OLED ekranas, 16GB LPDDR5x, tik 1,3kg svoris, Wi-Fi 7 ir iki 13 valandų baterija. Puiki vertė." },
      et: { title: "Acer Swift Go 14", description: "Kaasaskantava tootlikkuse meister. Intel Core Ultra 5, 14-tolline 2.8K OLED ekraan, 16GB LPDDR5x, kaalub vaid 1,3kg, Wi-Fi 7 ja kuni 13 tundi akuaega. Suurepärane väärtus." },
      lv: { title: "Acer Swift Go 14", description: "Pārnēsājamās produktivitātes čempions. Intel Core Ultra 5, 14 collu 2.8K OLED displejs, 16GB LPDDR5x, tikai 1,3kg, Wi-Fi 7 un līdz 13 stundu akumulators. Izcila vērtība." },
    },
  },
];
const CAMERAS = [
  {
    title: "Sony A7 IV",
    handle: "sony-a7-iv",
    description: "The do-everything full-frame mirrorless camera. 33MP Exmor R sensor, BIONZ XR processor, 4K 60p video, Real-time Eye AF for humans and animals, 10fps burst, and 5-axis IBIS.",
    category: "cameras",
    skuBase: "A7IV",
    options: [{ title: "Kit", values: ["Body Only", "With 28-70mm Lens"] }],
    basePriceUsd: 249900,
    priceAdders: { Kit: { "Body Only": 0, "With 28-70mm Lens": 30000 } },
    valueCodes: { "Body Only": "BODY", "With 28-70mm Lens": "KIT" },
    i18n: {
      tr: { title: "Sony A7 IV", description: "Her şeyi yapan tam kare aynasız fotoğraf makinesi. 33MP Exmor R sensör, 4K 60p video, gerçek zamanlı göz AF, 10fps seri çekim ve 5 eksenli görüntü sabitleme." },
      de: { title: "Sony A7 IV", description: "Die Vollformat-Systemkamera für alles. 33MP Exmor R Sensor, 4K 60p Video, Echtzeit-Augen-AF, 10fps Serienbildaufnahme und 5-Achsen-Bildstabilisierung." },
      fr: { title: "Sony A7 IV", description: "L'hybride plein format polyvalent. Capteur Exmor R 33MP, vidéo 4K 60p, AF oculaire en temps réel, rafale 10fps et stabilisation 5 axes." },
      pl: { title: "Sony A7 IV", description: "Wszechstronny bezlusterkowiec pełnoklatkowy. Sensor Exmor R 33MP, wideo 4K 60p, śledzenie oczu w czasie rzeczywistym, seria 10fps i 5-osiowa stabilizacja." },
      lt: { title: "Sony A7 IV", description: "Universalus pilno kadro beveidrodinis fotoaparatas. 33MP Exmor R sensorius, 4K 60p vaizdo įrašas, realaus laiko akių AF, 10fps serija ir 5 ašių stabilizavimas." },
      et: { title: "Sony A7 IV", description: "Universaalne täiskaader-hübriidkaamera. 33MP Exmor R sensor, 4K 60p video, reaalajas silma AF, 10fps sarivõte ja 5-teljeline stabiliseerimine." },
      lv: { title: "Sony A7 IV", description: "Universāla pilnkadra bezspoguļa kamera. 33MP Exmor R sensors, 4K 60p video, reāllaika acu AF, 10fps sērija un 5 asu stabilizācija." },
    },
  },
  {
    title: "Canon EOS R6 Mark II",
    handle: "canon-eos-r6-ii",
    description: "Speed meets versatility. 24.2MP full-frame CMOS sensor, DIGIC X processor, 4K 60p oversampled video, up to 40fps electronic shutter, and in-body stabilization up to 8 stops.",
    category: "cameras",
    skuBase: "R6II",
    options: [{ title: "Kit", values: ["Body Only", "With 24-105mm f/4L"] }],
    basePriceUsd: 229900,
    priceAdders: { Kit: { "Body Only": 0, "With 24-105mm f/4L": 70000 } },
    valueCodes: { "Body Only": "BODY", "With 24-105mm f/4L": "KIT" },
    i18n: {
      tr: { title: "Canon EOS R6 Mark II", description: "Hız ve çok yönlülük bir arada. 24,2MP tam kare CMOS sensör, 4K 60p video, 40fps elektronik enstantane ve 8 durak gövde içi sabitleme." },
      de: { title: "Canon EOS R6 Mark II", description: "Geschwindigkeit trifft Vielseitigkeit. 24,2MP Vollformat-CMOS, 4K 60p Video, bis zu 40fps elektronischer Verschluss und 8 Stufen IBIS." },
      fr: { title: "Canon EOS R6 Mark II", description: "Vitesse et polyvalence. Capteur CMOS plein format 24,2MP, vidéo 4K 60p, jusqu'à 40fps et stabilisation intégrée 8 stops." },
      pl: { title: "Canon EOS R6 Mark II", description: "Szybkość i wszechstronność. Sensor CMOS 24,2MP pełna klatka, wideo 4K 60p, do 40fps migawka elektroniczna i stabilizacja w korpusie do 8 stopni." },
      lt: { title: "Canon EOS R6 Mark II", description: "Greitis ir universalumas. 24,2MP pilno kadro CMOS sensorius, 4K 60p vaizdo įrašas, iki 40fps elektroninis užraktas ir 8 pakopų stabilizavimas." },
      et: { title: "Canon EOS R6 Mark II", description: "Kiirus kohtub mitmekülgsusega. 24,2MP täiskaader CMOS sensor, 4K 60p video, kuni 40fps elektrooniline katik ja 8-astmeline stabiliseerimine." },
      lv: { title: "Canon EOS R6 Mark II", description: "Ātrums satiek daudzpusību. 24,2MP pilnkadra CMOS sensors, 4K 60p video, līdz 40fps elektroniskais aizvars un 8 pakāpju stabilizācija." },
    },
  },
  {
    title: "Nikon Z6 III",
    handle: "nikon-z6-iii",
    description: "Next-generation hybrid performance. 24.5MP stacked CMOS sensor, 4K 120p internal recording, 3D tracking AF, and dual card slots (CFexpress + SD).",
    category: "cameras",
    skuBase: "Z6III",
    options: [{ title: "Kit", values: ["Body Only", "With 24-70mm f/4"] }],
    basePriceUsd: 249900,
    priceAdders: { Kit: { "Body Only": 0, "With 24-70mm f/4": 40000 } },
    valueCodes: { "Body Only": "BODY", "With 24-70mm f/4": "KIT" },
    i18n: {
      tr: { title: "Nikon Z6 III", description: "Yeni nesil hibrit performans. 24,5MP yığılmış CMOS sensör, 4K 120p dahili kayıt, 3D izleme AF ve çift kart yuvası (CFexpress + SD)." },
      de: { title: "Nikon Z6 III", description: "Hybridleistung der nächsten Generation. 24,5MP Stacked CMOS Sensor, 4K 120p interne Aufnahme, 3D-Tracking-AF und Dual-Kartensteckplätze (CFexpress + SD)." },
      fr: { title: "Nikon Z6 III", description: "Performance hybride nouvelle génération. Capteur CMOS empilé 24,5MP, enregistrement interne 4K 120p, AF 3D tracking et double slot (CFexpress + SD)." },
      pl: { title: "Nikon Z6 III", description: "Wydajność hybrydowa nowej generacji. Sensor CMOS 24,5MP, wewnętrzny zapis 4K 120p, śledzenie 3D AF i podwójne sloty kart (CFexpress + SD)." },
      lt: { title: "Nikon Z6 III", description: "Naujos kartos hibridinis našumas. 24,5MP sudėtinis CMOS sensorius, 4K 120p vidinis įrašymas, 3D sekimo AF ir dvigubi kortelių lizdai (CFexpress + SD)." },
      et: { title: "Nikon Z6 III", description: "Järgmise põlvkonna hübriidne jõudlus. 24,5MP virnastatud CMOS sensor, 4K 120p sisemine salvestus, 3D jälgimise AF ja topeltkaardipesad (CFexpress + SD)." },
      lv: { title: "Nikon Z6 III", description: "Nākamās paaudzes hibrīda veiktspēja. 24,5MP kaudzes CMOS sensors, 4K 120p iekšējā ierakstīšana, 3D izsekošanas AF un dubulta kartes sloti (CFexpress + SD)." },
    },
  },
  {
    title: "Fujifilm X-T5",
    handle: "fujifilm-x-t5",
    description: "Retro design, modern performance. 40.2MP X-Trans CMOS 5 HR sensor, classic film simulations, 6.2K video, 15fps mechanical shutter, and weather-sealed magnesium alloy body.",
    category: "cameras",
    skuBase: "XT5",
    options: [
      { title: "Color", values: ["Black", "Silver"] },
      { title: "Kit", values: ["Body Only", "With 18-55mm f/2.8-4"] },
    ],
    basePriceUsd: 169900,
    priceAdders: { Kit: { "Body Only": 0, "With 18-55mm f/2.8-4": 30000 } },
    valueCodes: { Black: "BLK", Silver: "SLV", "Body Only": "BODY", "With 18-55mm f/2.8-4": "KIT" },
    i18n: {
      tr: { title: "Fujifilm X-T5", description: "Retro tasarım, modern performans. 40,2MP X-Trans CMOS 5 HR sensör, klasik film simülasyonları, 6.2K video, 15fps mekanik enstantane ve hava korumalı magnezyum alaşım gövde." },
      de: { title: "Fujifilm X-T5", description: "Retro-Design, moderne Leistung. 40,2MP X-Trans CMOS 5 HR Sensor, klassische Filmsimulationen, 6.2K Video, 15fps mechanischer Verschluss und wetterfestes Magnesiumgehäuse." },
      fr: { title: "Fujifilm X-T5", description: "Design rétro, performance moderne. Capteur X-Trans CMOS 5 HR 40,2MP, simulations de film classiques, vidéo 6.2K, 15fps obturateur mécanique et boîtier magnésium tropicalisé." },
      pl: { title: "Fujifilm X-T5", description: "Retro design, nowoczesna wydajność. Sensor X-Trans CMOS 5 HR 40,2MP, klasyczne symulacje filmowe, wideo 6.2K, 15fps migawka mechaniczna i uszczelniona obudowa magnezowa." },
      lt: { title: "Fujifilm X-T5", description: "Retro dizainas, šiuolaikinis našumas. 40,2MP X-Trans CMOS 5 HR sensorius, klasikinės filmų simuliacijos, 6.2K vaizdo įrašas, 15fps mechaninis užraktas ir apsaugotas magnio korpusas." },
      et: { title: "Fujifilm X-T5", description: "Retrodisain, kaasaegne jõudlus. 40,2MP X-Trans CMOS 5 HR sensor, klassikalised filmisimulatsioonid, 6.2K video, 15fps mehaaniline katik ja ilmastikukindel magneesiumkorpus." },
      lv: { title: "Fujifilm X-T5", description: "Retro dizains, moderna veiktspēja. 40,2MP X-Trans CMOS 5 HR sensors, klasiskas filmu simulācijas, 6.2K video, 15fps mehāniskais aizvars un laikapstākļiem izturīgs magnija korpuss." },
    },
  },
  {
    title: "GoPro Hero 13 Black",
    handle: "gopro-hero-13",
    description: "The ultimate action camera. 27MP sensor, 5.3K 60fps video, HyperSmooth 7.0 stabilization, 10m waterproof without housing, GPS, and modular lens system.",
    category: "cameras",
    skuBase: "HERO13",
    options: [{ title: "Bundle", values: ["Standard", "Creator Edition"] }],
    basePriceUsd: 39900,
    priceAdders: { Bundle: { Standard: 0, "Creator Edition": 18000 } },
    valueCodes: { Standard: "STD", "Creator Edition": "CRE" },
    i18n: {
      tr: { title: "GoPro Hero 13 Black", description: "En üst düzey aksiyon kamerası. 27MP sensör, 5.3K 60fps video, HyperSmooth 7.0 sabitleme, kutusu olmadan 10m su geçirmez, GPS ve modüler lens sistemi." },
      de: { title: "GoPro Hero 13 Black", description: "Die ultimative Action-Kamera. 27MP Sensor, 5.3K 60fps Video, HyperSmooth 7.0, 10m wasserdicht ohne Gehäuse, GPS und modulares Linsensystem." },
      fr: { title: "GoPro Hero 13 Black", description: "La caméra d'action ultime. Capteur 27MP, vidéo 5.3K 60fps, stabilisation HyperSmooth 7.0, étanche 10m sans boîtier, GPS et système de lentilles modulaire." },
      pl: { title: "GoPro Hero 13 Black", description: "Najlepsza kamera akcji. Sensor 27MP, wideo 5.3K 60fps, stabilizacja HyperSmooth 7.0, wodoodporność 10m bez obudowy, GPS i modularny system obiektywów." },
      lt: { title: "GoPro Hero 13 Black", description: "Geriausia veiksmo kamera. 27MP sensorius, 5.3K 60fps vaizdo įrašas, HyperSmooth 7.0 stabilizavimas, 10m atsparumas vandeniui be dėklo, GPS ir modulinė lęšių sistema." },
      et: { title: "GoPro Hero 13 Black", description: "Parim seikluskaamera. 27MP sensor, 5.3K 60fps video, HyperSmooth 7.0 stabiliseerimine, 10m veekindel ilma korpuseta, GPS ja modulaarne läätssüsteem." },
      lv: { title: "GoPro Hero 13 Black", description: "Labākā darbības kamera. 27MP sensors, 5.3K 60fps video, HyperSmooth 7.0 stabilizācija, 10m ūdensizturīga bez korpusa, GPS un modulāra objektīvu sistēma." },
    },
  },
  {
    title: "DJI Osmo Action 5 Pro",
    handle: "dji-osmo-action-5-pro",
    description: "Adventure-ready action camera. 1/1.3-inch sensor, 4K 120fps, RockSteady 4.0 + HorizonBalancing, 20m waterproof, dual touchscreens, and -20°C cold resistant.",
    category: "cameras",
    skuBase: "OA5P",
    options: [{ title: "Bundle", values: ["Standard", "Adventure Combo"] }],
    basePriceUsd: 34900,
    priceAdders: { Bundle: { Standard: 0, "Adventure Combo": 10000 } },
    valueCodes: { Standard: "STD", "Adventure Combo": "ADV" },
    i18n: {
      tr: { title: "DJI Osmo Action 5 Pro", description: "Maceraya hazır aksiyon kamerası. 1/1.3 inç sensör, 4K 120fps, RockSteady 4.0 sabitleme, 20m su geçirmez, çift dokunmatik ekran ve -20°C soğuğa dayanıklılık." },
      de: { title: "DJI Osmo Action 5 Pro", description: "Abenteuer-bereite Action-Kamera. 1/1.3-Zoll Sensor, 4K 120fps, RockSteady 4.0, 20m wasserdicht, duale Touchscreens und -20°C kälteresistent." },
      fr: { title: "DJI Osmo Action 5 Pro", description: "Caméra d'action pour l'aventure. Capteur 1/1.3 pouce, 4K 120fps, RockSteady 4.0, étanche 20m, double écran tactile et résistant à -20°C." },
      pl: { title: "DJI Osmo Action 5 Pro", description: "Kamera akcji gotowa na przygodę. Sensor 1/1.3 cala, 4K 120fps, RockSteady 4.0, wodoodporność 20m, podwójne ekrany dotykowe i odporność na -20°C." },
      lt: { title: "DJI Osmo Action 5 Pro", description: "Nuotykiams paruošta veiksmo kamera. 1/1.3 colio sensorius, 4K 120fps, RockSteady 4.0, 20m atsparumas vandeniui, dvigubi jutikliniai ekranai ir -20°C atsparumas šalčiui." },
      et: { title: "DJI Osmo Action 5 Pro", description: "Seiklusteks valmis kaamera. 1/1.3-tolline sensor, 4K 120fps, RockSteady 4.0, 20m veekindel, topelt-puuteekraanid ja -20°C külmakindel." },
      lv: { title: "DJI Osmo Action 5 Pro", description: "Piedzīvojumiem gatava kamera. 1/1.3 collu sensors, 4K 120fps, RockSteady 4.0, 20m ūdensizturīga, dubultie skārienekrāni un -20°C aukstumizturīga." },
    },
  },
  {
    title: "Sony ZV-E10 II",
    handle: "sony-zv-e10-ii",
    description: "The content creator's mirrorless camera. 26MP APS-C sensor, 4K 60p with no crop, cinematic vlog settings, product showcase mode, and AI-powered autofocus.",
    category: "cameras",
    skuBase: "ZVE10II",
    options: [
      { title: "Color", values: ["Black", "White"] },
      { title: "Kit", values: ["Body Only", "With 16-50mm PZ"] },
    ],
    basePriceUsd: 99900,
    priceAdders: { Kit: { "Body Only": 0, "With 16-50mm PZ": 10000 } },
    valueCodes: { Black: "BLK", White: "WHT", "Body Only": "BODY", "With 16-50mm PZ": "KIT" },
    i18n: {
      tr: { title: "Sony ZV-E10 II", description: "İçerik üreticisinin aynasız kamerası. 26MP APS-C sensör, kırpmasız 4K 60p, sinematik vlog ayarları, ürün vitrin modu ve AI otomatik odaklama." },
      de: { title: "Sony ZV-E10 II", description: "Die Systemkamera für Content Creator. 26MP APS-C Sensor, 4K 60p ohne Crop, cinematische Vlog-Einstellungen, Produktpräsentationsmodus und KI-AF." },
      fr: { title: "Sony ZV-E10 II", description: "L'hybride du créateur de contenu. Capteur APS-C 26MP, 4K 60p sans recadrage, réglages vlog cinématiques, mode vitrine produit et AF IA." },
      pl: { title: "Sony ZV-E10 II", description: "Bezlusterkowiec twórcy treści. Sensor APS-C 26MP, 4K 60p bez przycinania, ustawienia vlog, tryb prezentacji produktu i AI autofocus." },
      lt: { title: "Sony ZV-E10 II", description: "Turinio kūrėjo beveidrodinis fotoaparatas. 26MP APS-C sensorius, 4K 60p be apkarpymo, kinematografiniai vlog nustatymai ir AI automatinis fokusavimas." },
      et: { title: "Sony ZV-E10 II", description: "Sisulooja hübriidkaamera. 26MP APS-C sensor, 4K 60p ilma kärpimiseta, kinemaatilised vlogi seaded ja AI autofookus." },
      lv: { title: "Sony ZV-E10 II", description: "Satura veidotāja bezspoguļa kamera. 26MP APS-C sensors, 4K 60p bez apgriešanas, kinematogrāfiski vlog iestatījumi un AI autofokuss." },
    },
  },
  {
    title: "Canon PowerShot V10",
    handle: "canon-powershot-v10",
    description: "Pocket vlogging camera. 1-inch CMOS sensor, 4K video, built-in wide-angle lens, flip-up screen, built-in stand, stereo microphone, and USB-C streaming.",
    category: "cameras",
    skuBase: "PSV10",
    options: [{ title: "Color", values: ["Black", "Silver"] }],
    basePriceUsd: 42900,
    priceAdders: {},
    valueCodes: { Black: "BLK", Silver: "SLV" },
    i18n: {
      tr: { title: "Canon PowerShot V10", description: "Cep vlog kamerası. 1 inç CMOS sensör, 4K video, dahili geniş açı lens, açılır ekran, dahili stand, stereo mikrofon ve USB-C canlı yayın." },
      de: { title: "Canon PowerShot V10", description: "Pocket-Vlogging-Kamera. 1-Zoll CMOS Sensor, 4K Video, eingebautes Weitwinkelobjektiv, Flip-Up-Screen, integrierter Ständer und USB-C Streaming." },
      fr: { title: "Canon PowerShot V10", description: "Caméra vlog de poche. Capteur CMOS 1 pouce, vidéo 4K, objectif grand-angle intégré, écran rabattable, pied intégré, micro stéréo et streaming USB-C." },
      pl: { title: "Canon PowerShot V10", description: "Kieszonkowa kamera vlog. Sensor CMOS 1 cal, wideo 4K, wbudowany obiektyw szerokokątny, odchylany ekran, wbudowany stojak i streaming USB-C." },
      lt: { title: "Canon PowerShot V10", description: "Kišeninė vlog kamera. 1 colio CMOS sensorius, 4K vaizdo įrašas, įmontuotas plataus kampo objektyvas, atlenkiamas ekranas ir USB-C transliacijos." },
      et: { title: "Canon PowerShot V10", description: "Taskuvlogi kaamera. 1-tolline CMOS sensor, 4K video, sisseehitatud lainurkobjektiiv, ülesklappuv ekraan ja USB-C voogedastus." },
      lv: { title: "Canon PowerShot V10", description: "Kabatas vlog kamera. 1 collas CMOS sensors, 4K video, iebūvēts platleņķa objektīvs, atlokāms ekrāns un USB-C straumēšana." },
    },
  },
];
const AUDIO = [
  {
    title: "AirPods Pro 3",
    handle: "airpods-pro-3",
    description: "Intelligent noise cancellation redefined. H3 chip, adaptive audio with conversation awareness, personalized spatial audio, IP54 dust and water resistance, and USB-C MagSafe case.",
    category: "audio",
    skuBase: "APP3",
    options: [{ title: "Variant", values: ["Standard"] }],
    basePriceUsd: 24900,
    priceAdders: {},
    valueCodes: { Standard: "STD" },
    i18n: {
      tr: { title: "AirPods Pro 3", description: "Akıllı gürültü engelleme yeniden tanımlandı. H3 çip, konuşma farkındalıklı uyarlanabilir ses, kişiselleştirilmiş uzamsal ses, IP54 toz ve su dayanıklılığı ve USB-C MagSafe kılıf." },
      de: { title: "AirPods Pro 3", description: "Intelligente Geräuschunterdrückung neu definiert. H3 Chip, adaptives Audio mit Gesprächserkennung, personalisiertes räumliches Audio, IP54 und USB-C MagSafe Case." },
      fr: { title: "AirPods Pro 3", description: "Réduction de bruit intelligente redéfinie. Puce H3, audio adaptatif avec détection de conversation, audio spatial personnalisé, IP54 et boîtier MagSafe USB-C." },
      pl: { title: "AirPods Pro 3", description: "Inteligentna redukcja szumów na nowo zdefiniowana. Chip H3, adaptacyjne audio ze świadomością rozmowy, spersonalizowany dźwięk przestrzenny, IP54 i etui MagSafe USB-C." },
      lt: { title: "AirPods Pro 3", description: "Pažangus triukšmo slopinimas iš naujo. H3 lustas, adaptyvus garsas su pokalbių atpažinimu, personalizuotas erdvinis garsas, IP54 ir USB-C MagSafe dėklas." },
      et: { title: "AirPods Pro 3", description: "Intelligentne mürasummutus uuesti defineeritud. H3 kiip, adaptiivne heli vestluse tuvastusega, isikustatud ruumiline heli, IP54 ja USB-C MagSafe ümbris." },
      lv: { title: "AirPods Pro 3", description: "Vieda trokšņu slāpēšana no jauna. H3 čips, adaptīvs audio ar sarunu atpazīšanu, personalizēts telpiskais audio, IP54 un USB-C MagSafe futrālis." },
    },
  },
  {
    title: "Sony WH-1000XM6",
    handle: "sony-wh-1000xm6",
    description: "Industry-leading noise cancellation. V2 integrated processor, 40mm carbon fiber drivers, 30-hour battery, multipoint Bluetooth 5.3, speak-to-chat, and LDAC Hi-Res Audio at just 227g.",
    category: "audio",
    skuBase: "XM6",
    options: [{ title: "Color", values: ["Black", "Silver", "Midnight Blue"] }],
    basePriceUsd: 34900,
    priceAdders: {},
    valueCodes: { Black: "BLK", Silver: "SLV", "Midnight Blue": "BLU" },
    i18n: {
      tr: { title: "Sony WH-1000XM6", description: "Sektör lideri gürültü engelleme. V2 işlemci, 40mm karbon fiber sürücüler, 30 saat pil, çok noktalı Bluetooth 5.3, konuşarak sohbet ve LDAC Hi-Res ses. Sadece 227g." },
      de: { title: "Sony WH-1000XM6", description: "Branchenführende Geräuschunterdrückung. V2 Prozessor, 40mm Carbonfaser-Treiber, 30 Stunden Akku, Multipoint Bluetooth 5.3, Speak-to-Chat und LDAC Hi-Res Audio. Nur 227g." },
      fr: { title: "Sony WH-1000XM6", description: "Réduction de bruit de référence. Processeur V2, transducteurs carbone 40mm, 30h d'autonomie, Bluetooth 5.3 multipoint, speak-to-chat et LDAC Hi-Res Audio. Seulement 227g." },
      pl: { title: "Sony WH-1000XM6", description: "Wiodąca w branży redukcja szumów. Procesor V2, przetworniki z włókna węglowego 40mm, 30 godzin baterii, Bluetooth 5.3 multipoint i LDAC Hi-Res Audio. Tylko 227g." },
      lt: { title: "Sony WH-1000XM6", description: "Pramonės lyderė triukšmo slopinime. V2 procesorius, 40mm anglies pluošto tvarkyklės, 30 valandų baterija, Bluetooth 5.3 ir LDAC Hi-Res garsas. Tik 227g." },
      et: { title: "Sony WH-1000XM6", description: "Tööstuse parim mürasummutus. V2 protsessor, 40mm süsinikkiud draiverid, 30 tundi akut, Bluetooth 5.3 ja LDAC Hi-Res heli. Vaid 227g." },
      lv: { title: "Sony WH-1000XM6", description: "Nozares vadošā trokšņu slāpēšana. V2 procesors, 40mm oglekļa šķiedras draiveri, 30 stundu akumulators, Bluetooth 5.3 un LDAC Hi-Res audio. Tikai 227g." },
    },
  },
  {
    title: "Bose QuietComfort Ultra Headphones",
    handle: "bose-qc-ultra",
    description: "Immersive sound meets world-class noise cancellation. CustomTune technology, Bose Immersive Audio with head tracking, up to 24 hours battery, and luxurious protein leather cushions.",
    category: "audio",
    skuBase: "BQCU",
    options: [{ title: "Color", values: ["Black", "White Smoke", "Sandstone"] }],
    basePriceUsd: 42900,
    priceAdders: {},
    valueCodes: { Black: "BLK", "White Smoke": "WHT", Sandstone: "SND" },
    i18n: {
      tr: { title: "Bose QuietComfort Ultra", description: "Sürükleyici ses ve dünya standartlarında gürültü engelleme. CustomTune teknolojisi, kafa takipli Bose Immersive Audio, 24 saate kadar pil ve lüks protein deri yastıklar." },
      de: { title: "Bose QuietComfort Ultra", description: "Immersiver Sound trifft erstklassige Geräuschunterdrückung. CustomTune-Technologie, Bose Immersive Audio mit Head-Tracking, bis zu 24 Stunden Akku und luxuriöse Proteinleder-Polster." },
      fr: { title: "Bose QuietComfort Ultra", description: "Son immersif et réduction de bruit de classe mondiale. Technologie CustomTune, Bose Immersive Audio avec suivi de tête, jusqu'à 24h d'autonomie et coussinets en cuir protéiné luxueux." },
      pl: { title: "Bose QuietComfort Ultra", description: "Wciągający dźwięk i światowej klasy redukcja szumów. Technologia CustomTune, Bose Immersive Audio ze śledzeniem głowy, do 24 godzin baterii i luksusowe poduszki ze skóry proteinowej." },
      lt: { title: "Bose QuietComfort Ultra", description: "Įtraukiantis garsas ir pasaulinio lygio triukšmo slopinimas. CustomTune technologija, Bose Immersive Audio su galvos sekimu, iki 24 valandų baterija ir prabangios baltymų odos pagalvėlės." },
      et: { title: "Bose QuietComfort Ultra", description: "Kaasahaarav heli ja maailmatasemel mürasummutus. CustomTune tehnoloogia, Bose Immersive Audio pea jälgimisega, kuni 24 tundi akut ja luksuslikud proteiinnahast padjad." },
      lv: { title: "Bose QuietComfort Ultra", description: "Iesaistoša skaņa un pasaules līmeņa trokšņu slāpēšana. CustomTune tehnoloģija, Bose Immersive Audio ar galvas izsekošanu, līdz 24 stundu akumulators un luksusa proteīnādas spilventiņi." },
    },
  },
  {
    title: "Samsung Galaxy Buds 3 Pro",
    handle: "galaxy-buds-3-pro",
    description: "Intelligent ANC with blade-style design. Dual drivers with planar tweeter, AI-powered adaptive noise control, 360 Audio with head tracking, and IP57 rating.",
    category: "audio",
    skuBase: "GB3P",
    options: [{ title: "Color", values: ["Silver", "White"] }],
    basePriceUsd: 24900,
    priceAdders: {},
    valueCodes: { Silver: "SLV", White: "WHT" },
    i18n: {
      tr: { title: "Galaxy Buds 3 Pro", description: "Bıçak tarzı tasarımla akıllı ANC. Düzlemsel tiz sürücülü çift sürücü, AI uyarlanabilir gürültü kontrolü, kafa takipli 360 Ses ve IP57." },
      de: { title: "Galaxy Buds 3 Pro", description: "Intelligentes ANC im Blade-Design. Dual-Treiber mit planarem Hochtöner, KI-adaptive Geräuschkontrolle, 360 Audio mit Head-Tracking und IP57." },
      fr: { title: "Galaxy Buds 3 Pro", description: "ANC intelligent au design blade. Double haut-parleur avec tweeter planaire, contrôle adaptatif du bruit par IA, audio 360 avec suivi de tête et IP57." },
      pl: { title: "Galaxy Buds 3 Pro", description: "Inteligentne ANC w stylu blade. Podwójne przetworniki z planarnym tweeterem, adaptacyjna kontrola hałasu AI, dźwięk 360 ze śledzeniem głowy i IP57." },
      lt: { title: "Galaxy Buds 3 Pro", description: "Pažangus ANC su blade stiliaus dizainu. Dvigubi tvarkykliai su planariniu aukštų dažnių garsiakalbiu, AI adaptyvus triukšmo valdymas, 360 garsas ir IP57." },
      et: { title: "Galaxy Buds 3 Pro", description: "Intelligentne ANC blade-stiiliga. Topeltdraiverid planaar-kõrgtooni kõlariga, AI-adaptiivne mürakontroll, 360 heli pea jälgimisega ja IP57." },
      lv: { title: "Galaxy Buds 3 Pro", description: "Inteliģenta ANC ar blade dizainu. Dubultie draiveri ar planāru augstfrekvences skaļruni, AI adaptīvā trokšņu kontrole, 360 audio ar galvas izsekošanu un IP57." },
    },
  },
  {
    title: "JBL Charge 6",
    handle: "jbl-charge-6",
    description: "The ultimate portable Bluetooth speaker. Dual passive radiators for deep bass, IP67 waterproof and dustproof, 24-hour playtime, built-in powerbank, and PartyBoost for linking speakers.",
    category: "audio",
    skuBase: "JBLC6",
    options: [{ title: "Color", values: ["Black", "Blue", "Red"] }],
    basePriceUsd: 17900,
    priceAdders: {},
    valueCodes: { Black: "BLK", Blue: "BLU", Red: "RED" },
    i18n: {
      tr: { title: "JBL Charge 6", description: "En iyi taşınabilir Bluetooth hoparlör. Derin bas için çift pasif radyatör, IP67 su ve toz geçirmez, 24 saat çalma süresi, dahili powerbank ve PartyBoost ile çoklu hoparlör bağlantısı." },
      de: { title: "JBL Charge 6", description: "Der ultimative tragbare Bluetooth-Lautsprecher. Dual-Passivradiatoren für tiefen Bass, IP67, 24 Stunden Spielzeit, integrierte Powerbank und PartyBoost." },
      fr: { title: "JBL Charge 6", description: "L'enceinte Bluetooth portable ultime. Double radiateurs passifs pour des basses profondes, IP67, 24h d'autonomie, powerbank intégrée et PartyBoost." },
      pl: { title: "JBL Charge 6", description: "Najlepszy przenośny głośnik Bluetooth. Podwójne pasywne radiatory dla głębokiego basu, IP67, 24 godziny grania, wbudowany powerbank i PartyBoost." },
      lt: { title: "JBL Charge 6", description: "Geriausias nešiojamas Bluetooth garsiakalbis. Dvigubi pasyvūs radiatoriai giliam bosui, IP67, 24 valandų grojimas, integruotas powerbank ir PartyBoost." },
      et: { title: "JBL Charge 6", description: "Parim kaasaskantav Bluetooth-kõlar. Topelt-passiivsed radiaatorid sügava bassi jaoks, IP67, 24 tundi mänguaega, sisseehitatud toitepank ja PartyBoost." },
      lv: { title: "JBL Charge 6", description: "Labākais portatīvais Bluetooth skaļrunis. Dubultie pasīvie radiatori dziļam basam, IP67, 24 stundu atskaņošana, iebūvēta powerbank un PartyBoost." },
    },
  },
  {
    title: "Sonos Era 300",
    handle: "sonos-era-300",
    description: "Spatial audio for the home. Six precisely-angled drivers for true Dolby Atmos, Wi-Fi 6 and Bluetooth, AirPlay 2, and Trueplay tuning that adapts to your room.",
    category: "audio",
    skuBase: "ERA300",
    options: [{ title: "Color", values: ["Black", "White"] }],
    basePriceUsd: 44900,
    priceAdders: {},
    valueCodes: { Black: "BLK", White: "WHT" },
    i18n: {
      tr: { title: "Sonos Era 300", description: "Ev için uzamsal ses. Gerçek Dolby Atmos için altı hassas açılı sürücü, Wi-Fi 6 ve Bluetooth, AirPlay 2 ve oda akustiğine uyum sağlayan Trueplay ayarı." },
      de: { title: "Sonos Era 300", description: "Räumlicher Sound für Zuhause. Sechs präzise ausgerichtete Treiber für echtes Dolby Atmos, Wi-Fi 6 und Bluetooth, AirPlay 2 und Trueplay-Raumkalibrierung." },
      fr: { title: "Sonos Era 300", description: "Audio spatial pour la maison. Six haut-parleurs orientés pour un vrai Dolby Atmos, Wi-Fi 6 et Bluetooth, AirPlay 2 et calibrage Trueplay." },
      pl: { title: "Sonos Era 300", description: "Dźwięk przestrzenny dla domu. Sześć precyzyjnie ustawionych przetworników dla prawdziwego Dolby Atmos, Wi-Fi 6 i Bluetooth, AirPlay 2 i kalibracja Trueplay." },
      lt: { title: "Sonos Era 300", description: "Erdvinis garsas namams. Šeši tiksliai nukreipti tvarkykliai tikram Dolby Atmos, Wi-Fi 6 ir Bluetooth, AirPlay 2 ir Trueplay derinimas." },
      et: { title: "Sonos Era 300", description: "Ruumiline heli kodu jaoks. Kuus täpselt suunatud draiverit tõelise Dolby Atmose jaoks, Wi-Fi 6 ja Bluetooth, AirPlay 2 ja Trueplay häälestus." },
      lv: { title: "Sonos Era 300", description: "Telpiskais audio mājām. Seši precīzi novirzīti draiveri īstam Dolby Atmos, Wi-Fi 6 un Bluetooth, AirPlay 2 un Trueplay pielāgošanās." },
    },
  },
  {
    title: "Sennheiser Momentum 4 Wireless",
    handle: "sennheiser-momentum-4",
    description: "Audiophile-grade wireless headphones. 42mm transducers with exceptional detail, adaptive noise cancellation, 60-hour battery life, and premium leather and metal build.",
    category: "audio",
    skuBase: "MTM4",
    options: [{ title: "Color", values: ["Black", "White", "Copper"] }],
    basePriceUsd: 34900,
    priceAdders: {},
    valueCodes: { Black: "BLK", White: "WHT", Copper: "CPR" },
    i18n: {
      tr: { title: "Sennheiser Momentum 4", description: "Audiophile sınıfı kablosuz kulaklık. Olağanüstü detaylı 42mm dönüştürücüler, uyarlanabilir gürültü engelleme, 60 saat pil ömrü ve premium deri-metal yapı kalitesi." },
      de: { title: "Sennheiser Momentum 4", description: "Audiophile kabellose Kopfhörer. 42mm Wandler mit außergewöhnlichem Detail, adaptive Geräuschunterdrückung, 60 Stunden Akku und Premium Leder-Metall-Verarbeitung." },
      fr: { title: "Sennheiser Momentum 4", description: "Casque sans fil audiophile. Transducteurs 42mm avec détail exceptionnel, ANC adaptatif, 60h d'autonomie et finition premium cuir et métal." },
      pl: { title: "Sennheiser Momentum 4", description: "Audiofilskie słuchawki bezprzewodowe. Przetworniki 42mm z wyjątkowym detalem, adaptacyjna redukcja szumów, 60 godzin baterii i premium wykończenie skóra-metal." },
      lt: { title: "Sennheiser Momentum 4", description: "Audiofilų klasės belaidės ausinės. 42mm keitikliai su išskirtiniu detalumu, adaptyvus triukšmo slopinimas, 60 valandų baterija ir aukščiausios kokybės odos-metalo apdaila." },
      et: { title: "Sennheiser Momentum 4", description: "Audiofiili tasemel juhtmevabad kõrvaklapid. 42mm muundurid erakordse detailsusega, adaptiivne mürasummutus, 60 tundi akut ja premium nahk-metall ehituskvaliteet." },
      lv: { title: "Sennheiser Momentum 4", description: "Audiofīlu līmeņa bezvadu austiņas. 42mm pārveidotāji ar izcilu detaļu, adaptīvā trokšņu slāpēšana, 60 stundu akumulators un premium ādas-metāla kvalitāte." },
    },
  },
  {
    title: "Marshall Emberton III",
    handle: "marshall-emberton-iii",
    description: "Iconic rock-and-roll sound, portable. True 360 sound with dual passive radiators, IP67, 32 hours of playtime, Stack Mode, and classic Marshall design.",
    category: "audio",
    skuBase: "MEMB3",
    options: [{ title: "Color", values: ["Black and Brass", "Cream"] }],
    basePriceUsd: 16900,
    priceAdders: {},
    valueCodes: { "Black and Brass": "BLK", Cream: "CRM" },
    i18n: {
      tr: { title: "Marshall Emberton III", description: "İkonik rock and roll sesi, taşınabilir. Çift pasif radyatörlü gerçek 360 ses, IP67, 32 saat çalma süresi, Stack Mode ve klasik Marshall tasarımı." },
      de: { title: "Marshall Emberton III", description: "Ikonischer Rock'n'Roll-Sound, tragbar. True 360 Sound mit Dual-Passivradiatoren, IP67, 32 Stunden Spielzeit, Stack Mode und klassisches Marshall-Design." },
      fr: { title: "Marshall Emberton III", description: "Son rock'n'roll iconique, portable. Son 360 avec double radiateurs passifs, IP67, 32h d'autonomie, Stack Mode et design Marshall classique." },
      pl: { title: "Marshall Emberton III", description: "Ikoniczny rockowy dźwięk w przenośnej formie. Prawdziwy dźwięk 360, IP67, 32 godziny grania, Stack Mode i klasyczny design Marshall." },
      lt: { title: "Marshall Emberton III", description: "Ikoninis roko garsas, nešiojamas. Tikras 360 garsas, IP67, 32 valandų grojimas, Stack Mode ir klasikinis Marshall dizainas." },
      et: { title: "Marshall Emberton III", description: "Ikooniline rock'n'roll heli, kaasaskantav. Tõeline 360 heli, IP67, 32 tundi mänguaega, Stack Mode ja klassikaline Marshalli disain." },
      lv: { title: "Marshall Emberton III", description: "Ikoniska rokanrola skaņa, portatīva. Patiesa 360 skaņa, IP67, 32 stundu atskaņošana, Stack Mode un klasiskais Marshall dizains." },
    },
  },
  {
    title: "Apple AirPods Max",
    handle: "airpods-max",
    description: "High-fidelity over-ear headphones. H2 chip, adaptive EQ, active noise cancellation, personalized spatial audio with dynamic head tracking, Digital Crown control, and anodized aluminum build.",
    category: "audio",
    skuBase: "APM",
    options: [{ title: "Color", values: ["Midnight", "Starlight", "Blue", "Purple", "Orange"] }],
    basePriceUsd: 54900,
    priceAdders: {},
    valueCodes: { Midnight: "MID", Starlight: "STR", Blue: "BLU", Purple: "PUR", Orange: "ORG" },
    i18n: {
      tr: { title: "Apple AirPods Max", description: "Yüksek sadakatli kulak üstü kulaklık. H2 çip, uyarlanabilir EQ, aktif gürültü engelleme, dinamik kafa takipli kişiselleştirilmiş uzamsal ses, Digital Crown kontrolü ve eloksallı alüminyum yapı." },
      de: { title: "Apple AirPods Max", description: "High-Fidelity Over-Ear-Kopfhörer. H2 Chip, adaptiver EQ, aktive Geräuschunterdrückung, personalisiertes räumliches Audio mit Kopf-Tracking, Digital Crown und eloxiertes Aluminium." },
      fr: { title: "Apple AirPods Max", description: "Casque circum-auriculaire haute fidélité. Puce H2, EQ adaptatif, ANC active, audio spatial personnalisé avec suivi dynamique, Digital Crown et aluminium anodisé." },
      pl: { title: "Apple AirPods Max", description: "Nauszne słuchawki Hi-Fi. Chip H2, adaptacyjne EQ, aktywna redukcja szumów, spersonalizowany dźwięk przestrzenny z dynamicznym śledzeniem głowy, Digital Crown i anodowane aluminium." },
      lt: { title: "Apple AirPods Max", description: "Aukštos kokybės apgaubiančios ausinės. H2 lustas, adaptyvus EQ, aktyvus triukšmo slopinimas, personalizuotas erdvinis garsas su galvos sekimu, Digital Crown ir anoduotas aliuminis." },
      et: { title: "Apple AirPods Max", description: "Kõrge kvaliteediga kõrvaklapid. H2 kiip, adaptiivne EQ, aktiivne mürasummutus, isikustatud ruumiline heli dünaamilise pea jälgimisega, Digital Crown ja anodeeritud alumiinium." },
      lv: { title: "Apple AirPods Max", description: "Augstas kvalitātes austiņas. H2 čips, adaptīvs EQ, aktīvā trokšņu slāpēšana, personalizēts telpiskais audio ar galvas izsekošanu, Digital Crown un anodēts alumīnijs." },
    },
  },
];
const WEARABLES = [
  {
    title: "Apple Watch Ultra 3",
    handle: "apple-watch-ultra-3",
    description: "Built for extreme adventure. 49mm titanium case, always-on Retina display at 3000 nits, S10 chip, precision dual-frequency GPS, depth gauge to 40m, 86dB siren, and up to 72 hours battery.",
    category: "wearables",
    skuBase: "AWU3",
    options: [{ title: "Band", values: ["Alpine Loop", "Trail Loop", "Ocean Band"] }],
    basePriceUsd: 79900,
    priceAdders: {},
    valueCodes: { "Alpine Loop": "ALP", "Trail Loop": "TRL", "Ocean Band": "OCN" },
    i18n: {
      tr: { title: "Apple Watch Ultra 3", description: "Ekstrem macera için tasarlandı. 49mm titanyum kasa, 3000 nit sürekli açık Retina ekran, S10 çip, çift frekanslı GPS, 40m derinlik ölçer ve düşük güç modunda 72 saate kadar pil." },
      de: { title: "Apple Watch Ultra 3", description: "Für extreme Abenteuer gebaut. 49mm Titangehäuse, Always-On Retina mit 3000 nit, S10 Chip, Dual-Frequenz-GPS, Tiefenmesser bis 40m und bis zu 72 Stunden Akku." },
      fr: { title: "Apple Watch Ultra 3", description: "Conçue pour l'aventure extrême. Boîtier titane 49mm, écran Retina always-on 3000 nits, puce S10, GPS double fréquence, profondimètre 40m et jusqu'à 72h en mode économie." },
      pl: { title: "Apple Watch Ultra 3", description: "Zbudowany na ekstremalne przygody. Tytanowa koperta 49mm, zawsze włączony Retina 3000 nitów, chip S10, dwuczęstotliwościowy GPS, głębokościomierz 40m i do 72 godzin baterii." },
      lt: { title: "Apple Watch Ultra 3", description: "Sukurtas ekstremaliam nuotykiui. 49mm titano korpusas, 3000 nitų visada įjungtas Retina ekranas, S10 lustas, dviejų dažnių GPS, 40m gylio matuoklis ir iki 72 valandų baterija." },
      et: { title: "Apple Watch Ultra 3", description: "Loodud ekstreemseteks seiklusteks. 49mm titaankorpus, 3000 niti always-on Retina, S10 kiip, topelt-sageduse GPS, sügavusmõõtur 40m ja kuni 72 tundi akut." },
      lv: { title: "Apple Watch Ultra 3", description: "Radīts ekstrēmiem piedzīvojumiem. 49mm titāna korpuss, 3000 nitu always-on Retina, S10 čips, dubultfrekvences GPS, dziļuma mērītājs 40m un līdz 72 stundu akumulators." },
    },
  },
  {
    title: "Samsung Galaxy Watch 7",
    handle: "galaxy-watch-7",
    description: "Smart health companion. Exynos W1000 3nm chip, sapphire crystal display, advanced BioActive sensor, Wear OS 5 with Galaxy AI, and IP68 + 5ATM water resistance.",
    category: "wearables",
    skuBase: "GW7",
    options: [
      { title: "Color", values: ["Green", "Silver", "Cream"] },
      { title: "Size", values: ["40mm", "44mm"] },
    ],
    basePriceUsd: 29900,
    priceAdders: { Size: { "40mm": 0, "44mm": 3000 } },
    valueCodes: { Green: "GRN", Silver: "SLV", Cream: "CRM", "40mm": "40", "44mm": "44" },
    i18n: {
      tr: { title: "Galaxy Watch 7", description: "Akıllı sağlık arkadaşı. Exynos W1000 3nm çip, safir kristal ekran, gelişmiş BioActive sensör, Wear OS 5 ve Galaxy AI, IP68 + 5ATM su dayanıklılığı." },
      de: { title: "Galaxy Watch 7", description: "Smarter Gesundheitsbegleiter. Exynos W1000 3nm Chip, Saphirkristall-Display, fortschrittlicher BioActive-Sensor, Wear OS 5 mit Galaxy AI und IP68 + 5ATM." },
      fr: { title: "Galaxy Watch 7", description: "Compagnon santé intelligent. Puce Exynos W1000 3nm, écran cristal saphir, capteur BioActive avancé, Wear OS 5 avec Galaxy AI et IP68 + 5ATM." },
      pl: { title: "Galaxy Watch 7", description: "Inteligentny towarzysz zdrowia. Chip Exynos W1000 3nm, szafirowy wyświetlacz, zaawansowany sensor BioActive, Wear OS 5 z Galaxy AI i wodoodporność IP68 + 5ATM." },
      lt: { title: "Galaxy Watch 7", description: "Protingas sveikatos kompanionas. Exynos W1000 3nm lustas, safyro ekranas, pažangus BioActive sensorius, Wear OS 5 su Galaxy AI ir IP68 + 5ATM." },
      et: { title: "Galaxy Watch 7", description: "Nutikas tervisekaaslane. Exynos W1000 3nm kiip, safiirist ekraan, täiustatud BioActive sensor, Wear OS 5 Galaxy AI-ga ja IP68 + 5ATM veekindlus." },
      lv: { title: "Galaxy Watch 7", description: "Gudrs veselības pavadonis. Exynos W1000 3nm čips, safīra displejs, uzlabots BioActive sensors, Wear OS 5 ar Galaxy AI un IP68 + 5ATM." },
    },
  },
  {
    title: "Garmin Fenix 8",
    handle: "garmin-fenix-8",
    description: "The ultimate multisport GPS watch. AMOLED display, solar charging, multi-band GNSS with SatIQ, built-in flashlight, dive-ready to 40m, topo maps, and up to 48 days battery.",
    category: "wearables",
    skuBase: "FNX8",
    options: [{ title: "Size", values: ["47mm AMOLED", "51mm AMOLED"] }],
    basePriceUsd: 89900,
    priceAdders: { Size: { "47mm AMOLED": 0, "51mm AMOLED": 10000 } },
    valueCodes: { "47mm AMOLED": "47", "51mm AMOLED": "51" },
    i18n: {
      tr: { title: "Garmin Fenix 8", description: "En üst düzey çoklu spor GPS saati. AMOLED ekran, güneş enerjisi şarjı, SatIQ ile çok bantlı GNSS, dahili fener, 40m dalış ve 48 güne kadar pil ömrü." },
      de: { title: "Garmin Fenix 8", description: "Die ultimative Multisport-GPS-Uhr. AMOLED Display, Solarladung, Multi-Band GNSS mit SatIQ, integrierte Taschenlampe, tauchtauglich bis 40m und bis zu 48 Tage Akku." },
      fr: { title: "Garmin Fenix 8", description: "La montre GPS multisport ultime. Écran AMOLED, charge solaire, GNSS multibande SatIQ, lampe intégrée, plongée jusqu'à 40m et jusqu'à 48 jours d'autonomie." },
      pl: { title: "Garmin Fenix 8", description: "Najlepszy zegarek GPS multisport. Wyświetlacz AMOLED, ładowanie solarne, wielopasmowy GNSS z SatIQ, wbudowana latarka, nurkowanie do 40m i do 48 dni baterii." },
      lt: { title: "Garmin Fenix 8", description: "Geriausias multisporto GPS laikrodis. AMOLED ekranas, saulės energijos įkrovimas, daugiajuostis GNSS su SatIQ, integruotas žibintuvėlis ir iki 48 dienų baterija." },
      et: { title: "Garmin Fenix 8", description: "Parim multispordi GPS-kell. AMOLED ekraan, päikeseenergia laadimine, mitmeriba GNSS SatIQ-ga, sisseehitatud taskulamp ja kuni 48 päeva akut." },
      lv: { title: "Garmin Fenix 8", description: "Labākais multisporta GPS pulkstenis. AMOLED displejs, saules uzlāde, daudzjoslu GNSS ar SatIQ, iebūvēts lukturītis un līdz 48 dienu akumulators." },
    },
  },
  {
    title: "Google Pixel Watch 3",
    handle: "pixel-watch-3",
    description: "Beautifully smart. Circular domed AMOLED display, Fitbit health tracking, fall and crash detection, Emergency SOS, and deep Google Assistant and Gemini AI integration.",
    category: "wearables",
    skuBase: "PW3",
    options: [
      { title: "Color", values: ["Matte Black", "Polished Silver"] },
      { title: "Size", values: ["41mm", "45mm"] },
    ],
    basePriceUsd: 34900,
    priceAdders: { Size: { "41mm": 0, "45mm": 5000 } },
    valueCodes: { "Matte Black": "BLK", "Polished Silver": "SLV", "41mm": "41", "45mm": "45" },
    i18n: {
      tr: { title: "Google Pixel Watch 3", description: "Güzelce akıllı. Dairesel kubbeli AMOLED ekran, Fitbit sağlık takibi, düşme ve kaza algılama, Acil SOS ve Google Assistant ile Gemini AI entegrasyonu." },
      de: { title: "Google Pixel Watch 3", description: "Wunderschön smart. Rundes gewölbtes AMOLED Display, Fitbit Gesundheitstracking, Sturz- und Unfallerkennung, Notfall-SOS und Google Assistant und Gemini KI." },
      fr: { title: "Google Pixel Watch 3", description: "Magnifiquement intelligent. Écran AMOLED circulaire bombé, suivi santé Fitbit, détection de chute et collision, SOS d'urgence et intégration Google Assistant et Gemini AI." },
      pl: { title: "Google Pixel Watch 3", description: "Pięknie inteligentny. Okrągły kopułowy wyświetlacz AMOLED, śledzenie zdrowia Fitbit, wykrywanie upadków i wypadków, SOS i integracja z Google Assistant i Gemini AI." },
      lt: { title: "Google Pixel Watch 3", description: "Gražiai protingas. Apvalus kupolo formos AMOLED ekranas, Fitbit sveikatos sekimas, kritimo ir avarijos aptikimas, SOS ir gili Google Assistant bei Gemini AI integracija." },
      et: { title: "Google Pixel Watch 3", description: "Kaunilt nutikas. Ümar kupliekraan AMOLED, Fitbit tervisejälgimine, kukkumise ja kokkupõrke tuvastus, hädaabi SOS ja sügav Google Assistanti ning Gemini AI integratsioon." },
      lv: { title: "Google Pixel Watch 3", description: "Skaisti gudrs. Apaļš kupola AMOLED displejs, Fitbit veselības izsekošana, kritiena un avārijas noteikšana, SOS un dziļa Google Assistant un Gemini AI integrācija." },
    },
  },
  {
    title: "Fitbit Charge 6",
    handle: "fitbit-charge-6",
    description: "Advanced health and fitness tracker. Built-in GPS, continuous heart rate and stress monitoring, ECG app, SpO2, skin temperature sensing, 40+ exercise modes, and 7-day battery.",
    category: "wearables",
    skuBase: "FC6",
    options: [{ title: "Color", values: ["Black", "Coral", "Porcelain"] }],
    basePriceUsd: 15900,
    priceAdders: {},
    valueCodes: { Black: "BLK", Coral: "CRL", Porcelain: "PRC" },
    i18n: {
      tr: { title: "Fitbit Charge 6", description: "Gelişmiş sağlık ve fitness takipçisi. Dahili GPS, sürekli kalp atış hızı ve stres izleme, EKG uygulaması, SpO2, cilt sıcaklığı, 40+ egzersiz modu ve 7 gün pil." },
      de: { title: "Fitbit Charge 6", description: "Fortschrittlicher Gesundheits- und Fitness-Tracker. GPS, kontinuierliche Herzfrequenz- und Stressüberwachung, EKG-App, SpO2, Hauttemperatur, 40+ Trainingsmodi und 7 Tage Akku." },
      fr: { title: "Fitbit Charge 6", description: "Tracker santé et fitness avancé. GPS intégré, suivi continu du rythme cardiaque et du stress, ECG, SpO2, température cutanée, 40+ modes d'exercice et 7 jours d'autonomie." },
      pl: { title: "Fitbit Charge 6", description: "Zaawansowany tracker zdrowia i fitness. Wbudowany GPS, ciągłe monitorowanie tętna i stresu, EKG, SpO2, temperatura skóry, 40+ trybów ćwiczeń i 7 dni baterii." },
      lt: { title: "Fitbit Charge 6", description: "Pažangus sveikatos ir fizinio aktyvumo sekiklis. Integruotas GPS, nuolatinis širdies ritmo ir streso stebėjimas, EKG, SpO2, odos temperatūra ir 7 dienų baterija." },
      et: { title: "Fitbit Charge 6", description: "Täiustatud tervise- ja treeningujälgija. Sisseehitatud GPS, pidev südame löögisageduse ja stressi jälgimine, EKG, SpO2, naha temperatuur ja 7 päeva akut." },
      lv: { title: "Fitbit Charge 6", description: "Uzlabots veselības un fitnesa izsekotājs. Iebūvēts GPS, nepārtraukta sirdsdarbības un stresa uzraudzība, EKG, SpO2, ādas temperatūra un 7 dienu akumulators." },
    },
  },
  {
    title: "Oura Ring 4",
    handle: "oura-ring-4",
    description: "Health tracking reimagined. Titanium smart ring with research-grade sensors for sleep stages, heart rate variability, blood oxygen, body temperature, and stress. No screen, no distractions.",
    category: "wearables",
    skuBase: "OURA4",
    options: [{ title: "Finish", values: ["Silver", "Black", "Gold"] }],
    basePriceUsd: 34900,
    priceAdders: { Finish: { Silver: 0, Black: 0, Gold: 10000 } },
    valueCodes: { Silver: "SLV", Black: "BLK", Gold: "GLD" },
    i18n: {
      tr: { title: "Oura Ring 4", description: "Sağlık takibi yeniden tasarlandı. Araştırma sınıfı sensörlü titanyum akıllı yüzük — uyku evreleri, kalp atış hızı değişkenliği, kan oksijeni, vücut sıcaklığı ve stres. Ekran yok, dikkat dağıtma yok." },
      de: { title: "Oura Ring 4", description: "Gesundheitstracking neu gedacht. Titan-Smartring mit forschungsbasierten Sensoren für Schlafphasen, Herzfrequenzvariabilität, Blutsauerstoff, Körpertemperatur und Stress. Kein Display." },
      fr: { title: "Oura Ring 4", description: "Le suivi santé réinventé. Bague intelligente en titane avec capteurs de recherche — stades de sommeil, variabilité cardiaque, oxygène sanguin, température corporelle et stress. Pas d'écran." },
      pl: { title: "Oura Ring 4", description: "Śledzenie zdrowia na nowo. Tytanowy inteligentny pierścień z czujnikami klasy badawczej — fazy snu, zmienność tętna, saturacja, temperatura ciała i stres. Bez ekranu." },
      lt: { title: "Oura Ring 4", description: "Sveikatos stebėjimas iš naujo. Titaninis išmanusis žiedas su mokslinės klasės jutikliais — miego fazės, širdies ritmo kintamumas, kraujo deguonis, kūno temperatūra ir stresas." },
      et: { title: "Oura Ring 4", description: "Tervisejälgimine uuesti leiutatud. Titaanist nutikas sõrmus teadustasemel sensoritega — unefaasid, südame löögisageduse varieeruvus, vere hapnik, kehatemperatuur ja stress." },
      lv: { title: "Oura Ring 4", description: "Veselības izsekošana no jauna. Titāna viedgredzens ar pētniecības līmeņa sensoriem — miega fāzes, sirdsdarbības mainība, asins skābeklis, ķermeņa temperatūra un stress." },
    },
  },
  {
    title: "Apple Watch SE (3rd Gen)",
    handle: "apple-watch-se-3",
    description: "Essential Apple Watch features at an accessible price. S9 chip, crash and fall detection, heart rate notifications, Emergency SOS, sleep tracking, and seamless iPhone integration.",
    category: "wearables",
    skuBase: "AWSE3",
    options: [
      { title: "Color", values: ["Midnight", "Starlight"] },
      { title: "Size", values: ["40mm", "44mm"] },
    ],
    basePriceUsd: 24900,
    priceAdders: { Size: { "40mm": 0, "44mm": 3000 } },
    valueCodes: { Midnight: "MID", Starlight: "STR", "40mm": "40", "44mm": "44" },
    i18n: {
      tr: { title: "Apple Watch SE (3. Nesil)", description: "Temel Apple Watch özellikleri erişilebilir fiyata. S9 çip, kaza ve düşme algılama, kalp atış hızı bildirimleri, Acil SOS, uyku takibi ve sorunsuz iPhone entegrasyonu." },
      de: { title: "Apple Watch SE (3. Gen)", description: "Essentielle Apple Watch Funktionen zum erschwinglichen Preis. S9 Chip, Unfall- und Sturzerkennung, Herzfrequenzbenachrichtigungen, Notfall-SOS und iPhone-Integration." },
      fr: { title: "Apple Watch SE (3e gén.)", description: "Les fonctions essentielles de l'Apple Watch à prix accessible. Puce S9, détection de collision et de chute, alertes cardiaques, SOS d'urgence et intégration iPhone." },
      pl: { title: "Apple Watch SE (3. gen.)", description: "Podstawowe funkcje Apple Watch w przystępnej cenie. Chip S9, wykrywanie wypadków i upadków, powiadomienia tętna, SOS, śledzenie snu i integracja z iPhone." },
      lt: { title: "Apple Watch SE (3 karta)", description: "Pagrindinės Apple Watch funkcijos prieinama kaina. S9 lustas, avarijos ir kritimo aptikimas, širdies ritmo pranešimai, SOS, miego sekimas ir iPhone integracija." },
      et: { title: "Apple Watch SE (3. põlvkond)", description: "Olulised Apple Watchi funktsioonid taskukohase hinnaga. S9 kiip, kokkupõrke ja kukkumise tuvastus, südame löögisageduse teavitused, hädaabi SOS ja iPhone'i integratsioon." },
      lv: { title: "Apple Watch SE (3. paaudze)", description: "Būtiskās Apple Watch funkcijas par pieejamu cenu. S9 čips, avārijas un kritiena noteikšana, sirdsdarbības paziņojumi, SOS un iPhone integrācija." },
    },
  },
  {
    title: "Garmin Venu 3",
    handle: "garmin-venu-3",
    description: "Smartwatch meets fitness coach. Bright AMOLED display, body battery energy monitoring, sleep coach with nap detection, built-in speaker and mic for calls, and up to 14 days battery.",
    category: "wearables",
    skuBase: "VENU3",
    options: [
      { title: "Color", values: ["Black", "Ivory"] },
      { title: "Size", values: ["41mm", "45mm"] },
    ],
    basePriceUsd: 44900,
    priceAdders: {},
    valueCodes: { Black: "BLK", Ivory: "IVR", "41mm": "41", "45mm": "45" },
    i18n: {
      tr: { title: "Garmin Venu 3", description: "Akıllı saat fitness koçuyla buluşuyor. Parlak AMOLED ekran, vücut batarya enerji izleme, şekerleme algılamalı uyku koçu, aramalar için hoparlör ve mikrofon ve 14 güne kadar pil." },
      de: { title: "Garmin Venu 3", description: "Smartwatch trifft Fitness-Coach. Helles AMOLED Display, Body Battery Energiemonitoring, Schlafcoach mit Nickerchen-Erkennung, Lautsprecher und Mikrofon und bis zu 14 Tage Akku." },
      fr: { title: "Garmin Venu 3", description: "Montre connectée et coach fitness. Écran AMOLED lumineux, suivi d'énergie Body Battery, coach sommeil avec détection de sieste, haut-parleur et micro et jusqu'à 14 jours d'autonomie." },
      pl: { title: "Garmin Venu 3", description: "Smartwatch spotyka trenera fitness. Jasny wyświetlacz AMOLED, monitorowanie energii Body Battery, trener snu z wykrywaniem drzemek, głośnik i mikrofon i do 14 dni baterii." },
      lt: { title: "Garmin Venu 3", description: "Išmanusis laikrodis ir treneris viename. Ryškus AMOLED ekranas, Body Battery energijos stebėjimas, miego treneris su snūdos aptikimu ir iki 14 dienų baterija." },
      et: { title: "Garmin Venu 3", description: "Nutikell kohtub treeneriga. Ere AMOLED ekraan, keha aku energia jälgimine, unetreener uinaku tuvastusega, kõlar ja mikrofon ja kuni 14 päeva akut." },
      lv: { title: "Garmin Venu 3", description: "Viedpulkstenis satiek fitnesa treneri. Spilgts AMOLED displejs, Body Battery enerģijas uzraudzība, miega treneris ar snaudu noteikšanu, skaļrunis un mikrofons un līdz 14 dienu akumulators." },
    },
  },
];
const ACCESSORIES = [
  {
    title: "Samsung T9 Portable SSD 2TB",
    handle: "samsung-t9-ssd-2tb",
    description: "Blazing fast portable storage. Up to 2,000 MB/s read/write with USB 3.2 Gen 2x2, shock-resistant rubber exterior with IP65, hardware encryption, and compact pocket-sized design.",
    category: "accessories",
    skuBase: "T9SSD",
    options: [{ title: "Capacity", values: ["1TB", "2TB", "4TB"] }],
    basePriceUsd: 10900,
    priceAdders: { Capacity: { "1TB": 0, "2TB": 7000, "4TB": 19000 } },
    valueCodes: { "1TB": "1TB", "2TB": "2TB", "4TB": "4TB" },
    i18n: {
      tr: { title: "Samsung T9 Taşınabilir SSD", description: "Son derece hızlı taşınabilir depolama. USB 3.2 Gen 2x2 ile 2.000 MB/s okuma/yazma, IP65 su ve toz dayanıklılığı, donanım şifreleme ve kompakt cep boyutu." },
      de: { title: "Samsung T9 Portable SSD", description: "Extrem schneller mobiler Speicher. Bis zu 2.000 MB/s mit USB 3.2 Gen 2x2, stoßfestes Gummigehäuse mit IP65, Hardwareverschlüsselung und kompaktes Taschenformat." },
      fr: { title: "Samsung T9 SSD Portable", description: "Stockage portable ultra-rapide. Jusqu'à 2 000 Mo/s en USB 3.2 Gen 2x2, extérieur caoutchouté antichoc IP65, chiffrement matériel et format de poche compact." },
      pl: { title: "Samsung T9 Przenośny SSD", description: "Błyskawicznie szybka przenośna pamięć. Do 2000 MB/s przez USB 3.2 Gen 2x2, odporność na wstrząsy z IP65, szyfrowanie sprzętowe i kompaktowy rozmiar kieszonkowy." },
      lt: { title: "Samsung T9 Nešiojamas SSD", description: "Žaibiškai greita nešiojama atmintis. Iki 2000 MB/s su USB 3.2 Gen 2x2, smūgiams atsparus guminis korpusas su IP65, aparatinis šifravimas ir kišeninis dydis." },
      et: { title: "Samsung T9 Kaasaskantav SSD", description: "Välkkiire kaasaskantav salvestus. Kuni 2000 MB/s USB 3.2 Gen 2x2-ga, löögikindel kummist korpus IP65-ga, riistvaraline krüptimine ja kompaktne taskusuurus." },
      lv: { title: "Samsung T9 Portatīvais SSD", description: "Zibensātra portatīvā krātuve. Līdz 2000 MB/s ar USB 3.2 Gen 2x2, triecienizturīgs gumijas korpuss ar IP65, aparatūras šifrēšana un kompakts kabatas izmērs." },
    },
  },
  {
    title: "SanDisk Ultra USB-C Flash Drive 256GB",
    handle: "sandisk-ultra-usbc-256gb",
    description: "High-speed USB-C storage. Up to 400 MB/s read speeds, USB 3.2 Gen 1, slim retractable design with keyring hole, and password protection with 128-bit AES encryption.",
    category: "accessories",
    skuBase: "SDULTRA",
    options: [{ title: "Capacity", values: ["128GB", "256GB"] }],
    basePriceUsd: 1900,
    priceAdders: { Capacity: { "128GB": 0, "256GB": 1000 } },
    valueCodes: { "128GB": "128", "256GB": "256" },
    i18n: {
      tr: { title: "SanDisk Ultra USB-C 256GB", description: "Yüksek hızlı USB-C depolama. 400 MB/s okuma hızı, USB 3.2 Gen 1, anahtarlık delikli ince geri çekilebilir tasarım ve 128-bit AES şifreleme." },
      de: { title: "SanDisk Ultra USB-C 256GB", description: "Schneller USB-C-Speicher. Bis zu 400 MB/s Lesegeschwindigkeit, USB 3.2 Gen 1, schlankes einziehbares Design mit Schlüsselring und 128-bit AES." },
      fr: { title: "SanDisk Ultra USB-C 256Go", description: "Stockage USB-C haute vitesse. Jusqu'à 400 Mo/s en lecture, USB 3.2 Gen 1, design rétractable fin avec porte-clés et protection AES 128 bits." },
      pl: { title: "SanDisk Ultra USB-C 256GB", description: "Szybka pamięć USB-C. Do 400 MB/s odczytu, USB 3.2 Gen 1, smukła wysuwana konstrukcja z oczkiem na brelok i szyfrowanie 128-bit AES." },
      lt: { title: "SanDisk Ultra USB-C 256GB", description: "Greita USB-C atmintis. Iki 400 MB/s skaitymo greitis, USB 3.2 Gen 1, plonas ištraukiamas dizainas su raktų pakabuko skylute ir 128 bitų AES." },
      et: { title: "SanDisk Ultra USB-C 256GB", description: "Kiire USB-C mäluseade. Kuni 400 MB/s lugemiskiirus, USB 3.2 Gen 1, õhuke sissetõmmatav disain võtmehoidja avaga ja 128-bit AES krüptimine." },
      lv: { title: "SanDisk Ultra USB-C 256GB", description: "Ātra USB-C krātuve. Līdz 400 MB/s lasīšana, USB 3.2 Gen 1, plāns ievelkams dizains ar atslēgu piekariņa atveri un 128 bitu AES šifrēšana." },
    },
  },
  {
    title: "Anker 65W GaN Charger",
    handle: "anker-65w-gan-charger",
    description: "Compact powerhouse. GaN III technology for 65W in a tiny form factor, 2x USB-C + 1x USB-A ports, PowerIQ 4.0, foldable plug, and compatible with laptops, phones, and tablets.",
    category: "accessories",
    skuBase: "ANK65W",
    options: [{ title: "Variant", values: ["Standard"] }],
    basePriceUsd: 4500,
    priceAdders: {},
    valueCodes: { Standard: "STD" },
    i18n: {
      tr: { title: "Anker 65W GaN Şarj Cihazı", description: "Kompakt güç merkezi. Küçük boyutta GaN III teknolojisi ile 65W, 2x USB-C + 1x USB-A, PowerIQ 4.0 ve katlanabilir fiş. Dizüstü, telefon ve tabletlerle uyumlu." },
      de: { title: "Anker 65W GaN Ladegerät", description: "Kompaktes Kraftpaket. GaN III für 65W im Mini-Format, 2x USB-C + 1x USB-A, PowerIQ 4.0, faltbarer Stecker und kompatibel mit Laptops, Phones und Tablets." },
      fr: { title: "Chargeur Anker 65W GaN", description: "Puissance compacte. Technologie GaN III pour 65W en format mini, 2x USB-C + 1x USB-A, PowerIQ 4.0, prise pliable et compatible ordinateurs, téléphones et tablettes." },
      pl: { title: "Ładowarka Anker 65W GaN", description: "Kompaktowa potęga. Technologia GaN III dla 65W w małym formacie, 2x USB-C + 1x USB-A, PowerIQ 4.0 i składana wtyczka. Kompatybilna z laptopami i telefonami." },
      lt: { title: "Anker 65W GaN Įkroviklis", description: "Kompaktiška galia. GaN III technologija 65W mažame formate, 2x USB-C + 1x USB-A, PowerIQ 4.0 ir sulankstomas kištukas. Suderinamas su nešiojamais ir telefonais." },
      et: { title: "Anker 65W GaN Laadija", description: "Kompaktne jõujaam. GaN III tehnoloogia 65W väikeses vormis, 2x USB-C + 1x USB-A, PowerIQ 4.0 ja kokkupandav pistik. Ühildub sülearvutite ja telefonidega." },
      lv: { title: "Anker 65W GaN Lādētājs", description: "Kompakts spēkstacija. GaN III tehnoloģija 65W mazā formā, 2x USB-C + 1x USB-A, PowerIQ 4.0 un salokāms spraudnis. Savietojams ar portatīvajiem un tālruņiem." },
    },
  },
  {
    title: "Apple MagSafe Charger",
    handle: "apple-magsafe-charger",
    description: "Perfect magnetic alignment for effortless wireless charging. Up to 25W fast charging for iPhone 16 series, Qi2 compatible, integrated USB-C cable, and works through lightweight cases.",
    category: "accessories",
    skuBase: "MAGSAFE",
    options: [{ title: "Length", values: ["1m", "2m"] }],
    basePriceUsd: 3900,
    priceAdders: { Length: { "1m": 0, "2m": 1000 } },
    valueCodes: { "1m": "1M", "2m": "2M" },
    i18n: {
      tr: { title: "Apple MagSafe Şarj Cihazı", description: "Zahmetsiz kablosuz şarj için mükemmel manyetik hizalama. iPhone 16 serisi için 25W hızlı şarj, Qi2 uyumlu, entegre USB-C kablo ve hafif kılıflar üzerinden çalışır." },
      de: { title: "Apple MagSafe Ladegerät", description: "Perfekte magnetische Ausrichtung für müheloses kabelloses Laden. Bis zu 25W für iPhone 16, Qi2-kompatibel, integriertes USB-C-Kabel und funktioniert durch leichte Hüllen." },
      fr: { title: "Chargeur Apple MagSafe", description: "Alignement magnétique parfait pour une charge sans fil facile. Jusqu'à 25W pour iPhone 16, compatible Qi2, câble USB-C intégré et fonctionne à travers les coques légères." },
      pl: { title: "Ładowarka Apple MagSafe", description: "Idealne magnetyczne ustawienie. Do 25W szybkiego ładowania dla iPhone 16, kompatybilna z Qi2, zintegrowany kabel USB-C i działa przez lekkie etui." },
      lt: { title: "Apple MagSafe Įkroviklis", description: "Puikus magnetinis lygiavimas lengvam belaidžiam įkrovimui. Iki 25W greitas įkrovimas iPhone 16, Qi2 suderinamas ir integruotas USB-C kabelis." },
      et: { title: "Apple MagSafe Laadija", description: "Täiuslik magnetiline joondamine vaevatu juhtmevaba laadimise jaoks. Kuni 25W kiirlaadimine iPhone 16-le, Qi2 ühilduv ja integreeritud USB-C kaabel." },
      lv: { title: "Apple MagSafe Lādētājs", description: "Ideāla magnētiskā izlīdzināšana vieglai bezvadu uzlādei. Līdz 25W ātrā uzlāde iPhone 16, Qi2 savietojams un integrēts USB-C kabelis." },
    },
  },
  {
    title: "Logitech MX Master 3S",
    handle: "logitech-mx-master-3s",
    description: "The productivity mouse. 8K DPI tracking on any surface including glass, quiet clicks, MagSpeed electromagnetic scroll wheel, ergonomic design, USB-C quick charge, and Flow cross-computer control.",
    category: "accessories",
    skuBase: "MXM3S",
    options: [{ title: "Color", values: ["Graphite", "Pale Grey"] }],
    basePriceUsd: 9900,
    priceAdders: {},
    valueCodes: { Graphite: "GR", "Pale Grey": "PG" },
    i18n: {
      tr: { title: "Logitech MX Master 3S", description: "Üretkenlik faresi. Cam dahil her yüzeyde 8K DPI izleme, sessiz tıklamalar, MagSpeed kaydırma tekerleği, ergonomik tasarım, USB-C hızlı şarj ve Flow çapraz bilgisayar kontrolü." },
      de: { title: "Logitech MX Master 3S", description: "Die Produktivitätsmaus. 8K DPI Tracking auf jeder Oberfläche inkl. Glas, leise Klicks, MagSpeed Scrollrad, ergonomisches Design, USB-C Schnellladung und Flow Cross-Computer." },
      fr: { title: "Logitech MX Master 3S", description: "La souris productivité. Suivi 8K DPI sur toute surface y compris le verre, clics silencieux, molette MagSpeed, design ergonomique, USB-C et contrôle Flow multi-ordinateur." },
      pl: { title: "Logitech MX Master 3S", description: "Mysz produktywności. Śledzenie 8K DPI na każdej powierzchni w tym szkle, ciche kliknięcia, kółko MagSpeed, ergonomiczny design, USB-C i kontrola Flow między komputerami." },
      lt: { title: "Logitech MX Master 3S", description: "Produktyvumo pelė. 8K DPI sekimas bet kokiame paviršiuje, tylūs paspaudimai, MagSpeed slinkties ratukas, ergonominis dizainas ir Flow valdymas tarp kompiuterių." },
      et: { title: "Logitech MX Master 3S", description: "Tootlikkuse hiir. 8K DPI jälgimine igal pinnal sh klaasil, vaiksed klõpsud, MagSpeed kerimisratas, ergonoomiline disain ja Flow ristarvuti juhtimine." },
      lv: { title: "Logitech MX Master 3S", description: "Produktivitātes pele. 8K DPI izsekošana uz jebkuras virsmas, klusie klikšķi, MagSpeed ritenis, ergonomisks dizains un Flow starp datoriem." },
    },
  },
  {
    title: "Razer DeathAdder V3",
    handle: "razer-deathadder-v3",
    description: "Esports-grade gaming mouse. Focus Pro 30K optical sensor, 90-hour battery, HyperSpeed wireless with <1ms latency, ultra-lightweight 63g, Gen-3 optical switches, and ergonomic shape refined over 15 years.",
    category: "accessories",
    skuBase: "DAV3",
    options: [{ title: "Color", values: ["Black", "White"] }],
    basePriceUsd: 8900,
    priceAdders: {},
    valueCodes: { Black: "BLK", White: "WHT" },
    i18n: {
      tr: { title: "Razer DeathAdder V3", description: "E-spor sınıfı oyun faresi. Focus Pro 30K optik sensör, 90 saat pil, <1ms gecikmeyle HyperSpeed kablosuz, 63g ultra hafif, Gen-3 optik anahtarlar ve 15 yıllık ergonomik form." },
      de: { title: "Razer DeathAdder V3", description: "E-Sport Gaming-Maus. Focus Pro 30K optischer Sensor, 90 Stunden Akku, HyperSpeed Wireless mit <1ms Latenz, ultraleichtes 63g, Gen-3 optische Schalter und ergonomische Form." },
      fr: { title: "Razer DeathAdder V3", description: "Souris gaming esport. Capteur optique Focus Pro 30K, 90h d'autonomie, sans fil HyperSpeed <1ms, ultra-léger 63g, switchs optiques Gen-3 et forme ergonomique de 15 ans." },
      pl: { title: "Razer DeathAdder V3", description: "E-sportowa mysz gamingowa. Sensor Focus Pro 30K, 90 godzin baterii, HyperSpeed bezprzewodowa <1ms, ultra-lekka 63g, przełączniki optyczne Gen-3 i ergonomiczny kształt." },
      lt: { title: "Razer DeathAdder V3", description: "El. sporto žaidimų pelė. Focus Pro 30K optinis sensorius, 90 valandų baterija, HyperSpeed belaidė <1ms, itin lengvas 63g ir Gen-3 optiniai jungikliai." },
      et: { title: "Razer DeathAdder V3", description: "E-spordi mänguhiir. Focus Pro 30K optiline sensor, 90 tundi akut, HyperSpeed juhtmevaba <1ms, üliker 63g ja Gen-3 optilised lülitid." },
      lv: { title: "Razer DeathAdder V3", description: "E-sporta spēļu pele. Focus Pro 30K optiskais sensors, 90 stundu akumulators, HyperSpeed bezvadu <1ms, ultra-viegls 63g un Gen-3 optiskie slēdži." },
    },
  },
  {
    title: "Apple Magic Keyboard with Touch ID",
    handle: "apple-magic-keyboard",
    description: "Wireless keyboard perfection. Touch ID for secure authentication and Apple Pay, low-profile scissor mechanism, full-size layout with numeric keypad, USB-C charging, and seamless Mac integration.",
    category: "accessories",
    skuBase: "MAGKB",
    options: [{ title: "Color", values: ["Black", "White"] }],
    basePriceUsd: 29900,
    priceAdders: {},
    valueCodes: { Black: "BLK", White: "WHT" },
    i18n: {
      tr: { title: "Apple Magic Keyboard Touch ID", description: "Kablosuz klavye mükemmelliği. Touch ID ile güvenli kimlik doğrulama ve Apple Pay, düşük profilli makas mekanizması, tam boyut düzen, USB-C şarj ve sorunsuz Mac entegrasyonu." },
      de: { title: "Apple Magic Keyboard mit Touch ID", description: "Kabellose Tastatur-Perfektion. Touch ID für sichere Authentifizierung und Apple Pay, flaches Scherenmechanik-Design, volle Größe mit Ziffernblock, USB-C und Mac-Integration." },
      fr: { title: "Apple Magic Keyboard avec Touch ID", description: "Le clavier sans fil parfait. Touch ID pour l'authentification et Apple Pay, mécanisme ciseaux fin, disposition complète avec pavé numérique, USB-C et intégration Mac." },
      pl: { title: "Apple Magic Keyboard z Touch ID", description: "Perfekcja klawiatury bezprzewodowej. Touch ID do uwierzytelniania i Apple Pay, niskoprofilowy mechanizm nożycowy, pełny układ z blokiem numerycznym i ładowanie USB-C." },
      lt: { title: "Apple Magic Keyboard su Touch ID", description: "Belaidės klaviatūros tobulumas. Touch ID saugiam autentifikavimui ir Apple Pay, žemo profilio žirklinis mechanizmas, pilno dydžio išdėstymas ir USB-C įkrovimas." },
      et: { title: "Apple Magic Keyboard Touch ID-ga", description: "Juhtmevaba klaviatuuri täiuslikkus. Touch ID turvaliseks autentimiseks ja Apple Pay, madala profiiliga käärmehanism, täissuuruses paigutus ja USB-C laadimine." },
      lv: { title: "Apple Magic Keyboard ar Touch ID", description: "Bezvadu tastatūras pilnība. Touch ID drošai autentifikācijai un Apple Pay, zema profila šķēru mehānisms, pilna izmēra izkārtojums un USB-C uzlāde." },
    },
  },
  {
    title: "USB-C Hub 7-in-1",
    handle: "usb-c-hub-7-in-1",
    description: "Expand your connectivity. 4K HDMI output, 100W USB-C PD passthrough, 2x USB-A 3.0, SD and microSD card readers, and compact aluminum design. Compatible with MacBook, iPad Pro, and USB-C laptops.",
    category: "accessories",
    skuBase: "HUB7",
    options: [{ title: "Color", values: ["Space Gray", "Silver"] }],
    basePriceUsd: 3900,
    priceAdders: {},
    valueCodes: { "Space Gray": "GRY", Silver: "SLV" },
    i18n: {
      tr: { title: "USB-C Hub 7'si 1 Arada", description: "Bağlantılarınızı genişletin. 4K HDMI çıkışı, 100W USB-C PD geçişi, 2x USB-A 3.0, SD ve microSD kart okuyucu ve kompakt alüminyum tasarım." },
      de: { title: "USB-C Hub 7-in-1", description: "Erweitern Sie Ihre Konnektivität. 4K HDMI, 100W USB-C PD Passthrough, 2x USB-A 3.0, SD und microSD Kartenleser und kompaktes Aluminiumdesign." },
      fr: { title: "Hub USB-C 7-en-1", description: "Étendez vos connexions. Sortie HDMI 4K, USB-C PD 100W passthrough, 2x USB-A 3.0, lecteurs SD et microSD et design aluminium compact." },
      pl: { title: "Hub USB-C 7w1", description: "Rozszerz łączność. Wyjście HDMI 4K, 100W USB-C PD passthrough, 2x USB-A 3.0, czytniki kart SD i microSD i kompaktowy aluminiowy design." },
      lt: { title: "USB-C Hub 7-viename", description: "Išplėskite savo jungtis. 4K HDMI išvestis, 100W USB-C PD praleidimas, 2x USB-A 3.0, SD ir microSD kortelių skaitytuvai ir kompaktiškas aliuminio dizainas." },
      et: { title: "USB-C Hub 7-ühes", description: "Laiendage ühenduvust. 4K HDMI väljund, 100W USB-C PD läbipääs, 2x USB-A 3.0, SD ja microSD kaardilugejad ja kompaktne alumiiniumdisain." },
      lv: { title: "USB-C Hub 7-vienā", description: "Paplašiniet savienojamību. 4K HDMI izeja, 100W USB-C PD caurlaide, 2x USB-A 3.0, SD un microSD karšu lasītāji un kompakts alumīnija dizains." },
    },
  },
  {
    title: "Belkin BoostCharge Pro 3-in-1",
    handle: "belkin-boostcharge-pro",
    description: "All-in-one charging station. Official MFi MagSafe charger for iPhone (up to 15W), Apple Watch fast charging pad, and AirPods Qi2 charging spot. Sleek design with non-slip base and LED indicator.",
    category: "accessories",
    skuBase: "BELKIN3",
    options: [{ title: "Color", values: ["Black", "White"] }],
    basePriceUsd: 4900,
    priceAdders: {},
    valueCodes: { Black: "BLK", White: "WHT" },
    i18n: {
      tr: { title: "Belkin BoostCharge Pro 3'ü 1 Arada", description: "Hepsi bir arada şarj istasyonu. iPhone için resmi MFi MagSafe şarj (15W'a kadar), Apple Watch hızlı şarj ve AirPods Qi2 şarj noktası. LED göstergeli şık tasarım." },
      de: { title: "Belkin BoostCharge Pro 3-in-1", description: "All-in-One-Ladestation. Offizielles MFi MagSafe für iPhone (bis 15W), Apple Watch Schnellladepad und AirPods Qi2. Elegantes Design mit LED-Anzeige." },
      fr: { title: "Belkin BoostCharge Pro 3-en-1", description: "Station de charge tout-en-un. Chargeur MagSafe MFi officiel pour iPhone (15W), recharge rapide Apple Watch et Qi2 AirPods. Design élégant avec indicateur LED." },
      pl: { title: "Belkin BoostCharge Pro 3w1", description: "Stacja ładowania all-in-one. Oficjalna ładowarka MFi MagSafe do iPhone (do 15W), szybkie ładowanie Apple Watch i Qi2 AirPods. Elegancki design ze wskaźnikiem LED." },
      lt: { title: "Belkin BoostCharge Pro 3-viename", description: "Viskas viename įkrovimo stotis. Oficialus MFi MagSafe įkroviklis iPhone (iki 15W), Apple Watch greitas įkrovimas ir AirPods Qi2. Elegantiškas dizainas su LED." },
      et: { title: "Belkin BoostCharge Pro 3-ühes", description: "Kõik-ühes laadijaam. Ametlik MFi MagSafe laadija iPhone'ile (kuni 15W), Apple Watchi kiirlaadimine ja AirPodsi Qi2. Elegantne disain LED-indikaatoriga." },
      lv: { title: "Belkin BoostCharge Pro 3-vienā", description: "Viss-vienā uzlādes stacija. Oficiāls MFi MagSafe lādētājs iPhone (līdz 15W), Apple Watch ātrā uzlāde un AirPods Qi2. Elegants dizains ar LED indikatoru." },
    },
  },
];

// ── Main execution ───────────────────────────────────────────────────
const ALL_PRODUCTS = [
  ...SMARTPHONES,
  ...LAPTOPS,
  ...CAMERAS,
  ...AUDIO,
  ...WEARABLES,
  ...ACCESSORIES,
];

async function main() {
  console.log("\n🔌 ElectroStore Seed Script");
  console.log("══════════════════════════════════════\n");

  await authenticate();

  console.log("\n📦 Deleting existing products...");
  await deleteAllProducts();

  console.log(`\n🛒 Creating ${ALL_PRODUCTS.length} products...\n`);
  const built = ALL_PRODUCTS.map((p) => buildProduct(p));

  const totalVariants = built.reduce((sum, p) => sum + p.variants.length, 0);
  console.log(`   (${totalVariants} total variants across all products)\n`);

  let success = 0;
  for (let i = 0; i < built.length; i++) {
    const result = await createProduct(built[i], i, built.length);
    if (result) success++;
  }

  console.log(`\n══════════════════════════════════════`);
  console.log(`✅ Done! ${success}/${ALL_PRODUCTS.length} products created.\n`);
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
