// api/render-garment.js
// Uses OpenAI Vision + Image generation for garment preview + description

export const config = {
  api: { bodyParser: false }, // required for FormData uploads
};

import { IncomingForm } from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  const form = new IncomingForm({ keepExtensions: true });
  form.parse(req, async (err, fields, files) => {
    try {
      if (err) throw err;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) throw new Error("Missing OPENAI_API_KEY");

      // read fields
      const gender = fields.gender?.[0] || "female";
      const skin = fields.skin?.[0] || "medium";
      const hairColor = fields.hairColor?.[0] || "brown";
      const hairStyle = fields.hairStyle?.[0] || "medium";
      const material = fields.material?.[0] || "cotton";
      const color = fields.color?.[0] || "#888888";
      const styleId = fields.styleId?.[0] || "reference-garment";
      const descriptionInput = fields.description?.[0] || "";

      // uploaded reference
      const file = files.reference?.[0];
      const filePath = file ? file.filepath : null;

      // 1. get a quick description if none supplied
      let description = descriptionInput;
      if (!description && filePath) {
        const imgBase64 = fs.readFileSync(filePath, { encoding: "base64" });
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      "Describe the garment in this image for a sewing and fashion context (color, neckline, sleeves, length, drape, fabric).",
                  },
                  {
                    type: "image_url",
                    image_url: `data:image/jpeg;base64,${imgBase64}`,
                  },
                ],
              },
            ],
          }),
        });
        const descData = await resp.json();
        description =
          descData?.choices?.[0]?.message?.content ||
          "Garment description unavailable.";
      }

      // 2. render new image based on description
      // Send the prompt to your local Stable Diffusion WebUI running on 127.0.0.1:7860
const prompt = `Full-body ${gender} mannequin with ${skin} skin, ${hairStyle} ${hairColor} hair, wearing ${material} garment in ${color}. ${description}. Studio lighting, dark background, soft digital illustration.`;

// Local WebUI API
const body = {
  prompt,
  negative_prompt: "blurry, distorted, cropped, low quality",
  steps: 20,
  width: 1024,
  height: 1024
};

const imgResp = await fetch("http://127.0.0.1:7860/sdapi/v1/txt2img", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

const imgData = await imgResp.json();
if (!imgResp.ok) throw new Error("Local render failed");

// WebUI returns base64 images
const base64 = imgData.images?.[0];
const previewUrl = base64 ? `data:image/png;base64,${base64}` : null;
      const patternSchema = {
        styleId,
        material,
        color,
        options: {
          neckline: "auto",
          hasDrape: true,
          ease: { bust: gender === "female" ? 4 : 6, waist: 3, hips: 4 },
        },
      };

      res.status(200).json({ ok: true, previewUrl, patternSchema, description });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ ok: false, error: e?.message || "Render/description failed" });
    }
  });
}
