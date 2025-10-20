// api/render-garment.js
export default async function handler(req, res){
  try{
    const body = req.method==='POST' ? req.body : {}
    const { gender, skin, hairColor, hairStyle, material, color, measurements, styleId, reference } = body || {}
    const patternSchema = {
      styleId: styleId || 'reference-garment',
      material: material || 'cotton',
      color: color || '#888888',
      options: { neckline:'v', hasDrape:true, skirt:'long', ease:{ bust: gender==='female'?4:6, waist:3, hips:4 } }
    }
    // Placeholder preview until OPENAI_API_KEY is configured on Vercel
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
      <rect width='100%' height='100%' fill='#0b0b0f'/>
      <text x='50%' y='46%' fill='white' font-size='28' text-anchor='middle' font-family='sans-serif'>Preview placeholder</text>
      <text x='50%' y='54%' fill='${color||'#888'}' font-size='20' text-anchor='middle' font-family='sans-serif'>${material||'material'} — ${color||'#888'}</text>
    </svg>`
    const previewUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    res.status(200).json({ ok:true, previewUrl, patternSchema })
  }catch(e){
    res.status(500).json({ ok:false, error:e?.message || 'failed' })
  }
}
