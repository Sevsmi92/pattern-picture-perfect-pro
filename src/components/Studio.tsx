const [refFile, setRefFile] = useState<File|undefined>()
const [desc, setDesc] = useState<string>("")
import React, { useRef, useState } from 'react'
import { Measurements, StyleSchema } from '@/lib/types'

const skinTones = { veryfair:'#f8e0cf', light:'#edc9ae', medium:'#d2a483', tan:'#b07a56', dark:'#754d33' }
const materials = ['cotton','linen','silk','wool','denim','satin','polyester','leather'] as const

export default function Studio(){
  const [gender,setGender]=useState<'female'|'male'>('female')
  const [skin,setSkin]=useState<keyof typeof skinTones>('medium')
  const [hairColor,setHairColor]=useState('brown')
  const [hairStyle,setHairStyle]=useState<'short'|'medium'|'long'>('medium')
  const [material,setMaterial]=useState<string>('silk')
  const [fabricColor,setFabricColor]=useState('#ffffff')
  const [refUrl,setRefUrl]=useState<string|undefined>()
  const [preview,setPreview]=useState<string|undefined>()
  const [schema,setSchema]=useState<StyleSchema|undefined>()
  const [busy,setBusy]=useState(false)

  const [m,setM]=useState<Measurements>({ height:165, shoulder:39, bust:92, waist:70, hips:96, arm:58, leg:95, torso:62, neck:35, sleeveCirc:28 })
  const reset = ()=> setM({ height:165, shoulder:39, bust:92, waist:70, hips:96, arm:58, leg:95, torso:62, neck:35, sleeveCirc:28 })

  const fileRef = useRef<HTMLInputElement>(null)
  const onPick = ()=> fileRef.current?.click()
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const f = e.target.files?.[0]
  if (!f) return
  setRefFile(f)
  setRefUrl(URL.createObjectURL(f))
}

  const onRender = async () => {
  setBusy(true); setPreview(undefined)
  try {
    const fd = new FormData()
    fd.append("gender", gender)
    fd.append("skin", skin)
    fd.append("hairColor", hairColor)
    fd.append("hairStyle", hairStyle)
    fd.append("material", material)
    fd.append("color", fabricColor)
    fd.append("styleId", "reference-garment")
    fd.append("measurements", JSON.stringify(m))
    if (refFile) fd.append("reference", refFile)
    // optional: if user edited description, send it too
    if (desc.trim()) fd.append("description", desc.trim())

    const r = await fetch("/api/render-garment", { method:"POST", body: fd })
    const j = await r.json()
    if (j.previewUrl) setPreview(j.previewUrl)
    if (j.patternSchema) setSchema(j.patternSchema)
    if (j.description) setDesc(j.description) // show auto description
  } catch {
    alert("Render failed")
  } finally {
    setBusy(false)
  }
}

  const onDownload = () => {
    if (!schema) { alert('Render first, then download pattern.'); return }
    const qs = new URLSearchParams({
      gender,
      material, color: fabricColor,
      schema: btoa(unescape(encodeURIComponent(JSON.stringify(schema)))),
      measurements: btoa(unescape(encodeURIComponent(JSON.stringify(m))))
    }).toString()
    window.location.href = `/api/generate-pattern?${qs}`
  }

  const slider = (key: keyof Measurements, min:number, max:number) => (
    <div key={String(key)}>
      <label>{String(key)}: <strong>{Math.round(Number(m[key]||0))} cm</strong></label>
      <input type="range" min={min} max={max} value={Number(m[key]||0)} onChange={e=> setM(prev=>({...prev, [key]: Number(e.target.value)}))} />
    </div>
  )

  return (<div>
    <header><div className="container" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.8rem 0'}}><strong>Pattern Picture Perfect</strong><span className="small">Metric (cm)</span></div></header>
    <div className="container" style={{marginTop:'1rem'}}>
      <div className="grid grid-2">
        <div className="card">
          <h2>Your inputs</h2>
          <div className="row">
            <div><label>Gender</label><select value={gender} onChange={e=>setGender(e.target.value as any)}><option value="female">Female</option><option value="male">Male</option></select></div>
            <div><label>Skin tone</label><select value={skin} onChange={e=>setSkin(e.target.value as any)}>{Object.keys(skinTones).map(k=><option key={k} value={k}>{k}</option>)}</select></div>
          </div>
          <div className="row">
            <div><label>Hair style</label><select value={hairStyle} onChange={e=>setHairStyle(e.target.value as any)}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></div>
            <div><label>Hair color</label><select value={hairColor} onChange={e=>setHairColor(e.target.value)}><option value="blonde">Blonde</option><option value="brown">Brunette</option><option value="red">Red</option><option value="black">Black</option><option value="grey">Grey</option></select></div>
          </div>

          <h3 style={{marginTop:'.6rem'}}>Measurements (cm)</h3>
          {[
            ['height',140,200],['shoulder',32,50],['bust',70,120],['waist',55,110],['hips',75,130],
            ['arm',45,70],['leg',70,115],['torso',50,80],['neck',28,45],['sleeveCirc',20,40]
          ].map(([k,min,max])=> slider(k as keyof Measurements, min as number, max as number))}

          <h3 style={{marginTop:'.6rem'}}>Reference garment</h3>
          <div className="row">
            <div>
  <button onClick={onPick}>Upload reference photo</button>
  <input ref={fileRef} onChange={onFile} type="file" accept="image/*" hidden />
  {refUrl && (
    <div style={{ marginTop: '0.5rem' }}>
      <img src={refUrl} alt="Reference preview" style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #333' }} />
    </div>
  )}
</div>
            <div><label>Material</label><select value={material} onChange={e=>setMaterial(e.target.value)}>{materials.map(m=><option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <div className="row">
            <div><label>Colour</label><input type="color" value={fabricColor} onChange={e=>setFabricColor(e.target.value)} /></div>
            <div></div>
          </div>

          <div className="buttons" style={{marginTop:'.8rem'}}>
            <button className="primary" onClick={onRender} disabled={busy}>{busy?'Rendering…':'Generate Preview'}</button>
            <button onClick={onDownload} disabled={!schema}>Download Pattern PDF</button>
            <button onClick={reset}>Reset</button>
          </div>
          <p className="small" style={{marginTop:'.6rem'}}>The pattern is drafted from the same measurements and style you see in the preview.</p>
        </div>

        <div className="card" style={{minHeight:'70vh'}}>
  <h2>Preview</h2>
  {preview ? (
    <img className="thumb" src={preview} />
  ) : (
    <p className="small">Upload a reference and click Generate Preview.</p>
  )}

  <h3 style={{ marginTop: '.8rem' }}>Description</h3>
  <textarea
    value={desc}
    onChange={(e)=>setDesc(e.target.value)}
    placeholder="Auto description will appear here. Edit and click Regenerate."
    style={{
      width:'100%',
      minHeight:120,
      borderRadius:8,
      background:'#0f1018',
      color:'#e7e7ea',
      border:'1px solid #23243b',
      padding:8
    }}
  />
  <div className="buttons" style={{ marginTop: '.6rem' }}>
    <button onClick={onRender} disabled={busy}>
      {busy ? 'Regenerating…' : 'Regenerate from description'}
    </button>
  </div>
</div>
}
