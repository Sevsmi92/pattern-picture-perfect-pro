# Pattern Picture Perfect — Pro

Flow:
1) Enter measurements, set body features, upload a reference, choose fabric/colour.
2) **Generate Preview** → `/api/render-garment` returns an image URL + a pattern schema.
3) **Download Pattern PDF** → `/api/generate-pattern` uses the same schema+measurements to build a printable PDF (A0).

Local:
- `yarn install`
- `yarn dev` → http://localhost:8080

Deploy (Vercel):
- Framework: Vite
- Build: `yarn build`
- Output: `dist`
- Optional env var: `OPENAI_API_KEY` for real image renders. Without it, you get a placeholder preview.
