// Thinkovr PDF Generator v3 — strongly differentiated tier templates
// Each tier has a distinct visual identity, decorative motifs, and layout patterns.

const PDFDocument = require('pdfkit').default || require('pdfkit')

const palettes = {
  spark: {
    bg: '#0e0e10', ink: '#e8e0d0', gold: '#c9a84c', dim: '#8a7535', accent: '#c9a84c',
    glow: '#e5c968', sigil: 'I', label: 'SPARK \u2014 THE DICTATUM', sub: 'Entry Tier \u2014 The Gold Edition',
    titleFont: 'Times-Bold', bodyFont: 'Times-Roman', monoFont: 'Helvetica',
  },
  ignite: {
    bg: '#0a0c12', ink: '#ead9b8', gold: '#d4a047', dim: '#8a6a2c', accent: '#b87333',
    glow: '#e3b86a', sigil: 'II', label: 'IGNITE \u2014 SPRINT BLUEPRINT', sub: 'Sprint Tier \u2014 The Copper Edition',
    titleFont: 'Times-Bold', bodyFont: 'Times-Roman', monoFont: 'Helvetica-Bold',
  },
  blaze: {
    bg: '#0f090b', ink: '#f2dfc3', gold: '#e3b44f', dim: '#8e5a33', accent: '#a8321f',
    glow: '#e36e4f', sigil: 'III', label: 'BLAZE \u2014 4-WEEK DOSSIER', sub: 'Sprint Dossier \u2014 The Burgundy Edition',
    titleFont: 'Times-Bold', bodyFont: 'Times-Roman', monoFont: 'Helvetica-Bold',
  },
  blueprint_only: {
    bg: '#080c14', ink: '#f4e8cf', gold: '#e5c968', dim: '#9a7d45', accent: '#3a6ea5',
    glow: '#7ba8d1', sigil: 'IV', label: 'THINKOVR BLUEPRINT \u2014 SIGNATURE EDITION', sub: 'Signature Series \u2014 The Sovereign Blueprint',
    titleFont: 'Times-Bold', bodyFont: 'Times-Roman', monoFont: 'Helvetica-Bold',
  },
}

