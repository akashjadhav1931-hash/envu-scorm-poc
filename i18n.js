/**
 * i18n.js — Database-backed translation layer.
 *
 * Translations live in the `translations(key, lang, value)` table so they can be
 * edited without a code deploy. On boot we seed the table from SEED_TRANSLATIONS
 * (only inserting rows that don't already exist), then cache everything in memory
 * for fast lookups. Endpoints call `t(key, lang)` which falls back to English and
 * finally to the key itself if nothing is found.
 *
 * Key naming convention:
 *   course.<courseId>.title
 *   product.<productName>.description
 *   ai.instruction           (prompt language instruction)
 */

const SUPPORTED_LANGS = ['en', 'es'];
const DEFAULT_LANG = 'en';

function normalizeLang(raw) {
  if (!raw) return DEFAULT_LANG;
  const code = String(raw).toLowerCase().trim().split('-')[0];
  return SUPPORTED_LANGS.includes(code) ? code : DEFAULT_LANG;
}

// ─── Seed data ──────────────────────────────────────────────────────────────
// Source of truth used ONLY to populate an empty table. Once rows exist in the
// DB they win; editing the DB does not require touching this file.
const SEED_TRANSLATIONS = {
  // Course titles
  'course.genially-course-1.title': {
    en: 'K-Obiol & Actellic Protocol',
    es: 'Protocolo K-Obiol y Actellic',
  },
  'course.6ab28a2999831fbc0bd81f32_Progress_static_1_2.title': {
    en: 'Envu Onboarding e-learning',
    es: 'Formación de incorporación de Envu',
  },
  'course.6ab28a6e29c842f5b7c98bc5_Progress_static_1_2.title': {
    en: 'T&O Operational Protocols',
    es: 'Protocolos operativos de T&O',
  },

  // AI prompt language instruction
  'ai.instruction': {
    en: 'Write the "insect" and "threatLevel" fields in English.',
    es: 'Escribe los campos "insect" y "threatLevel" en español. Traduce el nombre de la plaga y la frase del nivel de amenaza al español.',
  },

  // Product descriptions (keyed by exact product_name)
  'product.Exteris® Stressgard 5l.description': {
    en: 'Fungicide for turf.',
    es: 'Fungicida para césped.',
  },
  'product.Fiata® Boost 1kg.description': {
    en: 'Fungicide for turf.',
    es: 'Fungicida para césped.',
  },
  'product.Signature® Xtra Stressgard 5kg.description': {
    en: 'Fungicide for turf.',
    es: 'Fungicida para césped.',
  },
  'product.Valdor® Expert.description': {
    en: 'Herbicide for weed control.',
    es: 'Herbicida para el control de malezas.',
  },
  'product.Aqua K-Othrine® 1l.description': {
    en: 'Deltamethrin with FFAST technology. Used for ULV and fogging in general pest management scenarios like flies, bedbugs, and crawling insects. NOT the primary mosquito product.',
    es: 'Deltametrina con tecnología FFAST. Se utiliza para ULV y nebulización en escenarios generales de control de plagas como moscas, chinches e insectos rastreros. NO es el producto principal para mosquitos.',
  },
  'product.AquaPy® 1l.description': {
    en: 'Fast-acting pyrethrin-based insect control for public health crawling pests.',
    es: 'Control de insectos de acción rápida a base de piretrina para plagas rastreras de salud pública.',
  },
  'product.DEDEVAP® Green.description': {
    en: 'Natural pyrethrins aerosol for grain storage facilities. Targets stored-product insects like grain beetles and weevils.',
    es: 'Aerosol de piretrinas naturales para instalaciones de almacenamiento de grano. Combate insectos de productos almacenados como gorgojos y escarabajos del grano.',
  },
  'product.Harmonix® Monitoring Paste 5kg.description': {
    en: 'Monitoring bait for detecting rats and mice activity in IPM strategies.',
    es: 'Cebo de monitoreo para detectar la actividad de ratas y ratones en estrategias de MIP.',
  },
  'product.Harmonix® Rodent Paste 5kg.description': {
    en: 'Cholecalciferol (Vitamin D3) based rodenticide for rats and mice control.',
    es: 'Rodenticida a base de colecalciferol (vitamina D3) para el control de ratas y ratones.',
  },
  'product.K-Obiol® EC25 1l.description': {
    en: 'Deltamethrin EC for stored grain protection against beetles, weevils, and stored-product insects.',
    es: 'Deltametrina EC para la protección del grano almacenado contra escarabajos, gorgojos e insectos de productos almacenados.',
  },
  'product.K-Obiol® ULV6 20L.description': {
    en: 'Pyrethrin-based ULV for knockdown of flying insects during grain storage space treatments.',
    es: 'ULV a base de piretrina para el derribo de insectos voladores durante tratamientos de espacios de almacenamiento de grano.',
  },
  'product.K-Othrine® Flow 25.description': {
    en: 'Deltamethrin suspension for cockroaches, ants, bedbugs, and crawling insects. Long residual control.',
    es: 'Suspensión de deltametrina para cucarachas, hormigas, chinches e insectos rastreros. Control residual prolongado.',
  },
  'product.K-Othrine® Partix 240ml.description': {
    en: 'Deltamethrin with Partix technology. Best for cockroaches on porous and complex surfaces.',
    es: 'Deltametrina con tecnología Partix. Ideal para cucarachas en superficies porosas y complejas.',
  },
  'product.K-Othrine® SC 7.5.description': {
    en: 'Broad-spectrum deltamethrin SC for cockroaches, flies, and general crawling/flying pest management.',
    es: 'Deltametrina SC de amplio espectro para cucarachas, moscas y control general de plagas rastreras/voladoras.',
  },
  'product.Maxforce® Platin 30g.description': {
    en: 'Clothianidin BlueBead gel bait specifically for cockroaches. Highly attractive bait matrix.',
    es: 'Cebo en gel BlueBead de clotianidina específico para cucarachas. Matriz de cebo muy atractiva.',
  },
  'product.Maxforce® Quantum 30g.description': {
    en: 'Carbohydrate liquid gel bait specifically formulated for ants. Hygroscopic technology ensures palatability.',
    es: 'Cebo en gel líquido de carbohidratos formulado específicamente para hormigas. La tecnología higroscópica garantiza su palatabilidad.',
  },
  'product.Maxforce® White IC.description': {
    en: 'Imidacloprid crack-and-crevice gel bait for cockroaches indoors.',
    es: 'Cebo en gel de imidacloprid para grietas y hendiduras, para cucarachas en interiores.',
  },
  'product.Racumin® Foam 500ml.description': {
    en: 'Non-bait rodenticide foam that kills rats and mice through grooming. Ideal where bait acceptance is low.',
    es: 'Espuma rodenticida sin cebo que elimina ratas y ratones mediante el acicalamiento. Ideal donde la aceptación del cebo es baja.',
  },
  'product.Rodilon® Block 3kg.description': {
    en: 'Difethialone moisture-resistant block bait for rat and mouse control in challenging environments.',
    es: 'Cebo en bloque resistente a la humedad de difetialona para el control de ratas y ratones en entornos exigentes.',
  },
  'product.Rodilon® Haver Mix 3kg.description': {
    en: 'Difethialone mixed grain bait for rodents with high bait acceptance.',
    es: 'Cebo de grano mixto de difetialona para roedores con alta aceptación del cebo.',
  },
  'product.Rodilon® Pasta 5kg.description': {
    en: 'Difethialone soft block for rats and mice across varied infestation scenarios.',
    es: 'Bloque blando de difetialona para ratas y ratones en diversos escenarios de infestación.',
  },
  'product.Rodilon® Wheat Tech 3kg.description': {
    en: 'Difethialone wheat-tech bait formulation for highly attractive rodent control.',
    es: 'Formulación de cebo wheat-tech de difetialona para un control de roedores muy atractivo.',
  },
  'product.Aqua K-Othrine® EW20 1l.description': {
    en: 'PRIMARY MOSQUITO PRODUCT. Deltamethrin EW20 with FFAST technology specifically designed for ULV thermal fogging to kill mosquitoes including Aedes, Anopheles, and Culex species. Use this for any mosquito identification.',
    es: 'PRODUCTO PRINCIPAL PARA MOSQUITOS. Deltametrina EW20 con tecnología FFAST diseñada específicamente para nebulización térmica ULV para eliminar mosquitos, incluidas las especies Aedes, Anopheles y Culex.',
  },
  'product.K-Othrine® WG250 2.5g.description': {
    en: 'Deltamethrin wettable granule for mosquito vector control in public hygiene. Secondary mosquito product.',
    es: 'Gránulo dispersable de deltametrina para el control de mosquitos vectores en higiene pública. Producto secundario para mosquitos.',
  },
};

