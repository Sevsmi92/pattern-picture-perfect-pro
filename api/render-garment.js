// api/render-garment.js
// Uses OpenAI Images API to render a garment preview

export default async function handler(req, res) {
  try {
    const body = req.method === "POST" ? req.body : {};
    const {
      gender,
      skin,
      hairColor,
      hairStyle,
      material,
      color,
      measurements,
      styleId,
      reference,
    } = body || {};

    // Create prompt for the image model
    const prompt = `
      full-body front view fashion illustration of a ${gender} mannequin 
      with ${skin} skin tone, ${hairStyle} ${hairColor} hair,
      wearing a ${material} garment in ${color},
      based on a ${styleId || "reference"} style,
      on plain dark background, soft lighting, smooth digital illustration.
    `;

    // Call OpenAI Images API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });

    const data = await response.json();

    const previewUrl = data?.data?.[0]?.url || null;

    // Simple pattern schema
    const patternSchema = {
      styleId: styleId || "reference-garment",
      material: material || "cotton",
      color: color || "#888888",
      options: {
        neckline: "v",
        hasDrape: true,
        skirt: "long",
        ease: { bust: gender === "female" ? 4 : 6, waist: 3, hips: 4 },
      },
    };

    if (!previewUrl) throw new Error("Image generation failed");

    res.status(200).json({ ok: true, previewUrl, patternSchema });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message || "Render failed" });
  }
}
