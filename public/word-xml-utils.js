function decodeXmlEntities(text) {
  if (!text || !text.includes('&')) return text;

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractReferenceMarker(token) {
  const footnoteMatch = token.match(/<w:footnoteReference\b[^>]*w:id="(\d+)"/);
  if (footnoteMatch) return `[${footnoteMatch[1]}]`;

  const endnoteMatch = token.match(/<w:endnoteReference\b[^>]*w:id="(\d+)"/);
  if (endnoteMatch) return `[${endnoteMatch[1]}]`;

  return '';
}

function extractRunText(runContent) {
  let text = '';
  const tokenRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<w:footnoteReference\b[^>]*\/>|<w:endnoteReference\b[^>]*\/>/g;
  let match;

  while ((match = tokenRegex.exec(runContent)) !== null) {
    if (match[1] !== undefined) {
      text += decodeXmlEntities(match[1]);
    } else if (match[0].includes('w:tab')) {
      text += ' ';
    } else if (match[0].includes('w:br')) {
      text += '\n';
    } else {
      text += extractReferenceMarker(match[0]);
    }
  }

  return text;
}

function parseRelationships(relsXml) {
  const map = {};
  if (!relsXml) return map;

  const relRegex = /<Relationship\b([^>]*)\/?>/g;
  let match;

  while ((match = relRegex.exec(relsXml)) !== null) {
    const attrs = match[1];
    const id = attrs.match(/Id="([^"]+)"/)?.[1];
    const target = attrs.match(/Target="([^"]+)"/)?.[1];
    const type = attrs.match(/Type="([^"]+)"/)?.[1] || '';

    if (id && target && type.includes('hyperlink')) {
      map[id] = decodeXmlEntities(target);
    }
  }

  return map;
}

function parseRunFromContent(runContent) {
  const text = extractRunText(runContent);
  if (!text) return null;

  return {
    text,
    bold: runContent.includes('<w:b/>') || runContent.includes('<w:b '),
    italic: runContent.includes('<w:i/>') || runContent.includes('<w:i '),
    underline: runContent.includes('<w:u ') || runContent.includes('<w:u/>'),
    highlight: runContent.includes('<w:highlight'),
    color: runContent.match(/<w:color w:val="([^"]+)"/)?.[1] || null,
  };
}

function getHyperlinkUrl(hyperlinkAttrs, relationships) {
  const rid = hyperlinkAttrs.match(/r:id="([^"]+)"/)?.[1];
  if (rid && relationships[rid]) return relationships[rid];

  const anchor = hyperlinkAttrs.match(/w:anchor="([^"]+)"/)?.[1];
  if (anchor) return `#${anchor}`;

  return null;
}

function getFldSimpleHyperlinkUrl(attrs) {
  const instr = attrs.match(/w:instr="([^"]*)"/)?.[1] || '';
  const decoded = decodeXmlEntities(instr);
  const quoted = decoded.match(/HYPERLINK\s+"([^"]+)"/i);
  if (quoted) return quoted[1];

  const unquoted = decoded.match(/HYPERLINK\s+([^\s\\]+)/i);
  if (unquoted) return unquoted[1];

  return null;
}

function collectRunsFromXml(fragment) {
  const runs = [];
  const runRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g;
  let match;

  while ((match = runRegex.exec(fragment)) !== null) {
    const run = parseRunFromContent(match[1]);
    if (run) runs.push(run);
  }

  return runs;
}

function formatRunAsHtml(run, formatOptions = {}) {
  const { isHeading = false, allBold = false, includeExtraFormatting = true } = formatOptions;
  let text = escapeHtml(run.text);

  if (includeExtraFormatting && !isHeading && !allBold) {
    if (run.bold) text = `<strong>${text}</strong>`;
    if (run.italic) text = `<em>${text}</em>`;
    if (run.underline) text = `<u>${text}</u>`;
  }

  if (includeExtraFormatting) {
    if (run.highlight) text = `<mark>${text}</mark>`;
    if (run.color && run.color !== '000000' && run.color !== 'auto') {
      text = `<span style="color:#${run.color}">${text}</span>`;
    }
  }

  return text;
}

function buildInlineHtml(content, relationships, formatOptions = {}) {
  let html = '';
  const inlineRegex = /<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>|<w:fldSimple\b([^>]*)>([\s\S]*?)<\/w:fldSimple>|<w:r[^>]*>([\s\S]*?)<\/w:r>/g;
  const plainRuns = [];
  let match;

  function flushPlainRuns() {
    if (plainRuns.length === 0) return;

    const allBold = plainRuns.every((run) => run.bold);
    let chunk = '';

    for (const run of plainRuns) {
      chunk += formatRunAsHtml(run, { ...formatOptions, allBold });
    }

    if (allBold && formatOptions.wrapAllBold) {
      chunk = `<strong>${chunk}</strong>`;
    }

    html += chunk;
    plainRuns.length = 0;
  }

  while ((match = inlineRegex.exec(content)) !== null) {
    if (match[1] !== undefined) {
      flushPlainRuns();
      const url = getHyperlinkUrl(match[1], relationships);
      const linkRuns = collectRunsFromXml(match[2]);
      const linkText = linkRuns.map((run) => formatRunAsHtml(run, formatOptions)).join('');

      if (url && linkText) {
        html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      } else if (linkText) {
        html += linkText;
      }
    } else if (match[3] !== undefined) {
      flushPlainRuns();
      const url = getFldSimpleHyperlinkUrl(match[3]);
      const linkRuns = collectRunsFromXml(match[4]);
      const linkText = linkRuns.map((run) => formatRunAsHtml(run, formatOptions)).join('');

      if (url && linkText) {
        html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      } else if (linkText) {
        html += linkText;
      }
    } else if (match[5] !== undefined) {
      const run = parseRunFromContent(match[5]);
      if (run) plainRuns.push(run);
    }
  }

  flushPlainRuns();
  return html;
}