function parseBlocks(md) {
  const lines = (md || '').split(/\r?\n/)
  const blocks = []
  let para = []
  const flushPara = () => { if (para.length) { blocks.push({ type: 'p', text: para.join(' ') }); para = [] } }
  for (const raw of lines) {
    const line = raw.replace(/\r/g, '')
    if (!line.trim()) { flushPara(); continue }
    if (/^#\s+/.test(line)) { flushPara(); blocks.push({ type: 'h1', text: line.replace(/^#\s+/, '').trim() }); continue }
    if (/^##\s+/.test(line)) { flushPara(); blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '').trim() }); continue }
    if (/^###\s+/.test(line)) { flushPara(); blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '').trim() }); continue }
    if (/^\s*[-*]\s+/.test(line)) { flushPara(); blocks.push({ type: 'li', text: line.replace(/^\s*[-*]\s+/, '').trim() }); continue }
    para.push(line.trim())
  }
  flushPara()
  return blocks
}

function stripInline(s) {
  return (s || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1')
}

// ─────────────────────── TIER-SPECIFIC FRAMES ───────────────────────
function frameSpark(doc, pal, w, h) {
  // Single thin gold line at top + bottom only
  const m = 36
  doc.save().strokeColor(pal.gold).lineWidth(0.5)
    .moveTo(m, m).lineTo(w - m, m).stroke()
    .moveTo(m, h - m).lineTo(w - m, h - m).stroke()
    .restore()
}

function frameIgnite(doc, pal, w, h) {
  // Double border + corner brackets
  const m = 32
  doc.save().strokeColor(pal.gold).lineWidth(0.8).rect(m, m, w - 2 * m, h - 2 * m).stroke()
  doc.strokeColor(pal.accent).lineWidth(0.4).rect(m + 5, m + 5, w - 2 * m - 10, h - 2 * m - 10).stroke()
  // Corner brackets
  const b = 20
  ;[[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, dx, dy]) => {
    doc.strokeColor(pal.gold).lineWidth(2)
      .moveTo(x + 6 * dx, y).lineTo(x + (b + 6) * dx, y).stroke()
      .moveTo(x, y + 6 * dy).lineTo(x, y + (b + 6) * dy).stroke()
  })
  doc.restore()
}

function frameBlaze(doc, pal, w, h) {
  // Ornate frame with diamond corners + side ornaments
  const m = 30
  doc.save().strokeColor(pal.gold).lineWidth(1).rect(m, m, w - 2 * m, h - 2 * m).stroke()
  doc.strokeColor(pal.accent).lineWidth(0.4).rect(m + 6, m + 6, w - 2 * m - 12, h - 2 * m - 12).stroke()
  // Diamond corners
  ;[[m, m], [w - m, m], [m, h - m], [w - m, h - m]].forEach(([x, y]) => {
    doc.fillColor(pal.gold).save().translate(x, y).rotate(45).rect(-6, -6, 12, 12).fill().restore()
    doc.fillColor(pal.accent).save().translate(x, y).rotate(45).rect(-3, -3, 6, 6).fill().restore()
  })
  // Side flame motifs (small triangles)
  const cx = w / 2
  doc.fillColor(pal.gold)
    .moveTo(cx - 8, m).lineTo(cx, m - 5).lineTo(cx + 8, m).closePath().fill()
    .moveTo(cx - 8, h - m).lineTo(cx, h - m + 5).lineTo(cx + 8, h - m).closePath().fill()
  doc.restore()
}

function frameBlueprint(doc, pal, w, h) {
  // Triple frame + ornamental corners + edge medallions
  const m = 28
  doc.save()
  doc.strokeColor(pal.gold).lineWidth(1.2).rect(m, m, w - 2 * m, h - 2 * m).stroke()
  doc.strokeColor(pal.dim).lineWidth(0.5).rect(m + 5, m + 5, w - 2 * m - 10, h - 2 * m - 10).stroke()
  doc.strokeColor(pal.accent).lineWidth(0.3).rect(m + 9, m + 9, w - 2 * m - 18, h - 2 * m - 18).stroke()
  // Corner medallions (concentric circles)
  ;[[m, m], [w - m, m], [m, h - m], [w - m, h - m]].forEach(([x, y]) => {
    doc.strokeColor(pal.gold).lineWidth(0.8).circle(x, y, 7).stroke()
    doc.fillColor(pal.gold).circle(x, y, 2.5).fill()
    doc.strokeColor(pal.accent).lineWidth(0.5).circle(x, y, 11).stroke()
  })
  // Top + bottom center medallions
  ;[[w / 2, m], [w / 2, h - m]].forEach(([x, y]) => {
    doc.strokeColor(pal.gold).lineWidth(0.6).circle(x, y, 4).stroke()
    doc.fillColor(pal.gold).circle(x, y, 1.3).fill()
  })
  // Side medallions
  ;[[m, h / 2], [w - m, h / 2]].forEach(([x, y]) => {
    doc.strokeColor(pal.gold).lineWidth(0.6).circle(x, y, 4).stroke()
    doc.fillColor(pal.gold).circle(x, y, 1.3).fill()
  })
  doc.restore()
}

function drawFrame(doc, pal, w, h) {
  if (pal.label.startsWith('SPARK')) frameSpark(doc, pal, w, h)
  else if (pal.label.startsWith('IGNITE')) frameIgnite(doc, pal, w, h)
  else if (pal.label.startsWith('BLAZE')) frameBlaze(doc, pal, w, h)
  else frameBlueprint(doc, pal, w, h)
}

// ─────────────────────── COVER PAGES ───────────────────────
function drawCoverSpark(doc, pal, wish, user, tier) {
  const { width, height } = doc.page
  // Centered minimal
  doc.font(pal.titleFont).fontSize(60).fillColor(pal.gold).text(pal.sigil, 0, 150, { align: 'center', width })
  doc.font('Helvetica-Bold').fontSize(10).fillColor(pal.dim).text(pal.label, 0, 230, { align: 'center', width, characterSpacing: 5 })
  // Thin divider
  doc.save().strokeColor(pal.gold).lineWidth(0.5).moveTo(width / 2 - 60, 270).lineTo(width / 2 + 60, 270).stroke().restore()
  doc.font('Times-Roman').fontSize(46).fillColor(pal.ink).text('The Dictatum', 0, 300, { align: 'center', width })
  doc.font('Times-Italic').fontSize(13).fillColor(pal.gold).text('One directive. Logically derived. Yours to execute.', 0, 360, { align: 'center', width })
  // Plain user info
  drawUserBlock(doc, pal, wish, user, tier, height - 200)
}

function drawCoverIgnite(doc, pal, wish, user, tier) {
  const { width, height } = doc.page
  // Background hatch pattern (subtle diagonal lines)
  doc.save().strokeColor(pal.dim).lineWidth(0.2).opacity(0.4)
  for (let i = -height; i < width + height; i += 25) {
    doc.moveTo(i, 0).lineTo(i + height, height).stroke()
  }
  doc.opacity(1).restore()
  // Sigil with copper underglow circle
  doc.save().fillColor(pal.accent).opacity(0.18).circle(width / 2, 200, 90).fill().restore()
  doc.font(pal.titleFont).fontSize(72).fillColor(pal.glow).text(pal.sigil, 0, 165, { align: 'center', width })
  // Label with brackets
  doc.font('Helvetica-Bold').fontSize(10).fillColor(pal.gold).text('\u2756  ' + pal.label + '  \u2756', 0, 270, { align: 'center', width, characterSpacing: 4 })
  // Title
  doc.font('Times-Bold').fontSize(48).fillColor(pal.ink).text('The Sprint', 0, 320, { align: 'center', width })
  doc.font('Times-Italic').fontSize(48).fillColor(pal.glow).text('Blueprint', 0, 365, { align: 'center', width })
  doc.font('Helvetica').fontSize(9).fillColor(pal.dim).text(pal.sub.toUpperCase(), 0, 425, { align: 'center', width, characterSpacing: 3 })
  // Decorative chevrons
  doc.save().fillColor(pal.glow)
  ;[width / 2 - 40, width / 2, width / 2 + 40].forEach((x, i) => {
    const opacity = [0.4, 0.8, 0.4][i]
    doc.opacity(opacity).moveTo(x - 6, 460).lineTo(x, 470).lineTo(x + 6, 460).closePath().fill()
  })
  doc.opacity(1).restore()
  drawUserBlock(doc, pal, wish, user, tier, height - 200)
}

function drawCoverBlaze(doc, pal, wish, user, tier) {
  const { width, height } = doc.page
  // Wax-seal / medallion at top center
  doc.save()
  doc.fillColor(pal.accent).opacity(0.25).circle(width / 2, 160, 70).fill()
  doc.opacity(1).strokeColor(pal.gold).lineWidth(2).circle(width / 2, 160, 60).stroke()
  doc.strokeColor(pal.gold).lineWidth(0.5).circle(width / 2, 160, 52).stroke()
  // 8-point star inside the seal
  const cx = width / 2, cy = 160
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4
    const x = cx + Math.cos(angle) * 45
    const y = cy + Math.sin(angle) * 45
    doc.moveTo(cx, cy).lineTo(x, y).stroke()
  }
  doc.fillColor(pal.gold).circle(cx, cy, 6).fill()
  doc.restore()
  // Title
  doc.font('Helvetica-Bold').fontSize(11).fillColor(pal.gold).text(pal.sigil + '  ' + pal.label + '  ' + pal.sigil, 0, 260, { align: 'center', width, characterSpacing: 4 })
  doc.font('Times-Bold').fontSize(54).fillColor(pal.ink).text('The Blaze', 0, 300, { align: 'center', width })
  doc.font('Times-Italic').fontSize(54).fillColor(pal.glow).text('Dossier', 0, 350, { align: 'center', width })
  // Decorative line with ornament
  const dy = 420
  doc.save().strokeColor(pal.gold).lineWidth(1)
    .moveTo(width / 2 - 100, dy).lineTo(width / 2 - 15, dy).stroke()
    .moveTo(width / 2 + 15, dy).lineTo(width / 2 + 100, dy).stroke()
  doc.fillColor(pal.gold).save().translate(width / 2, dy).rotate(45).rect(-5, -5, 10, 10).fill().restore()
  doc.restore()
  doc.font('Times-Italic').fontSize(13).fillColor(pal.dim).text('A four-week sprint. Five risks. One verdict.', 0, 445, { align: 'center', width })
  drawUserBlock(doc, pal, wish, user, tier, height - 200)
}

function drawCoverBlueprint(doc, pal, wish, user, tier) {
  const { width, height } = doc.page
  // Full-width gold band at top
  doc.save().fillColor(pal.gold).rect(0, 95, width, 1).fill().rect(0, 100, width, 0.5).fill()
  // Large ornamental emblem
  doc.fillColor(pal.accent).opacity(0.12).circle(width / 2, 220, 110).fill().opacity(1)
  doc.strokeColor(pal.gold).lineWidth(2.5).circle(width / 2, 220, 95).stroke()
  doc.strokeColor(pal.gold).lineWidth(0.6).circle(width / 2, 220, 88).stroke()
  doc.strokeColor(pal.dim).lineWidth(0.4).circle(width / 2, 220, 82).stroke()
  // Inner crown of dots
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8
    const x = width / 2 + Math.cos(angle) * 75
    const y = 220 + Math.sin(angle) * 75
    doc.fillColor(pal.gold).circle(x, y, 1.5).fill()
  }
  // IV sigil center
  doc.font(pal.titleFont).fontSize(46).fillColor(pal.gold).text(pal.sigil, 0, 200, { align: 'center', width })
  doc.restore()
  // Title block
  doc.font('Helvetica-Bold').fontSize(10).fillColor(pal.gold).text('\u2756  ' + pal.label + '  \u2756', 0, 360, { align: 'center', width, characterSpacing: 5 })
  doc.font('Times-Bold').fontSize(56).fillColor(pal.ink).text('The Sovereign', 0, 395, { align: 'center', width })
  doc.font('Times-Italic').fontSize(56).fillColor(pal.glow).text('Blueprint', 0, 450, { align: 'center', width })
  // Decorative quad
  const dy = 530
  doc.save().fillColor(pal.gold)
  ;[-30, -10, 10, 30].forEach(dx => doc.save().translate(width / 2 + dx, dy).rotate(45).rect(-3, -3, 6, 6).fill().restore())
  doc.restore()
  doc.font('Times-Italic').fontSize(12).fillColor(pal.dim).text('Strategy. Capital. Risk. Psychology. Exit.', 0, 555, { align: 'center', width })
  drawUserBlock(doc, pal, wish, user, tier, height - 220)
  // Footer band
  doc.save().fillColor(pal.gold).rect(0, height - 100, width, 0.5).fill().rect(0, height - 95, width, 1).fill().restore()
}

function drawUserBlock(doc, pal, wish, user, tier, blockY) {
  const { width } = doc.page
  const m = 60
  doc.save().strokeColor(pal.dim).lineWidth(0.3).rect(m + 30, blockY, width - 2 * m - 60, 130).stroke().restore()
  doc.font('Helvetica').fontSize(7).fillColor(pal.dim).text('PREPARED FOR', m + 50, blockY + 16, { characterSpacing: 3 })
  doc.font('Times-Bold').fontSize(13).fillColor(pal.ink).text(user?.email || 'Operator', m + 50, blockY + 30)
  doc.font('Helvetica').fontSize(7).fillColor(pal.dim).text('ISSUED', m + 50, blockY + 64, { characterSpacing: 3 })
  doc.font('Times-Roman').fontSize(11).fillColor(pal.ink).text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), m + 50, blockY + 78)
  doc.font('Helvetica').fontSize(7).fillColor(pal.dim).text('SERIAL', width - m - 180, blockY + 16, { characterSpacing: 3 })
  doc.font('Courier').fontSize(9).fillColor(pal.ink).text((wish?.id || '').slice(0, 18).toUpperCase(), width - m - 180, blockY + 30)
  doc.font('Helvetica').fontSize(7).fillColor(pal.dim).text('TIER', width - m - 180, blockY + 64, { characterSpacing: 3 })
  doc.font('Times-Bold').fontSize(12).fillColor(pal.gold).text((tier || 'spark').toUpperCase(), width - m - 180, blockY + 78)
}

