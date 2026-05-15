/**
 * Word XML to HTML Converter
 * Extracted from word-uploader.html for testability
 */

function xmlToHtml(xml) {
  let html = '';
  let skipFirstH1 = false;

  const paragraphRegex = /<w:p[^>]*>[\s\S]*?<\/w:p>/g;
  const tableRegex = /<w:tbl[^>]*>[\s\S]*?<\/w:tbl>/g;

  const elements = [];

  // Find all tables
  let tableMatch;
  while ((tableMatch = tableRegex.exec(xml)) !== null) {
    elements.push({
      type: 'table',
      index: tableMatch.index,
      content: tableMatch[0]
    });
  }

  // Find all paragraphs (excluding those inside tables)
  let pMatch;
  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const isInTable = elements.some(e =>
      e.type === 'table' &&
      pMatch.index >= e.index &&
      pMatch.index < e.index + e.content.length
    );
    if (isInTable) continue;

    elements.push({
      type: 'paragraph',
      index: pMatch.index,
      content: pMatch[0]
    });
  }

  // Sort elements by their position in the document
  elements.sort((a, b) => a.index - b.index);

  // Process elements in document order
  for (const element of elements) {
    if (element.type === 'table') {
      html += processTable(element.content);
    } else {
      const pHtml = processParagraph(element.content, skipFirstH1);
      if (pHtml !== null) {
        if (pHtml === 'SKIP_H1') {
          skipFirstH1 = false;
        } else {
          html += pHtml;
        }
      }
    }
  }

  // Group consecutive li items into ul
  html = html.replace(/(<li>[\s\S]*?<\/li>\n)+/g, (match) => {
    return '<ul>\n' + match + '</ul>\n';
  });

  return html;
}

function processParagraph(pXml, skipFirstH1) {
  const innerMatch = pXml.match(/<w:p[^>]*>([\s\S]*?)<\/w:p>/);
  if (!innerMatch) return null;
  const pContent = innerMatch[1];

  const styleMatch = pContent.match(/<w:pStyle w:val="([^"]+)"/);
  const style = styleMatch ? styleMatch[1] : 'Normal';

  const runs = [];
  const runRegex = /<w:r[^>]*>([\s\S]*?)<\/w:r>/g;
  let runMatch;
  while ((runMatch = runRegex.exec(pContent)) !== null) {
    const runContent = runMatch[1];
    const textMatch = runContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
    if (textMatch) {
      const isBold = runContent.includes('<w:b/>') || runContent.includes('<w:b ');
      const isItalic = runContent.includes('<w:i/>') || runContent.includes('<w:i ');
      const isUnderline = runContent.includes('<w:u ') || runContent.includes('<w:u/>');
      const isHighlight = runContent.includes('<w:highlight');
      const colorMatch = runContent.match(/<w:color w:val="([^"]+)"/);
      const textColor = colorMatch ? colorMatch[1] : null;
      runs.push({ text: textMatch[1], bold: isBold, italic: isItalic, underline: isUnderline, highlight: isHighlight, color: textColor });
    }
  }

  if (runs.length === 0) return null;

  const fullText = runs.map(r => r.text).join('').trim();
  if (!fullText) return null;

  const isListItem = pContent.includes('<w:numPr>') || style === 'MdListItem' ||
                    style === 'ListParagraph' || style === 'Listenabsatz';

  let tag = 'p';
  const styleLower = style.toLowerCase();

  if (style === 'MdHeading1' || style === 'Titel' ||
      style === 'Heading1' || style === 'berschrift1' || style === 'berschrift' ||
      styleLower.includes('heading1') || styleLower.includes('heading 1')) {
    if (skipFirstH1) {
      return 'SKIP_H1';
    }
    tag = 'h1';
  } else if (style === 'MdHeading2' || style === 'Heading2' || style === 'berschrift2' ||
             styleLower.includes('heading2') || styleLower.includes('heading 2')) {
    tag = 'h2';
  } else if (style === 'MdHeading3' || style === 'Heading3' || style === 'berschrift3' ||
             styleLower.includes('heading3') || styleLower.includes('heading 3')) {
    tag = 'h3';
  } else if (style === 'MdHeading4' || style === 'Heading4' || style === 'berschrift4' ||
             styleLower.includes('heading4') || styleLower.includes('heading 4')) {
    tag = 'h4';
  } else if (isListItem) {
    tag = 'li';
  } else if (style === 'MdHr') {
    return '<hr />\n';
  } else if (style === 'MdSpace') {
    return null;
  }

  let content = '';
  const allBold = runs.every(r => r.bold);
  const isHeading = tag.startsWith('h');

  for (const run of runs) {
    let text = run.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (!isHeading && !allBold) {
      if (run.bold) text = `<strong>${text}</strong>`;
      if (run.italic) text = `<em>${text}</em>`;
      if (run.underline) text = `<u>${text}</u>`;
    }
    if (run.highlight) text = `<mark>${text}</mark>`;
    if (run.color && run.color !== '000000' && run.color !== 'auto') {
      text = `<span style="color:#${run.color}">${text}</span>`;
    }
    content += text;
  }

  if (allBold && tag === 'p') {
    content = `<strong>${content}</strong>`;
  }

  return `<${tag}>${content}</${tag}>\n`;
}

function processTable(tableXml) {
  let html = '<table>\n';
  const rowRegex = /<w:tr[^>]*>([\s\S]*?)<\/w:tr>/g;
  let rowMatch;
  let isFirstRow = true;

  while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
    html += '<tr>\n';
    const cellRegex = /<w:tc[^>]*>([\s\S]*?)<\/w:tc>/g;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const cellTag = isFirstRow ? 'th' : 'td';
      const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let cellText = '';
      let textMatch;
      while ((textMatch = textRegex.exec(cellMatch[1])) !== null) {
        cellText += textMatch[1];
      }
      html += `<${cellTag}>${cellText.trim()}</${cellTag}>\n`;
    }
    html += '</tr>\n';
    isFirstRow = false;
  }
  html += '</table>\n';
  return html;
}

module.exports = { xmlToHtml, processParagraph, processTable };