function extractCellText(cellContent, relationships = {}) {
  return buildInlineHtml(cellContent, relationships, {
    isHeading: false,
    wrapAllBold: false,
  });
}

function getParagraphTag(style, pContent, options = {}) {
  const styleLower = style.toLowerCase();
  const isListItem = pContent.includes('<w:numPr>') || style === 'MdListItem' ||
    style === 'ListParagraph' || style === 'Listenabsatz';

  if (style === 'MdHeading1' || style === 'Titel' ||
    style === 'Heading1' || style === 'berschrift1' || style === 'berschrift' ||
    styleLower.includes('heading1') || styleLower.includes('heading 1')) {
    if (options.skipFirstH1) {
      options.skipFirstH1 = false;
      return { tag: null, skip: true };
    }
    return { tag: 'h1' };
  }

  if (style === 'MdHeading2' || style === 'Heading2' || style === 'berschrift2' ||
    styleLower.includes('heading2') || styleLower.includes('heading 2')) {
    return { tag: 'h2' };
  }

  if (style === 'MdHeading3' || style === 'Heading3' || style === 'berschrift3' ||
    styleLower.includes('heading3') || styleLower.includes('heading 3')) {
    return { tag: 'h3' };
  }

  if (style === 'MdHeading4' || style === 'Heading4' || style === 'berschrift4' ||
    styleLower.includes('heading4') || styleLower.includes('heading 4')) {
    return { tag: 'h4' };
  }

  if (isListItem || style === 'MdListItem') return { tag: 'li' };
  if (style === 'MdHr') return { tag: 'hr' };
  if (style === 'MdSpace') return { tag: null, skip: true };

  return { tag: 'p' };
}

function xmlToHtml(xml, relsXml = '', options = {}) {
  const relationships = parseRelationships(relsXml);
  const conversionOptions = {
    skipFirstH1: options.skipFirstH1 ?? true,
  };

  let html = '';
  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  const tableRegex = /<w:tbl[^>]*>([\s\S]*?)<\/w:tbl>/g;

  const tables = [];
  let tableMatch;
  while ((tableMatch = tableRegex.exec(xml)) !== null) {
    tables.push({
      start: tableMatch.index,
      end: tableMatch.index + tableMatch[0].length,
      content: tableMatch[0],
    });
  }

  let match;
  while ((match = paragraphRegex.exec(xml)) !== null) {
    const isInTable = tables.some((table) => match.index >= table.start && match.index <= table.end);
    if (isInTable) continue;

    const pContent = match[1];
    const styleMatch = pContent.match(/<w:pStyle w:val="([^"]+)"/);
    const style = styleMatch ? styleMatch[1] : 'Normal';
    const { tag, skip } = getParagraphTag(style, pContent, conversionOptions);

    if (skip) continue;
    if (tag === 'hr') {
      html += '<hr />\n';
      continue;
    }

    const content = buildInlineHtml(pContent, relationships, {
      isHeading: tag.startsWith('h'),
      wrapAllBold: tag === 'p',
    });

    if (!content.trim()) continue;
    html += `<${tag}>${content}</${tag}>\n`;
  }

  for (const table of tables) {
    html += '<table>\n';
    const rowRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/g;
    let rowMatch;
    let isFirstRow = true;

    while ((rowMatch = rowRegex.exec(table.content)) !== null) {
      html += '<tr>\n';
      const cellRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/g;
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        const cellTag = isFirstRow ? 'th' : 'td';
        const cellHtml = extractCellText(cellMatch[1], relationships);
        html += `<${cellTag}>${cellHtml.trim()}</${cellTag}>\n`;
      }

      html += '</tr>\n';
      isFirstRow = false;
    }

    html += '</table>\n';
  }

  html = html.replace(/(<li>[\s\S]*?<\/li>\n)+/g, (group) => `<ul>\n${group}</ul>\n`);

  if (options.fixDates !== false) {
    html = html.replace(/12\. März 2026/g, '19. März 2026');
  }

  return html;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    decodeXmlEntities,
    escapeHtml,
    extractRunText,
    extractCellText,
    parseRelationships,
    buildInlineHtml,
    xmlToHtml,
  };
}

if (typeof window !== 'undefined') {
  window.WordXmlUtils = {
    decodeXmlEntities,
    escapeHtml,
    extractRunText,
    extractCellText,
    parseRelationships,
    buildInlineHtml,
    xmlToHtml,
  };
}