function drawHeader(doc, pal, pageNum, totalPages) {
  const { width } = doc.page
  const m = 36
  doc.font('Helvetica-Bold').fontSize(7).fillColor(pal.dim)
    .text(pal.label, m + 8, m - 22, { align: 'left', width: width / 2, characterSpacing: 1.5 })
  doc.text(`${pal.sigil}  THINKOVR`, width - m - 150, m - 22, { align: 'right', width: 142, characterSpacing: 2 })
  // Footer
  const { height } = doc.page
  doc.font('Helvetica').fontSize(7).fillColor(pal.dim)
    .text(`PAGE ${String(pageNum).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, m, height - m + 10, { align: 'left', width: 100, characterSpacing: 1.5 })
  doc.text('THE THINKOVR ENGINE \u2014 EST. 2026', width - m - 280, height - m + 10, { align: 'right', width: 272, characterSpacing: 1.5 })
}

// ─────────────────────── CONTENT RENDERER ───────────────────────
function drawContent(doc, pal, blocks, startY) {
  const margin = 56
  const { width, height } = doc.page
  const usable = width - 2 * margin
  let y = startY
  const isHigh = pal.label.startsWith('BLUEPRINT') || pal.label.startsWith('THINKOVR') // signature tier
  const isMid = pal.label.startsWith('BLAZE')

  const ensure = (need) => { if (y + need > height - 60) { doc.addPage(); y = 80 } }

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    const text = stripInline(b.text)
    if (b.type === 'h2') {
      ensure(80)
      y += 14
      // Decorative bar above heading on higher tiers
      if (isHigh) {
        doc.save().fillColor(pal.gold).rect(margin, y - 6, 28, 2.5).fill().restore()
      } else if (isMid) {
        doc.save().fillColor(pal.gold).rect(margin, y - 4, 18, 1.5).fill().restore()
      }
      doc.font(pal.monoFont).fontSize(isHigh ? 11 : 10).fillColor(pal.gold)
        .text(text.toUpperCase(), margin, y, { width: usable, characterSpacing: isHigh ? 4 : 3 })
      y = doc.y + 6
      // Underline
      doc.save().strokeColor(pal.gold).lineWidth(isHigh ? 0.6 : 0.4)
        .moveTo(margin, y).lineTo(margin + (isHigh ? 90 : 60), y).stroke().restore()
      y += 12
    } else if (b.type === 'h3') {
      ensure(40)
      y += 6
      doc.font('Times-Bold').fontSize(13).fillColor(pal.ink)
        .text((isHigh ? '\u25C6 ' : '') + text, margin, y, { width: usable })
      y = doc.y + 6
    } else if (b.type === 'li') {
      ensure(20)
      const bulletColor = pal.gold
      doc.font('Helvetica-Bold').fontSize(10).fillColor(bulletColor)
        .text(isHigh ? '\u25CF' : (isMid ? '\u25C6' : '\u2022'), margin, y)
      doc.font('Times-Roman').fontSize(10.5).fillColor(pal.ink)
        .text(text, margin + 14, y, { width: usable - 14, lineGap: 2 })
      y = doc.y + 6
    } else {
      ensure(30)
      doc.font('Times-Roman').fontSize(10.5).fillColor(pal.ink)
        .text(text, margin, y, { width: usable, lineGap: 3, align: 'justify' })
      y = doc.y + 10
    }
  }
  return y
}

// ─────────────────────── CLOSING PAGE ───────────────────────
function drawClosing(doc, pal, tier) {
  doc.addPage()
  const { width, height } = doc.page
  const cx = width / 2

  if (pal.label.startsWith('BLUEPRINT') || pal.label.startsWith('THINKOVR')) {
    // Signature page for Blueprint tier
    doc.font('Helvetica-Bold').fontSize(9).fillColor(pal.gold)
      .text('\u2756  CERTIFICATION  \u2756', 0, height / 2 - 140, { align: 'center', width, characterSpacing: 5 })
    doc.font('Times-Italic').fontSize(15).fillColor(pal.ink)
      .text('"Strategy without execution is decoration.', 60, height / 2 - 90, { align: 'center', width: width - 120 })
    doc.text('Execution without strategy is exhaustion."', 60, height / 2 - 65, { align: 'center', width: width - 120 })
    // Seal
    doc.save().strokeColor(pal.gold).lineWidth(1.5).circle(cx, height / 2 + 20, 50).stroke()
    doc.strokeColor(pal.gold).lineWidth(0.4).circle(cx, height / 2 + 20, 44).stroke()
    doc.font('Helvetica-Bold').fontSize(8).fillColor(pal.gold).text('THE THINKOVR', 0, height / 2 + 5, { align: 'center', width, characterSpacing: 2 })
    doc.text('ENGINE', 0, height / 2 + 18, { align: 'center', width, characterSpacing: 4 })
    doc.font(pal.titleFont).fontSize(20).fillColor(pal.gold).text(pal.sigil, 0, height / 2 + 30, { align: 'center', width })
    doc.restore()
    // Signature line
    doc.save().strokeColor(pal.dim).lineWidth(0.5).moveTo(cx - 100, height / 2 + 110).lineTo(cx + 100, height / 2 + 110).stroke().restore()
    doc.font('Helvetica').fontSize(7).fillColor(pal.dim).text('REVIEWED BY THINKOVR', 0, height / 2 + 117, { align: 'center', width, characterSpacing: 3 })
  } else {
    // Other tiers: stark closing quote
    doc.font('Times-Italic').fontSize(15).fillColor(pal.ink)
      .text('"Decisions are the currency of outcomes.', 60, height / 2 - 60, { align: 'center', width: width - 120 })
    doc.text('Spend yours deliberately."', 60, height / 2 - 35, { align: 'center', width: width - 120 })
    doc.font('Helvetica-Bold').fontSize(9).fillColor(pal.gold)
      .text(pal.sigil + '  THE THINKOVR ENGINE', 0, height / 2 + 30, { align: 'center', width, characterSpacing: 4 })
    doc.font('Helvetica').fontSize(7).fillColor(pal.dim)
      .text('This directive is yours alone. Execute or abandon \u2014 on the date specified.', 60, height / 2 + 60, { align: 'center', width: width - 120 })
  }
}

// ─────────────────────── MAIN ENTRY ───────────────────────
async function generateBlueprintPDF({ wish, user, tier }) {
  const tierKey = (tier || 'spark').toLowerCase().replace(/[^a-z_]/g, '')
  const pal = palettes[tierKey] || palettes.spark

  const doc = new PDFDocument({ size: 'A4', margin: 60, autoFirstPage: false, bufferPages: true })
  // Paint background on every page (before content)
  doc.on('pageAdded', () => {
    const { width, height } = doc.page
    doc.save().rect(0, 0, width, height).fill(pal.bg).restore()
  })
  const chunks = []
  doc.on('data', c => chunks.push(c))
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  // Page 1: Cover (tier-specific)
  doc.addPage()
  if (tierKey === 'spark') drawCoverSpark(doc, pal, wish, user, tier || 'spark')
  else if (tierKey === 'ignite') drawCoverIgnite(doc, pal, wish, user, tier)
  else if (tierKey === 'blaze') drawCoverBlaze(doc, pal, wish, user, tier)
  else drawCoverBlueprint(doc, pal, wish, user, tier)

  // Page 2: Content opener
  doc.addPage()
  const margin = 56
  const w = doc.page.width
  // Wish opening
  doc.font('Helvetica-Bold').fontSize(8).fillColor(pal.gold).text("THE USER'S WISH \u2014 FILED", margin, 80, { characterSpacing: 3 })
  doc.font('Times-Italic').fontSize(12).fillColor(pal.ink).text('"' + (wish.user_prompt || '').slice(0, 420) + (wish.user_prompt?.length > 420 ? '\u2026"' : '"'), margin, 96, { width: w - 2 * margin, lineGap: 2 })
  const afterWish = doc.y + 18
  // Tier-specific separator below wish
  if (tierKey === 'blueprint_only' || tierKey === 'blaze') {
    doc.save().strokeColor(pal.gold).lineWidth(0.4).moveTo(margin, afterWish).lineTo(w - margin, afterWish).stroke()
    const cx = w / 2
    doc.fillColor(pal.gold).save().translate(cx, afterWish).rotate(45).rect(-3, -3, 6, 6).fill().restore()
    doc.restore()
  } else {
    doc.save().strokeColor(pal.dim).lineWidth(0.3).moveTo(margin, afterWish).lineTo(w - margin, afterWish).stroke().restore()
  }

  const blocks = parseBlocks(wish.groq_output || '')
  drawContent(doc, pal, blocks, afterWish + 18)
  drawClosing(doc, pal, tier)

  // Apply frame + header/footer to every page
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    drawFrame(doc, pal, doc.page.width, doc.page.height)
    drawHeader(doc, pal, i + 1, range.count)
  }

  doc.end()
  return await done
}

module.exports = { generateBlueprintPDF }
