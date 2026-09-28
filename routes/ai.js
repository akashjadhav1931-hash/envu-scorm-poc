const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// The API key MUST be injected via Environment Variables for security
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set!");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// Subset of Envu Catalog for the prompt context
const ENVU_CATALOG = `
{
  "products": [
    { "product_name": "Exteris® Stressgard 5l", "product_category": "Fungicide" },
    { "product_name": "Fiata® Boost 1kg", "product_category": "Biological" },
    { "product_name": "Signature® Xtra Stressgard 5kg", "product_category": "Fungicide" },
    { "product_name": "Valdor® Expert", "product_category": "Weed-killer" },
    { "product_name": "Aqua K-Othrine® 1l", "product_category": "General-Insect-Control", "description": "Good for flying insects like mosquitoes." },
    { "product_name": "Harmonix® Rodent Paste 5kg", "product_category": "Rodenticide", "description": "For rodent/mouse control." },
    { "product_name": "K-Obiol® EC25 1l", "product_category": "Stored-Grain", "description": "For stored product beetles and weevils." },
    { "product_name": "K-Othrine® Flow 25", "product_category": "General-Insect-Control" },
    { "product_name": "Maxforce® Platin 30g", "product_category": "Gel-Bait", "description": "Excellent for cockroach control." },
    { "product_name": "Maxforce® Quantum 30g", "product_category": "Baits", "description": "Excellent for ant control." },
    { "product_name": "Racumin® Foam 500ml", "product_category": "Rodenticide", "description": "For rats and mice." }
  ]
}
`;

router.post('/identify-pest', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Missing image" });

    // Using gemini-1.5-flash as it is extremely fast and capable of multimodal vision tasks
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert Envu entomologist. 
Identify the insect or pest in this image. If it is not a pest, say so.
Here is the Envu product catalog: ${ENVU_CATALOG}
Respond ONLY with a valid raw JSON object exactly matching this format:
{
  "insect": "Name of Insect/Pest",
  "confidence": "95%",
  "threatLevel": "High/Medium/Low - Description",
  "product_name": "Exact matching Envu Product Name from catalog",
  "product_description": "A short 1-sentence reason why this product is best."
}
Do not include markdown blocks like \`\`\`json. Return only raw JSON.`;

    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];

    console.log("Sending image to Gemini Vision API...");
    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().trim();
    console.log("Gemini Response:", responseText);
    
    // Clean up potential markdown blocks if Gemini disobeys the prompt instruction
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    res.json(data);
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze image" });
  }
});

module.exports = router;
