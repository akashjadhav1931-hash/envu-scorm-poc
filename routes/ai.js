const express = require('express');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'meta-llama/llama-4-scout'; // Free vision model on OpenRouter

// Full Envu Catalog for prompt context
// IMPORTANT: product_segment is the PRIMARY matching key - always prefer it
const ENVU_CATALOG = JSON.stringify([
  { product_name: "Exteris® Stressgard 5l", product_category: "Turf", product_segment: "Disease Management", description: "Fungicide for turf.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/exteris-stressgard-5l-nl.ashx?h=auto&w=800" },
  { product_name: "Fiata® Boost 1kg", product_category: "Turf", product_segment: "Disease Management", description: "Fungicide for turf.", product_img: "https://www.assets.envu.com/-/media/product-images/emea-latam-documents/label-uk-25/fiata-square.ashx?h=auto&w=800" },
  { product_name: "Signature® Xtra Stressgard 5kg", product_category: "Turf", product_segment: "Disease Management", description: "Fungicide for turf.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/260812_envu_signaturextrastressgard_5l_blx_800px.ashx?h=auto&w=800" },
  { product_name: "Valdor® Expert", product_category: "Vegetation-Management", product_segment: "Weed Control", description: "Herbicide for weed control.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/blx/valdor-expert-be.ashx?h=auto&w=800" },
  { product_name: "Aqua K-Othrine® 1l", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin with FFAST technology. Used for ULV and fogging in general pest management scenarios like flies, bedbugs, and crawling insects. NOT the primary mosquito product.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/aqua-k-othrine-1l-fr.ashx?h=auto&w=800" },
  { product_name: "AquaPy® 1l", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Fast-acting pyrethrin-based insect control for public health crawling pests.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-transitoires/white/image-k-obiol-ce-25-pb/aquapy.ashx?h=auto&w=800" },
  { product_name: "DEDEVAP® Green", product_category: "Stored-Grain", product_segment: "Pest Management", description: "Natural pyrethrins aerosol for grain storage facilities. Targets stored-product insects like grain beetles and weevils.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/blx/dedevap-green_blx.ashx?h=auto&w=800" },
  { product_name: "Harmonix® Monitoring Paste 5kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Monitoring bait for detecting rats and mice activity in IPM strategies.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/harmonix-monitoring.ashx?h=auto&w=800" },
  { product_name: "Harmonix® Rodent Paste 5kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Cholecalciferol (Vitamin D3) based rodenticide for rats and mice control.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/250904_envu_harmonixrodentpaste_kba_packshot_5kg_nl.ashx?h=auto&w=800" },
  { product_name: "K-Obiol® EC25 1l", product_category: "Stored-Grain", product_segment: "Pest Management", description: "Deltamethrin EC for stored grain protection against beetles, weevils, and stored-product insects.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/k-obiol-ec25_be.ashx?h=auto&w=800" },
  { product_name: "K-Obiol® ULV6 20L", product_category: "Stored-Grain", product_segment: "Pest Management", description: "Pyrethrin-based ULV for knockdown of flying insects during grain storage space treatments.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/blx/kobiol-ulv6-nl-20l.ashx?h=auto&w=800" },
  { product_name: "K-Othrine® Flow 25", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin suspension for cockroaches, ants, bedbugs, and crawling insects. Long residual control.", product_img: "" },
  { product_name: "K-Othrine® Partix 240ml", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin with Partix technology. Best for cockroaches on porous and complex surfaces.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/k-othrine-partix-be.ashx?h=auto&w=800" },
  { product_name: "K-Othrine® SC 7.5", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Broad-spectrum deltamethrin SC for cockroaches, flies, and general crawling/flying pest management.", product_img: "" },
  { product_name: "Maxforce® Platin 30g", product_category: "Gel-Bait", product_segment: "Pest Management", description: "Clothianidin BlueBead gel bait specifically for cockroaches. Highly attractive bait matrix.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/blx/maxforce-platin_blx.ashx?h=auto&w=800" },
  { product_name: "Maxforce® Quantum 30g", product_category: "Baits", product_segment: "Pest Management", description: "Carbohydrate liquid gel bait specifically formulated for ants. Hygroscopic technology ensures palatability.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/blx/maxforce-quantum_blx.ashx?h=auto&w=800" },
  { product_name: "Maxforce® White IC", product_category: "Gel-Bait", product_segment: "Pest Management", description: "Imidacloprid crack-and-crevice gel bait for cockroaches indoors.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/blx/maxforce-white-ic_blx.ashx?h=auto&w=800" },
  { product_name: "Racumin® Foam 500ml", product_category: "Rodenticide", product_segment: "Pest Management", description: "Non-bait rodenticide foam that kills rats and mice through grooming. Ideal where bait acceptance is low.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/packshots-envu/white/racumin-foam-belgium/racumin-foam.ashx?h=auto&w=800" },
  { product_name: "Rodilon® Block 3kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone moisture-resistant block bait for rat and mouse control in challenging environments.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/rodilon-blocks_blx.ashx?h=auto&w=800" },
  { product_name: "Rodilon® Haver Mix 3kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone mixed grain bait for rodents with high bait acceptance.", product_img: "" },
  { product_name: "Rodilon® Pasta 5kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone soft block for rats and mice across varied infestation scenarios.", product_img: "" },
  { product_name: "Rodilon® Wheat Tech 3kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone wheat-tech bait formulation for highly attractive rodent control.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/rodilon-wheat-tech_blx.ashx?h=auto&w=800" },
  { product_name: "Aqua K-Othrine® EW20 1l", product_category: "Vector-Control", product_segment: "Mosquito Management", description: "PRIMARY MOSQUITO PRODUCT. Deltamethrin EW20 with FFAST technology specifically designed for ULV thermal fogging to kill mosquitoes including Aedes, Anopheles, and Culex species. Use this for any mosquito identification.", product_img: "https://www.assets.envu.com/-/media/prfbenelux/benelux-frontpage/packshots/aqua-k-othrine-1l-fr.ashx?h=auto&w=800" },
  { product_name: "K-Othrine® WG250 2.5g", product_category: "Vector-Control", product_segment: "Mosquito Management", description: "Deltamethrin wettable granule for mosquito vector control in public hygiene. Secondary mosquito product.", product_img: "" },
]);

router.post('/identify-pest', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Missing image" });

    const prompt = `You are an expert ENVU entomologist AI assistant. 
Your job is to identify the pest or insect in this image and recommend the most suitable ENVU product.

ENVU PRODUCT CATALOG:
${ENVU_CATALOG}

STRICT MATCHING RULES:
1. Identify the pest type: mosquito/fly = "Mosquito Management" segment; cockroach/ant/bedbug/crawling insect = "General-Insect-Control"; rat/mouse/rodent = "Rodenticide"; grain beetle/weevil = "Stored-Grain".
2. ALWAYS match the product_segment FIRST before anything else.
3. If the pest is ANY mosquito species (Aedes, Anopheles, Culex, etc.) you MUST pick a product from product_segment="Mosquito Management". Never pick a Pest Management product for mosquitoes.
4. If a product description says "PRIMARY" for that pest type, always choose it.
5. Respond ONLY with a valid JSON object. No markdown, no extra text.
6. Use exactly this format:
{"insect":"Name of pest","confidence":"95%","threatLevel":"High/Medium/Low - one sentence description","product_name":"Exact product name from catalog","product_category":"Category from catalog","product_segment":"Segment from catalog","product_description":"Exact description from catalog (Do not change or summarize it)","product_img":"Exact product_img from catalog"}`;

    console.log("[AI] Sending image to OpenRouter Vision...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://envu-poc.com",
        "X-Title": "Envu Pest Identifier"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }]
      })
    });

    const aiData = await response.json();
    console.log("[AI] Raw response:", JSON.stringify(aiData));

    if (!response.ok) {
      throw new Error(aiData.error?.message || 'OpenRouter API error');
    }

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('No response from AI model');

    // Clean up any markdown wrapping just in case
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    res.json(parsed);
  } catch (error) {
    console.error("[AI Error]", error);
    res.status(500).json({ error: error.message || "Failed to analyze image" });
  }
});

module.exports = router;
