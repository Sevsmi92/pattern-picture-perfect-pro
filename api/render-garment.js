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
      // Generate image using gpt-4o-mini responses endpoint (works with most enterprise keys)
const imgResp = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${openaiKey}`,
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "output_image", size: "1024x1024" }
        ]
      }
    ]
  }),
});

const imgData = await imgResp.json();
console.log("Image API response:", imgData);

if (!imgResp.ok) {
  throw new Error(imgData?.error?.message || "Image generation failed");
}

const previewUrl = imgData.output?.[0]?.content?.[0]?.image_url || null;
const previewUrl = imgData?.data?.[0]?.url || null;

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
