/** Small, dependency-free OpenXML workbook exporter for browser reports. */

const encoder = new TextEncoder();
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const SS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const STYLE = Object.freeze({ title: 1, header: 2, green: 3, yellow: 4, red: 5, note: 6 });
const CRC_TABLE = new Uint32Array(256);

for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let bit = 0; bit < 8; bit += 1) c = (c >>> 1) ^ ((c & 1) ? 0xEDB88320 : 0);
  CRC_TABLE[n] = c >>> 0;
}

function xml(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function colName(index) {
  let result = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
  }
  return result;
}

function cellData(cell) {
  return cell !== null && typeof cell === 'object' && !Array.isArray(cell)
    ? { v: cell.v ?? '', style: cell.style }
    : { v: cell ?? '', style: undefined };
}

function textWidth(value) {
  return Math.max(0, ...String(value ?? '').split('\n').map(line =>
    Array.from(line).reduce((n, char) => n + (char.codePointAt(0) > 255 ? 2 : 1), 0)));
}

function worksheet(sheet) {
  const rows = sheet.rows.map(row => row.map(cellData));
  const count = rows.reduce((max, row) => Math.max(max, row.length), Math.max(1, sheet.widths?.length || 0));
  if (count > 16384 || rows.length > 1048576) throw new RangeError('工作表超出 Excel 的列數或欄數上限。');
  const widths = Array.from({ length: count }, (_, col) => {
    const width = Number(sheet.widths?.[col]);
    if (Number.isFinite(width) && width > 0) return Math.max(5, Math.min(100, width));
    const max = rows.reduce((value, row) => Math.max(value, row[col]?.style === 'title' ? 0 : textWidth(row[col]?.v)), 0);
    return Math.min(48, Math.max(col === 0 ? 22 : 18, max + 3));
  });
  const merges = [];
  const rowXML = rows.map((row, r) => {
    const title = row[0]?.style === 'title' && row.slice(1).every(cell => cell.v === '');
    if (title && count > 1) merges.push(`A${r + 1}:${colName(count - 1)}${r + 1}`);
    let height = row.some(cell => cell.style === 'title') ? 34
      : row.some(cell => cell.style === 'header') ? 28 : row.some(cell => cell.style === 'note') ? 32 : 24;
    for (let col = 0; col < row.length; col += 1) {
      const cell = row[col];
      const wrapWidth = title ? widths.reduce((a, b) => a + b, 0) : widths[col];
      const lines = String(cell.v).split('\n').reduce((total, line) =>
        total + Math.max(1, Math.ceil(textWidth(line) / Math.max(1, wrapWidth - 2))), 0);
      height = Math.min(150, Math.max(height, lines * 16 + 9));
    }
    const cells = row.map((cell, col) => {
      const numeric = typeof cell.v === 'number' && Number.isFinite(cell.v);
      const style = STYLE[cell.style] ?? (numeric ? 7 : 0);
      const ref = `${colName(col)}${r + 1}`;
      if (numeric) return `<c r="${ref}" s="${style}"><v>${cell.v}</v></c>`;
      const value = typeof cell.v === 'number' && !Number.isFinite(cell.v) ? '—' : cell.v;
      return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join('');
    return `<row r="${r + 1}" ht="${height}" customHeight="1">${cells}</row>`;
  }).join('');
  const headerRow = rows.findIndex(row => row.some(cell => cell.style === 'header'));
  const pane = headerRow >= 0
    ? `<pane ySplit="${headerRow + 1}" topLeftCell="A${headerRow + 2}" activePane="bottomLeft" state="frozen"/>` : '';
  return `${XML_HEAD}<worksheet xmlns="${SS}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${colName(count - 1)}${Math.max(1, rows.length)}"/>`
    + `<sheetViews><sheetView workbookViewId="0" showGridLines="0">${pane}</sheetView></sheetViews>`
    + '<sheetFormatPr defaultRowHeight="24"/>'
    + `<cols>${widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    + `<sheetData>${rowXML}</sheetData>`
    + (merges.length ? `<mergeCells count="${merges.length}">${merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : '')
    + '<printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>'
    + '<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>'
    + '</worksheet>';
}

function stylesXML() {
  const font = (size, color, bold = false) => `<font>${bold ? '<b/>' : ''}<sz val="${size}"/><color rgb="FF${color}"/><name val="Microsoft JhengHei"/><family val="2"/></font>`;
  const fill = color => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`;
  const xf = (fontId, fillId, numFmtId = 0) => `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"${numFmtId ? ' applyNumberFormat="1"' : ''}><alignment vertical="center" wrapText="1"/></xf>`;
  return `${XML_HEAD}<styleSheet xmlns="${SS}">`
    + '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.##########"/></numFmts>'
    + `<fonts count="7">${font(11, '173B50')}${font(19, '006F68', true)}${font(11, 'FFFFFF', true)}${font(11, '176A4D', true)}${font(11, '856000', true)}${font(11, 'AA2F3C', true)}${font(10, '617783')}</fonts>`
    + `<fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fill('E6F3F1')}${fill('173B50')}${fill('E5F3EB')}${fill('FFF3CD')}${fill('FBE7EB')}${fill('F0F4F6')}</fills>`
    + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="hair"><color rgb="FFDCE7E9"/></bottom><diagonal/></border></borders>'
    + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + `<cellXfs count="8">${xf(0, 0)}${xf(1, 2)}${xf(2, 3)}${xf(3, 4)}${xf(4, 5)}${xf(5, 6)}${xf(6, 7)}${xf(0, 0, 164)}</cellXfs>`
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/>'
    + '</styleSheet>';
}

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 255];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function zip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  let centralSize = 0;
  const now = new Date();
  const year = Math.max(1980, Math.min(2107, now.getFullYear()));
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const [path, content] of files) {
    const name = encoder.encode(path);
    const data = encoder.encode(content);
    if (data.length > 0xFFFFFFFF || offset + data.length + name.length + 30 > 0xFFFFFFFF) {
      throw new RangeError('下載內容過大，請減少資料筆數。');
    }
    const checksum = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034B50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
    lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true); lv.setUint32(14, checksum, true);
    lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local, data);
    const entry = new Uint8Array(46 + name.length);
    const cv = new DataView(entry.buffer);
    cv.setUint32(0, 0x02014B50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true); cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true);
    cv.setUint32(16, checksum, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true);
    entry.set(name, 46);
    central.push(entry); centralSize += entry.length; offset += local.length + data.length;
  }
  if (files.length > 65535 || centralSize + offset > 0xFFFFFFFF) throw new RangeError('下載內容過大。');
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054B50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = String(filename || 'report').replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return blob;
}