// In-memory cache: { [lang]: { [key]: value } }
let cache = {};
let dbRef = null;

function now() {
  return new Date().toISOString();
}

/**
 * Seed the DB from SEED_TRANSLATIONS without overwriting existing rows, then
 * load the whole table into the in-memory cache.
 */
async function initI18n(db) {
  dbRef = db;

  for (const [key, byLang] of Object.entries(SEED_TRANSLATIONS)) {
    for (const [lang, value] of Object.entries(byLang)) {
      const existing = await db.get(
        'SELECT key FROM translations WHERE key = ? AND lang = ?',
        [key, lang]
      );
      if (!existing) {
        await db.run(
          'INSERT INTO translations (key, lang, value, updated_at) VALUES (?, ?, ?, ?)',
          [key, lang, value, now()]
        );
      }
    }
  }

  await reloadCache();
  console.log(`[i18n] Loaded translations for langs: ${Object.keys(cache).join(', ')}`);
}

/** Reload the in-memory cache from the DB. Call after any write. */
async function reloadCache() {
  const rows = await dbRef.all('SELECT key, lang, value FROM translations', []);
  const next = {};
  for (const r of rows) {
    if (!next[r.lang]) next[r.lang] = {};
    next[r.lang][r.key] = r.value;
  }
  cache = next;
}

