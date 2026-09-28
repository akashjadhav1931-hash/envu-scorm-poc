const express = require('express');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'meta-llama/llama-4-scout'; // Free vision model on OpenRouter

// Full Envu Catalog for prompt context
const ENVU_CATALOG = JSON.stringify([
  { product_name: "Aqua K-Othrine® 1l", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin with FFAST technology, for mosquitoes, flies, and flying insects." },
  { product_name: "AquaPy® 1l", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Fast-acting insect control for public health pests." },
  { product_name: "DEDEVAP® Green", product_category: "Stored-Grain", product_segment: "Pest Management", description: "Natural pyrethrins aerosol for grain storage pests, beetles." },
  { product_name: "Harmonix® Monitoring Paste 5kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "For detecting rodent activity in IPM programs." },
  { product_name: "Harmonix® Rodent Paste 5kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Cholecalciferol (Vitamin D3) based bait for rats and mice." },
  { product_name: "K-Obiol® EC25 1l", product_category: "Stored-Grain", product_segment: "Pest Management", description: "Deltamethrin + piperonyl butoxide for stored grain beetles, weevils." },
  { product_name: "K-Obiol® ULV6 20L", product_category: "Stored-Grain", product_segment: "Pest Management", description: "Natural pyrethrins for space treatment in grain storage. For exposed flying insects." },
  { product_name: "K-Othrine® Flow 25", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin for cockroaches, ants, bedbugs, crawling insects. Provides months of residual control." },
  { product_name: "K-Othrine® Partix 240ml", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin with Partix technology for cockroaches and crawling pests on porous surfaces." },
  { product_name: "K-Othrine® SC 7.5", product_category: "General-Insect-Control", product_segment: "Pest Management", description: "Deltamethrin suspension for broad-spectrum crawling and flying insects." },
  { product_name: "Maxforce® Platin 30g", product_category: "Gel-Bait", product_segment: "Pest Management", description: "Clothianidin gel bait for cockroaches. BlueBead technology." },
  { product_name: "Maxforce® Quantum 30g", product_category: "Baits", product_segment: "Pest Management", description: "Liquid gel bait, highly attractive to ants. Carbohydrate-rich matrix." },
  { product_name: "Maxforce® White IC", product_category: "Gel-Bait", product_segment: "Pest Management", description: "Imidacloprid gel bait specifically for cockroach crack-and-crevice treatment." },
  { product_name: "Racumin® Foam 500ml", product_category: "Rodenticide", product_segment: "Pest Management", description: "Non-bait rodenticide foam leveraging grooming behavior of rats and mice." },
  { product_name: "Rodilon® Block 3kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone moisture-resistant bait block for rats and mice." },
  { product_name: "Rodilon® Haver Mix 3kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone mixed bait for rodents." },
  { product_name: "Rodilon® Pasta 5kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone soft block bait for rats and mice in varied infestations." },
  { product_name: "Rodilon® Wheat Tech 3kg", product_category: "Rodenticide", product_segment: "Pest Management", description: "Difethialone wheat-tech bait, highly attractive to rodents." },
  { product_name: "Aqua K-Othrine® EW20 1l", product_category: "Vector-Control", product_segment: "Mosquito Management", description: "Deltamethrin with FFAST technology for ULV fogging against mosquitoes." },
  { product_name: "K-Othrine® WG250 2.5g", product_category: "Vector-Control", product_segment: "Mosquito Management", description: "Deltamethrin wettable granule for flying and crawling insects in public health." },
]);

router.post('/identify-pest', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Missing image" });

    const prompt = `You are an expert Envu entomologist AI assistant. 
Your job is to identify the pest or insect in this image and recommend the most suitable Envu product.

ENVU PRODUCT CATALOG:
${ENVU_CATALOG}

Instructions:
1. Look at the image carefully and identify the pest/insect.
2. Match it to the best product from the catalog above.
3. Respond ONLY with a valid JSON object. No markdown, no code blocks, no extra text.
4. Use exactly this format:
{"insect":"Name of pest","confidence":"95%","threatLevel":"High/Medium/Low - one sentence description","product_name":"Exact product name from catalog","product_description":"Why this product is best for this pest in one sentence."}`;

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
