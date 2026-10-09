<!-- antislop:start -->
## Permanent Agent Instructions & Quality Standards

### 1. Mandatory Reading & Design System (Always Prioritize)
Before touching any UI, web code, or components:
- **`frontend/DESIGN.md`**: Wajib dibaca dan dipatuhi 100%. Gunakan Kumpul Design System tokens (Primary `#0D3B2E`, Primary Light `#EBF3EE`, Accent Harvest Amber `#B45309`, Circular Waste `#2D6A4F`, Surface `#FFFDF9`, Background `#FAF7F2`, Border `#E8E1D5`).
- **Tactile 3D Buttons & Modern Curves**: Terapkan kurva modern `rounded-xl` (14-18px) hingga `rounded-2xl` (20-24px). Tombol aksi wajib tactile dengan highlight bibir atas, bevel bawah, dan interaksi mikro responsif (hover/active). Dilarang sudut kotak kaku 0-4px.
- **Watermelon UI**: Seluruh komponen UI harus bersumber dari Watermelon UI (`https://ui.watermelon.sh/` atau MCP `watermelon-ui`) dan diselaraskan ke design token `DESIGN.md`. Dilarang membuat komponen primitif mentah sembarangan.

### 2. Antislop & Hygiene Skills
- Core filter, always on: `antislop`
- UI / visual: `antislop-ui`
- Copy & text: `antislop-copywriting`
- Mobile / responsive: `antislop-layoutmobile`
- Code comments: `antislop-code`
- People & Accessibility: `antislop-human` (WCAG AA compliant)
- UI Catalog: `watermelon-ui`
- Polish & Motion: `make-interfaces-feel-better`
Mode: Selalu terapkan antislop DURING the work. Jangan tanya user lagi.

### 3. Workflow & Memory Skills
- **`caveman`**: Komunikasi ringkas, padat, efisien, to-the-point, hilangkan token slop / filler basa-basi.
- **`ponytail`**: Clean & concise code, minimalkan technical debt, hindari over-engineering.
- **`graphify`**: Untuk mengingat memory & hubungan relasi arsitektur codebase, langsung baca knowledge graph di `graphify-out/` atau `frontend/graphify-out/` (`graph.json`). JANGAN membaca semua file source code secara boros!
<!-- antislop:end -->