/**
 * Translate a key. Resolution order: requested lang → English → the key itself.
 */
function t(key, rawLang) {
  const lang = normalizeLang(rawLang);
  return (
    (cache[lang] && cache[lang][key]) ??
    (cache[DEFAULT_LANG] && cache[DEFAULT_LANG][key]) ??
    key
  );
}

/** Upsert a single translation and refresh the cache. */
async function setTranslation(key, lang, value) {
  const normLang = normalizeLang(lang);
  const existing = await dbRef.get(
    'SELECT key FROM translations WHERE key = ? AND lang = ?',
    [key, normLang]
  );
  if (existing) {
    await dbRef.run(
      'UPDATE translations SET value = ?, updated_at = ? WHERE key = ? AND lang = ?',
      [value, now(), key, normLang]
    );
  } else {
    await dbRef.run(
      'INSERT INTO translations (key, lang, value, updated_at) VALUES (?, ?, ?, ?)',
      [key, normLang, value, now()]
    );
  }
  await reloadCache();
}

/** List all translations (optionally filtered by lang). */
async function listTranslations(rawLang) {
  if (rawLang) {
    return dbRef.all(
      'SELECT key, lang, value, updated_at FROM translations WHERE lang = ? ORDER BY key',
      [normalizeLang(rawLang)]
    );
  }
  return dbRef.all(
    'SELECT key, lang, value, updated_at FROM translations ORDER BY key, lang',
    []
  );
}

module.exports = {
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  normalizeLang,
  initI18n,
  reloadCache,
  t,
  setTranslation,
  listTranslations,
};
