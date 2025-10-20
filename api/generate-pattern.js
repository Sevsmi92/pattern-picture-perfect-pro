// api/generate-pattern.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
const CM = 28.3464567
const toPt = (cm)=> cm*CM
const clamp = (v,a,b)=> Math.max(a, Math.min(b, v))

export default async function handler(req, res){
  try{
    const q = req.query || {}
    const gender = String(q.gender || 'female')
    const material = String(q.material || 'cotton')
    const color = String(q.color || '#888888')
    const schema = JSON.parse(Buffer.from(String(q.schema||''), 'base64').toString('utf-8') || '{}')
    const meas = JSON.parse(Buffer.from(String(q.measurements||''), 'base64').toString('utf-8') || '{}')

    const bust = Number(meas.bust || (gender==='female'?92:96))
    const waist = Number(meas.waist || 70)
    const hips = Number(meas.hips || 96)
    const torso = Number(meas.torso || 62)
    const leg = Number(meas.leg || 95)
    const neck = Number(meas.neck || 35)
    const shoulder = Number(meas.shoulder || 39)

    const ease = schema?.options?.ease || { bust:(gender==='female'?4:6), waist:3, hips:4 }
    const QB = 0.25*(bust + ease.bust)
    const QW = 0.25*(waist + ease.waist)
    const QH = 0.25*(hips + ease.hips)

    const pdf = await PDFDocument.create()
    const A0 = [2384, 3370]
    const page = pdf.addPage(A0)
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold)
    const drawText = (t,x,y,s=10,c=rgb(0.92,0.94,0.98),f=font)=> page.drawText(t,{x,y,size:s,color:c,font:f})
    const line = (x1,y1,x2,y2,w=1,c=rgb(0.7,0.78,0.95))=> page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},thickness:w,color:c})

    const ORIGIN={x:90,y:220}; const COL=(i)=>ORIGIN.x+i*560; const ROW=(j)=>ORIGIN.y+j*980

    drawText('Pattern Picture Perfect — Generated Pattern', ORIGIN.x, A0[1]-80, 18, rgb(0.96,0.97,0.99), fontB)
    drawText(`Material: ${material}  Color: ${color}`, ORIGIN.x, A0[1]-100)
    drawText(`Measurements (cm): bust ${bust}  waist ${waist}  hips ${hips}  torso ${torso}`, ORIGIN.x, A0[1]-118)

    const waistDown = torso
    const hipDown = torso + clamp(leg*0.12, 17, 22)
    const bustDown = clamp(torso*0.45, 22, 28)

    function bodice(x0,y0,label,isBack){
      const w = toPt(QB + (isBack?0:2))
      const h = toPt(hipDown)
      page.drawRectangle({ x:x0, y:y0-h, width:w, height:h, color:rgb(0.08,0.09,0.12), borderColor:rgb(0.6,0.7,0.9), borderWidth:1.0 })
      line(x0,y0,x0,y0-h,1.0) // center
      const armX = x0+w
      const bustY = y0 - toPt(bustDown)
      const waistY = y0 - toPt(waistDown)
      const hipY = y0 - toPt(hipDown)
      line(armX,bustY,armX,waistY,1.2)
      line(armX,waistY,armX - toPt(QB-QH), hipY,1.2)
      const dartBase = x0 + toPt(QB*(isBack?0.45:0.55))
      const dartAmt = toPt(clamp((bust-waist)*0.10,2,3.5)/2)
      line(dartBase-dartAmt,waistY,dartBase,waistY+toPt(isBack?10:9),0.9)
      line(dartBase+dartAmt,waistY,dartBase,waistY+toPt(isBack?10:9),0.9)
      drawText(label, x0, y0+16, 12, rgb(0.96,0.97,0.99), fontB)
      drawText('1 cm seam allowance', x0, y0+2)
    }
    bodice(COL(0), ROW(2), 'BODICE FRONT', false)
    bodice(COL(1), ROW(2), 'BODICE BACK', true)

    const skirtLen = clamp(leg*0.8, 70, 115)
    function skirt(x0,y0,label){
      const W = toPt(QH + 2)
      const H = toPt(skirtLen)
      page.drawRectangle({ x:x0, y:y0-H, width:W, height:H, color:rgb(0.08,0.09,0.12), borderColor:rgb(0.6,0.7,0.9), borderWidth:1.0 })
      line(x0+W/2, y0-H+toPt(4), x0+W/2, y0-toPt(4), 0.9) // grainline
      drawText(label, x0, y0+16, 12, rgb(0.96,0.97,0.99), fontB)
    }
    skirt(COL(0), ROW(1), 'SKIRT FRONT')
    skirt(COL(1), ROW(1), 'SKIRT BACK')

    const drapeW = toPt(shoulder*1.6)
    const drapeH = toPt(leg*0.7)
    page.drawRectangle({ x:COL(0), y:ROW(0)-drapeH, width:drapeW, height:drapeH, color:rgb(0.08,0.09,0.12), borderColor:rgb(0.6,0.7,0.9), borderWidth:1.0 })
    drawText('SHOULDER DRAPE — cut 2 (mirror)', COL(0), ROW(0)+16, 12, rgb(0.96,0.97,0.99), fontB)

    const sbx = COL(1); const sby = ROW(0)-toPt(12)
    page.drawRectangle({ x: sbx, y: sby, width: toPt(5), height: toPt(5), borderColor: rgb(0.9,0.92,0.98), borderWidth: 1.2 })
    drawText('Scale check: 5 cm', sbx + toPt(6), sby + toPt(2.2))

    const bytes = await pdf.save()
    res.setHeader('Content-Type','application/pdf')
    res.setHeader('Content-Disposition','attachment; filename="pattern.pdf"')
    res.status(200).send(Buffer.from(bytes))
  }catch(e){
    res.status(500).json({ ok:false, error:e?.message || 'failed'})
  }
}