/**
 * Download a real .xlsx workbook. Text values, including leading '=', remain text.
 * @param {string} filename File name, with or without the .xlsx extension.
 * @param {Array<{name:string, rows:Array<Array<string|number|{v:string|number,style?:string}>>, widths?:number[]}>} sheets
 * @returns {Blob} The workbook Blob, also useful for previews or automated validation.
 */
export function downloadWorkbook(filename, sheets) {
  if (!Array.isArray(sheets) || !sheets.length) throw new TypeError('請提供至少一張工作表。');
  if (sheets.length > 1000) throw new RangeError('工作表數量過多。');
  const usedNames = new Set();
  const normalized = sheets.map((sheet, i) => {
    if (!sheet || !Array.isArray(sheet.rows) || sheet.rows.some(row => !Array.isArray(row))) {
      throw new TypeError(`第 ${i + 1} 張工作表的 rows 必須為二維陣列。`);
    }
    let base = String(sheet.name || `工作表${i + 1}`).replace(/[\\/?*\[\]:\u0000-\u001F]/g, ' ').trim().replace(/^'+|'+$/g, '').trim().slice(0, 31) || `工作表${i + 1}`;
    if (base.toLowerCase() === 'history') base = 'History_';
    let name = base;
    for (let suffix = 2; usedNames.has(name.toLowerCase()); suffix += 1) {
      const tail = ` (${suffix})`;
      name = base.slice(0, 31 - tail.length) + tail;
    }
    usedNames.add(name.toLowerCase());
    return { ...sheet, name };
  });
  const files = [
    ['[Content_Types].xml', `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${normalized.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `${XML_HEAD}<workbook xmlns="${SS}" xmlns:r="${REL}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${normalized.map((sheet, i) => `<sheet name="${xml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${normalized.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${normalized.length + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', stylesXML()],
    ...normalized.map((sheet, i) => [`xl/worksheets/sheet${i + 1}.xml`, worksheet(sheet)])
  ];
  const name = /\.xlsx$/i.test(String(filename || '')) ? String(filename) : `${filename || '企業資金規劃報告'}.xlsx`;
  return downloadBlob(name, zip(files));
}

/** Download a UTF-8 text file (with BOM for Windows text editors). */
export function downloadText(filename, text) {
  return downloadBlob(filename || 'report.txt', new Blob(['\uFEFF', String(text ?? '')], { type: 'text/plain;charset=utf-8' }));
}
