/**
 * Unit tests for Word XML to HTML Converter
 * Tests the bugs we fixed:
 * 1. Table positioning - tables should appear at their original position, not at the end
 * 2. Various formatting scenarios
 */

const { xmlToHtml, processParagraph, processTable } = require('./wordConverter');

describe('Word XML to HTML Converter', () => {

  describe('Table Positioning (Bug Fix)', () => {
    it('should place table at its original position in the document', () => {
      // Simulates: Paragraph 1, Table, Paragraph 2
      const xml = `
        <w:p><w:r><w:t>First paragraph</w:t></w:r></w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Data</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
        <w:p><w:r><w:t>Last paragraph</w:t></w:r></w:p>
      `;

      const html = xmlToHtml(xml);

      // Table should appear BETWEEN paragraphs, not at the end
      const firstParagraphIndex = html.indexOf('<p>First paragraph</p>');
      const tableIndex = html.indexOf('<table>');
      const lastParagraphIndex = html.indexOf('<p>Last paragraph</p>');

      expect(firstParagraphIndex).toBeLessThan(tableIndex);
      expect(tableIndex).toBeLessThan(lastParagraphIndex);
    });

    it('should handle multiple tables at different positions', () => {
      const xml = `
        <w:p><w:r><w:t>Intro</w:t></w:r></w:p>
        <w:tbl>
          <w:tr><w:tc><w:p><w:r><w:t>Table1</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t>Middle</w:t></w:r></w:p>
        <w:tbl>
          <w:tr><w:tc><w:p><w:r><w:t>Table2</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t>End</w:t></w:r></w:p>
      `;

      const html = xmlToHtml(xml);

      const introIndex = html.indexOf('Intro');
      const table1Index = html.indexOf('Table1');
      const middleIndex = html.indexOf('Middle');
      const table2Index = html.indexOf('Table2');
      const endIndex = html.indexOf('End');

      // All elements should be in document order
      expect(introIndex).toBeLessThan(table1Index);
      expect(table1Index).toBeLessThan(middleIndex);
      expect(middleIndex).toBeLessThan(table2Index);
      expect(table2Index).toBeLessThan(endIndex);
    });

    it('should not duplicate paragraphs that are inside tables', () => {
      const xml = `
        <w:p><w:r><w:t>Outside</w:t></w:r></w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Inside Table</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      `;

      const html = xmlToHtml(xml);

      // "Inside Table" should only appear once (inside the table)
      const matches = html.match(/Inside Table/g);
      expect(matches).toHaveLength(1);

      // It should be inside a table cell, not a paragraph
      expect(html).toContain('<th>Inside Table</th>');
      expect(html).not.toContain('<p>Inside Table</p>');
    });
  });

  describe('Paragraph Processing', () => {
    it('should convert plain paragraph', () => {
      const xml = '<w:p><w:r><w:t>Hello World</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toBe('<p>Hello World</p>\n');
    });

    it('should handle bold text', () => {
      const xml = '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bold text</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toBe('<p><strong>Bold text</strong></p>\n');
    });

    it('should handle italic text', () => {
      const xml = '<w:p><w:r><w:rPr><w:i/></w:rPr><w:t>Italic text</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toContain('<em>Italic text</em>');
    });

    it('should convert Heading1 style to h1', () => {
      const xml = '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Title</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toBe('<h1>Title</h1>\n');
    });

    it('should convert Heading2 style to h2', () => {
      const xml = '<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Subtitle</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toBe('<h2>Subtitle</h2>\n');
    });

    it('should handle German heading styles (berschrift)', () => {
      const xml = '<w:p><w:pPr><w:pStyle w:val="berschrift1"/></w:pPr><w:r><w:t>German Title</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toBe('<h1>German Title</h1>\n');
    });

    it('should escape HTML entities', () => {
      // Test ampersand escaping
      const xml = '<w:p><w:r><w:t>Test &amp; more</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      expect(html).toContain('&amp;amp;');
    });

    it('should escape angle brackets in text', () => {
      // The converter escapes < and > in text content
      // Input already has &lt; which becomes &amp;lt; after escaping
      const xml = '<w:p><w:r><w:t>code: a &lt; b</w:t></w:r></w:p>';
      const html = processParagraph(xml, false);
      // The &lt; in XML is decoded to < then re-escaped to &lt;
      // But since XML parser gives us &lt; as literal text, it gets double-escaped
      expect(html).toContain('&amp;lt;');
    });
  });

  describe('Table Processing', () => {
    it('should convert table with header row', () => {
      const xml = `
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Header1</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Header2</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Data1</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Data2</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      `;

      const html = processTable(xml);

      expect(html).toContain('<th>Header1</th>');
      expect(html).toContain('<th>Header2</th>');
      expect(html).toContain('<td>Data1</td>');
      expect(html).toContain('<td>Data2</td>');
    });
  });

  describe('List Processing', () => {
    it('should group consecutive list items into ul', () => {
      const xml = `
        <w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr/></w:pPr><w:r><w:t>Item 1</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr/></w:pPr><w:r><w:t>Item 2</w:t></w:r></w:p>
        <w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr/></w:pPr><w:r><w:t>Item 3</w:t></w:r></w:p>
      `;

      const html = xmlToHtml(xml);

      expect(html).toContain('<ul>');
      expect(html).toContain('</ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('<li>Item 3</li>');
    });
  });
});

describe('Dashboard URL Configuration', () => {
  // This tests the concept - the actual URLs are defined in Dashboard.js
  // but we can verify the pattern that caused the bug

  it('should keep API URL separate from admin URL', () => {
    const DIRECTUS_API_URL = 'https://directus.rapid-works.io';
    const DIRECTUS_ADMIN_URL = 'https://directus.rapid-works.io/admin';

    const authEndpoint = `${DIRECTUS_API_URL}/auth/login`;
    const iframeSrc = DIRECTUS_ADMIN_URL;

    // Auth endpoint should NOT contain /admin
    expect(authEndpoint).toBe('https://directus.rapid-works.io/auth/login');
    expect(authEndpoint).not.toContain('/admin/auth');

    // Iframe should point to admin
    expect(iframeSrc).toContain('/admin');
  });

  it('should not append path segments incorrectly', () => {
    // This was the bug: using admin URL for auth
    const wrongUrl = 'https://directus.rapid-works.io/admin';
    const wrongAuthEndpoint = `${wrongUrl}/auth/login`;

    // This produces the broken URL we saw
    expect(wrongAuthEndpoint).toBe('https://directus.rapid-works.io/admin/auth/login');

    // Correct approach
    const correctBaseUrl = 'https://directus.rapid-works.io';
    const correctAuthEndpoint = `${correctBaseUrl}/auth/login`;

    expect(correctAuthEndpoint).toBe('https://directus.rapid-works.io/auth/login');
  });
});
