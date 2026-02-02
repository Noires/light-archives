/**
 * Wiki Import Utility
 * Handles importing character data from ff14-light.fandom.com wiki pages
 */

const ALLOWED_DOMAIN = 'ff14-light.fandom.com';
const FANDOM_API_BASE = `https://${ALLOWED_DOMAIN}/de/api.php`;

export interface WikiValidationResult {
  valid: boolean;
  pageName?: string;
  error?: string;
}

export interface WikiPageData {
  title: string;
  text: string;
  cleanedHtml: string; // Full page content, sanitized for editor
  css?: string; // Optional CSS styles from the wiki page
  properties: Record<string, string>;
  sections: WikiSection[];
}

export interface WikiSection {
  title: string;
  level: number;
  anchor: string;
  content?: string;
}

export interface ParsedCharacterData {
  // Profile fields
  title?: string;
  nickname?: string;
  profession?: string;
  age?: string;
  pronouns?: string;
  birthplace?: string;
  birthday?: string;
  deity?: string;
  family?: string;
  relationsshipstatus?: string;
  residence?: string;
  background?: string;

  // Appearance fields
  haircolor?: string;
  eyecolor?: string;
  skintone?: string;
  build?: string;
  height?: string;
  weight?: string;
  apparentage?: string;
  voice?: string;
  specialfeatures?: string;
  appearance?: string;
  aether?: string;

  // Personality fields
  personality?: string;
  loves?: string;
  hates?: string;
  wishes?: string;
  fears?: string;
  motivation?: string;
  strengths?: string;
  weaknesses?: string;

  // Relationships
  partners?: string;
  parents?: string;
  children?: string;
  relatives?: string;
  friends?: string;
  acquaintances?: string;
  enemies?: string;

  // Rumors
  openinformation?: string;
  commonrumors?: string;
  rarerumors?: string;
}

/**
 * Validates that a URL is from the allowed wiki domain
 */
export function validateWikiUrl(url: string): WikiValidationResult {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Bitte gib eine URL ein.' };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return { valid: false, error: 'Ungültiges URL-Format.' };
  }

  if (parsedUrl.hostname !== ALLOWED_DOMAIN) {
    return {
      valid: false,
      error: `Import nur von ${ALLOWED_DOMAIN} erlaubt.`
    };
  }

  // Extract page name from URL path
  // Expected format: /de/wiki/PageName or /wiki/PageName
  const pathMatch = parsedUrl.pathname.match(/\/(?:de\/)?wiki\/(.+)$/);
  if (!pathMatch) {
    return {
      valid: false,
      error: 'Ungültiger Wiki-Seitenlink. Erwartetes Format: https://ff14-light.fandom.com/de/wiki/Seitenname'
    };
  }

  const pageName = decodeURIComponent(pathMatch[1]);
  return { valid: true, pageName };
}

// Types for Fandom API response
interface FandomApiResponse {
  error?: {
    code?: string;
    info?: string;
  };
  parse?: {
    title: string;
    text: { '*': string };
    properties?: Array<{ name: string; '*': string }>;
    sections?: WikiSection[];
  };
}

/**
 * Fetches wiki page data from the Fandom API
 */
export async function fetchWikiPage(pageName: string, options: { includeCss?: boolean } = {}): Promise<WikiPageData> {
  const apiUrl = new URL(FANDOM_API_BASE);
  apiUrl.searchParams.set('action', 'parse');
  apiUrl.searchParams.set('page', pageName);
  apiUrl.searchParams.set('format', 'json');
  apiUrl.searchParams.set('origin', '*'); // Enable CORS
  apiUrl.searchParams.set('prop', 'text|sections|properties');

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    throw new Error(`Netzwerkfehler: ${response.status}`);
  }

  const data = await response.json() as FandomApiResponse;

  if (data.error) {
    if (data.error.code === 'missingtitle') {
      throw new Error('Wiki-Seite nicht gefunden.');
    }
    throw new Error(data.error.info || 'Fehler beim Laden der Wiki-Seite.');
  }

  const parse = data.parse;
  if (!parse) {
    throw new Error('Ungültige Antwort vom Wiki-Server.');
  }

  // Extract properties from the parsed data
  const properties: Record<string, string> = {};
  if (parse.properties) {
    for (const prop of parse.properties) {
      if (prop.name && prop['*']) {
        properties[prop.name] = prop['*'];
      }
    }
  }

  const rawHtml = parse.text?.['*'] || '';
  const cleanedHtml = extractMainContent(rawHtml);

  // Note: External CSS fetching disabled due to CORS restrictions
  // The API response already includes inline styles for most elements
  // Additional styling is provided by our local fandom-tabs.scss and wiki styles
  if (options.includeCss) {
    console.log('Note: External CSS fetching is disabled due to CORS restrictions.');
    console.log('Using inline styles from API response + local CSS.');
  }

  return {
    title: parse.title,
    text: rawHtml,
    cleanedHtml,
    properties,
    sections: parse.sections || [],
  };
}

/**
 * Fetches CSS styles from the wiki page
 */
async function fetchWikiCss(pageName: string): Promise<string> {
  // Fetch the actual HTML page to get CSS links
  const pageUrl = `https://${ALLOWED_DOMAIN}/de/wiki/${encodeURIComponent(pageName)}`;
  console.log('Fetching wiki page HTML from:', pageUrl);

  const response = await fetch(pageUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();
  console.log('Wiki page HTML fetched, length:', html.length);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract CSS link URLs
  const cssUrls: string[] = [];
  const linkElements = doc.querySelectorAll('link[rel="stylesheet"]');
  console.log('Found stylesheet links:', linkElements.length);

  linkElements.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      // Convert relative URLs to absolute
      const absoluteUrl = href.startsWith('http') ? href : `https:${href}`;
      // Only include Fandom CDN CSS (safe and relevant)
      if (absoluteUrl.includes('fandom') || absoluteUrl.includes('wikia')) {
        cssUrls.push(absoluteUrl);
      }
    }
  });

  console.log('Filtered CSS URLs (Fandom/Wikia only):', cssUrls.length);
  console.log('CSS URLs:', cssUrls.slice(0, 3));

  // Fetch and combine CSS files
  const cssPromises = cssUrls.slice(0, 10).map(async url => {
    try {
      console.log('Fetching CSS from:', url);
      const cssResponse = await fetch(url);
      if (cssResponse.ok) {
        const cssText = await cssResponse.text();
        console.log(`CSS fetched from ${url}, length:`, cssText.length);
        return cssText;
      }
    } catch (e) {
      console.warn(`Failed to fetch CSS from ${url}:`, e);
    }
    return '';
  });

  const cssContents = await Promise.all(cssPromises);
  const combinedCss = cssContents.filter(css => css).join('\n\n');
  console.log('Combined CSS length:', combinedCss.length);
  return combinedCss;
}

/**
 * Applies CSS styles as inline styles to HTML elements
 * Creates a temporary hidden iframe to compute styles and extract them
 */
export async function applyInlineStyles(html: string, css: string): Promise<string> {
  return new Promise((resolve) => {
    // Create a hidden iframe to render the content with CSS
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1000px';
    iframe.style.height = '1000px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      resolve(html); // Fallback to original HTML
      return;
    }

    // Write HTML and CSS to iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        <div id="content">${html}</div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for styles to compute
    setTimeout(() => {
      const contentDiv = iframeDoc.getElementById('content');
      if (contentDiv) {
        // Apply computed styles as inline styles
        applyComputedStylesToElement(contentDiv, iframeDoc.defaultView || window);
        resolve(contentDiv.innerHTML);
      } else {
        resolve(html);
      }

      // Clean up iframe
      document.body.removeChild(iframe);
    }, 500); // Wait for CSS to load and apply
  });
}

/**
 * Recursively applies computed styles to an element and its children
 */
function applyComputedStylesToElement(element: HTMLElement, win: Window): void {
  // Get computed style
  const computed = win.getComputedStyle(element);

  // Properties to copy as inline styles
  const importantProps = [
    'color', 'background-color', 'background-image', 'background-size',
    'background-position', 'background-repeat', 'font-family', 'font-size',
    'font-weight', 'font-style', 'text-align', 'text-decoration',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border', 'border-radius', 'width', 'height', 'max-width', 'max-height',
    'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index',
    'opacity', 'overflow', 'flex-direction', 'justify-content', 'align-items'
  ];

  const existingStyle = element.getAttribute('style') || '';
  const newStyles: string[] = [];

  // Only add styles that differ from defaults
  importantProps.forEach(prop => {
    const value = computed.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
      // Skip default values
      if (prop === 'color' && value === 'rgb(0, 0, 0)') return;
      if (prop === 'background-color' && (value === 'rgba(0, 0, 0, 0)' || value === 'transparent')) return;
      if (prop === 'font-size' && value === '16px') return;
      if (prop === 'display' && value === 'block') return;

      newStyles.push(`${prop}: ${value}`);
    }
  });

  if (newStyles.length > 0) {
    const combinedStyle = existingStyle + '; ' + newStyles.join('; ');
    element.setAttribute('style', combinedStyle);
  }

  // Recursively apply to children
  Array.from(element.children).forEach(child => {
    if (child instanceof HTMLElement) {
      applyComputedStylesToElement(child, win);
    }
  });
}

/**
 * Extracts and cleans the main content from wiki HTML
 * Preserves structure, styling, and Fandom-specific elements for accurate rendering
 */
function extractMainContent(html: string): string {
  if (!html || typeof html !== 'string') {
    console.error('extractMainContent received invalid input:', typeof html);
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Only remove truly unwanted elements - keep structure intact
  const removeSelectors = [
    'script',
    'style',
    '.noprint',
    '.mw-editsection',
    '.catlinks',
    '.printfooter',
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get the main content wrapper
  const content = doc.querySelector('.mw-parser-output') || doc.body;

  // Clean up all attributes to ensure they're valid
  const allElements = content.querySelectorAll('*');
  let cleanupCount = 0;

  allElements.forEach((el, index) => {
    // Get a copy of attributes to avoid modifying while iterating
    const attrs = Array.from(el.attributes);

    attrs.forEach(attr => {
      try {
        const name = attr.name;
        const value = attr.value;

        // Check if attribute name or value is problematic
        if (!name || typeof name !== 'string') {
          console.warn(`Invalid attribute name on ${el.tagName}:`, name);
          el.removeAttribute(name);
          cleanupCount++;
          return;
        }

        // Check if value is not a string or contains problematic content
        if (value === null || value === undefined || typeof value !== 'string') {
          console.warn(`Invalid ${name} value on ${el.tagName}:`, typeof value, value);
          el.removeAttribute(name);
          cleanupCount++;
          return;
        }

        // Clean up style attributes
        if (name === 'style') {
          if (value.includes('undefined') || value.includes('null')) {
            const cleanedStyle = value.split(';')
              .filter(rule => {
                const trimmed = rule.trim();
                return trimmed &&
                       !trimmed.includes('undefined') &&
                       !trimmed.includes('null') &&
                       trimmed.includes(':');
              })
              .join(';');

            if (cleanedStyle) {
              el.setAttribute('style', cleanedStyle);
            } else {
              el.removeAttribute('style');
              cleanupCount++;
            }
          }
        }

        // Remove data attributes that might have complex values
        if (name.startsWith('data-') && name !== 'data-hash' && name !== 'data-source') {
          el.removeAttribute(name);
          cleanupCount++;
        }
      } catch (e) {
        console.error(`Error processing attribute on ${el.tagName}:`, e);
        try {
          el.removeAttribute(attr.name);
          cleanupCount++;
        } catch (e2) {
          console.error('Failed to remove problematic attribute:', e2);
        }
      }
    });
  });

  if (cleanupCount > 0) {
    console.log(`Cleaned up ${cleanupCount} problematic attributes`);
  }

  // Get the HTML content
  let result = content.innerHTML.trim();

  if (!result || typeof result !== 'string') {
    console.error('extractMainContent produced invalid output:', typeof result);
    return '';
  }

  // Final cleanup: ensure all quotes are properly escaped
  // This prevents issues with attribute parsing
  try {
    // Parse and re-serialize to normalize the HTML
    const finalDoc = new DOMParser().parseFromString(result, 'text/html');
    result = finalDoc.body.innerHTML;
  } catch (e) {
    console.error('Error in final HTML normalization:', e);
    // Continue with original result if normalization fails
  }

  console.log(`extractMainContent completed, output length: ${result.length}`);
  return result;
}

/**
 * Converts Fandom tabber structure to collapsible sections
 * Uses the existing hide-details pattern that's already supported by the sanitizer
 */
function convertTabbersToCollapsible(doc: Document): void {
  const tabbers = doc.querySelectorAll('.tabber, .wds-tabber');

  tabbers.forEach(tabber => {
    // Find all tabs and their content
    const tabs = Array.from(tabber.querySelectorAll('.wds-tabs__tab'));
    const contents = Array.from(tabber.querySelectorAll('.wds-tab__content'));

    if (tabs.length === 0 || contents.length === 0) return;

    // Create container for converted tabs
    const container = doc.createElement('div');
    container.className = 'imported-tabs';

    // Convert each tab to a hide-details section
    tabs.forEach((tab, index) => {
      const labelEl = tab.querySelector('.wds-tabs__tab-label, a');
      const label = labelEl?.textContent?.trim() || `Tab ${index + 1}`;
      const content = contents[index];

      if (content) {
        // Create section with hide-details pattern (used by TinyMCE editor)
        const section = doc.createElement('section');
        section.className = 'hide-details hide-details_visible';

        // Title
        const titleDiv = doc.createElement('div');
        titleDiv.className = 'hide-details__title';
        titleDiv.textContent = label;
        section.appendChild(titleDiv);

        // Content
        const contentDiv = doc.createElement('div');
        contentDiv.className = 'hide-details__content';
        contentDiv.innerHTML = content.innerHTML;
        section.appendChild(contentDiv);

        container.appendChild(section);
      }
    });

    // Replace tabber with converted structure
    tabber.replaceWith(container);
  });
}

/**
 * Minimal sanitization of wiki HTML
 * Preserves all structure, styling, and Fandom-specific elements
 * Server-side sanitizer will handle security filtering
 */
export function sanitizeWikiHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Only remove scripts and truly dangerous elements
  const removeSelectors = [
    'script',
    'style',
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Return with all attributes, classes, and inline styles preserved
  return doc.body.innerHTML.trim();
}

/**
 * Extracts a section's content from the full page HTML
 * Handles multiple formats: standard headings, mw-headline, collapsible sections
 */
function extractSectionContent(html: string, sectionTitle: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const searchTitle = sectionTitle.toLowerCase();

  // Strategy 1: Standard headings (h1-h6)
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const headingText = heading.textContent?.trim().toLowerCase();

    if (headingText === searchTitle || headingText?.includes(searchTitle)) {
      // Find the next heading at the same or higher level
      const startLevel = parseInt(heading.tagName[1]);
      let endElement: Element | null = null;

      for (let j = i + 1; j < headings.length; j++) {
        const nextLevel = parseInt(headings[j].tagName[1]);
        if (nextLevel <= startLevel) {
          endElement = headings[j];
          break;
        }
      }

      // Collect content between headings
      const content: string[] = [];
      let current = heading.nextElementSibling;
      while (current && current !== endElement) {
        content.push(current.outerHTML);
        current = current.nextElementSibling;
      }

      if (content.length > 0) {
        return sanitizeWikiHtml(content.join(''));
      }
    }
  }

  // Strategy 2: mw-headline spans inside headings
  const mwHeadlines = Array.from(doc.querySelectorAll<HTMLElement>('.mw-headline'));
  for (const headline of mwHeadlines) {
    const headlineText = headline.textContent?.trim().toLowerCase() || '';
    if (headlineText === searchTitle || headlineText.includes(searchTitle)) {
      // Get the parent heading element
      const parentHeading = headline.closest('h1, h2, h3, h4, h5, h6');
      if (parentHeading) {
        const content: string[] = [];
        let current = parentHeading.nextElementSibling;
        // Collect until next heading
        while (current && !current.matches('h1, h2, h3, h4, h5, h6')) {
          content.push(current.outerHTML);
          current = current.nextElementSibling;
        }
        if (content.length > 0) {
          return sanitizeWikiHtml(content.join(''));
        }
      }
    }
  }

  // Strategy 3: Collapsible sections (mw-customtoggle pattern)
  const toggles = Array.from(doc.querySelectorAll<HTMLElement>('[class*="mw-customtoggle"]'));
  for (const toggle of toggles) {
    const toggleText = toggle.textContent?.trim().toLowerCase() || '';
    if (toggleText === searchTitle || toggleText.includes(searchTitle)) {
      // Find the associated collapsible content
      const toggleClass = Array.from(toggle.classList).find(c => c.startsWith('mw-customtoggle-'));
      if (toggleClass) {
        const contentId = toggleClass.replace('mw-customtoggle-', '');
        const collapsibleContent = doc.querySelector(`#mw-customcollapsible-${contentId}, [class*="mw-customcollapsible-${contentId}"]`);
        if (collapsibleContent) {
          return sanitizeWikiHtml(collapsibleContent.innerHTML);
        }
      }
      // Try next sibling as content
      const nextEl = toggle.nextElementSibling;
      if (nextEl && !nextEl.matches('[class*="mw-customtoggle"]')) {
        return sanitizeWikiHtml(nextEl.outerHTML);
      }
    }
  }

  // Strategy 4: Bold text acting as section headers
  const boldElements = Array.from(doc.querySelectorAll<HTMLElement>('b, strong'));
  for (const bold of boldElements) {
    const boldText = bold.textContent?.trim().toLowerCase() || '';
    if (boldText === searchTitle || boldText.includes(searchTitle)) {
      // Check if this looks like a section header (standalone or in its own element)
      const parent = bold.parentElement;
      if (parent) {
        const content: string[] = [];
        let current = parent.nextElementSibling;
        // Collect a reasonable amount of content
        let count = 0;
        while (current && count < 10) {
          // Stop at next bold element that looks like a section header
          const nextBold = current.querySelector('b, strong');
          if (nextBold) {
            const nextBoldText = nextBold.textContent?.trim() || '';
            // Stop if it looks like a label (all caps or ends with colon)
            if (nextBoldText === nextBoldText.toUpperCase() || nextBoldText.endsWith(':')) {
              break;
            }
          }
          content.push(current.outerHTML);
          current = current.nextElementSibling;
          count++;
        }
        if (content.length > 0) {
          return sanitizeWikiHtml(content.join(''));
        }
      }
    }
  }

  return '';
}

/**
 * Known field labels to search for (lowercase)
 */
const KNOWN_LABELS = [
  'name', 'volk', 'rasse', 'clan', 'stamm', 'clan/stamm',
  'geschlecht', 'alter', 'namenstag', 'geburtstag',
  'gottheit', 'schutzgottheit', 'wohnort', 'herkunft', 'heimat',
  'beruf', 'profession', 'status', 'titel', 'spitzname',
  'haarfarbe', 'augenfarbe', 'größe', 'groesse', 'statur',
  'hautfarbe', 'gewicht', 'stimme', 'besonderheiten',
  'familienstand', 'beziehungsstatus', 'familie',
];

/**
 * Parses the infobox data from the wiki page HTML
 * Handles multiple formats: portable-infobox, tables, and text patterns
 */
function parseInfobox(html: string): Record<string, string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const data: Record<string, string> = {};

  // Strategy 1: Portable-infobox (Fandom's modern format)
  const portableInfobox = doc.querySelector('.portable-infobox');
  if (portableInfobox) {
    // Parse data-source attributes
    const dataItems = portableInfobox.querySelectorAll('[data-source]');
    dataItems.forEach(item => {
      const source = item.getAttribute('data-source');
      if (source) {
        const valueEl = item.querySelector('.pi-data-value, .pi-font');
        const value = valueEl?.textContent?.trim() || item.textContent?.trim() || '';
        if (value) {
          data[source.toLowerCase()] = value;
        }
      }
    });

    // Parse label/value pairs in portable infobox
    const piItems = portableInfobox.querySelectorAll('.pi-item');
    piItems.forEach(item => {
      const labelEl = item.querySelector('.pi-data-label');
      const valueEl = item.querySelector('.pi-data-value');
      if (labelEl && valueEl) {
        const label = labelEl.textContent?.trim().toLowerCase() || '';
        const value = valueEl.textContent?.trim() || '';
        if (label && value && !data[label]) {
          data[label] = value;
        }
      }
    });
  }

  // Strategy 2: Classic infobox tables
  const infoboxTable = doc.querySelector('.infobox, table.infobox');
  if (infoboxTable) {
    const rows = infoboxTable.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      if (cells.length >= 2) {
        const label = cells[0].textContent?.trim().toLowerCase() || '';
        const value = cells[1].textContent?.trim() || '';
        if (label && value && !data[label]) {
          data[label] = value;
        }
      }
    });
  }

  // Strategy 3: Any table with label/value structure
  const allTables = doc.querySelectorAll('table');
  allTables.forEach(table => {
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      if (cells.length >= 2) {
        const label = cells[0].textContent?.trim().toLowerCase() || '';
        const value = cells[1].textContent?.trim() || '';
        if (KNOWN_LABELS.includes(label) && value && !data[label]) {
          data[label] = value;
        }
      }
    });
  });

  // Strategy 4: Bold labels followed by values (common wiki pattern)
  // Look for <b>LABEL</b> or <strong>LABEL</strong> followed by text
  const boldElements = doc.querySelectorAll('b, strong');
  boldElements.forEach(bold => {
    const labelText = bold.textContent?.trim().toLowerCase().replace(/:$/, '') || '';
    if (KNOWN_LABELS.includes(labelText)) {
      // Try to get the next sibling text or element
      let value = '';
      let sibling = bold.nextSibling;

      // Skip separator characters and get the actual value
      while (sibling) {
        if (sibling.nodeType === Node.TEXT_NODE) {
          const text = sibling.textContent?.trim().replace(/^[:\s▹►→|]+/, '').trim() || '';
          if (text && text.length > 0) {
            value = text;
            break;
          }
        } else if (sibling.nodeType === Node.ELEMENT_NODE) {
          const el = sibling as Element;
          // Skip small separator elements
          if (el.tagName !== 'BR' && el.textContent?.trim()) {
            value = el.textContent?.trim().replace(/^[:\s▹►→|]+/, '').trim() || '';
            break;
          }
        }
        sibling = sibling.nextSibling;
      }

      // If no value found in siblings, check parent's text content
      if (!value && bold.parentElement) {
        const parentText = bold.parentElement.textContent || '';
        const labelIndex = parentText.toLowerCase().indexOf(labelText);
        if (labelIndex !== -1) {
          const afterLabel = parentText.substring(labelIndex + labelText.length);
          value = afterLabel.replace(/^[:\s▹►→|]+/, '').split(/[\n\r]/)[0].trim();
        }
      }

      if (value && !data[labelText]) {
        data[labelText] = value;
      }
    }
  });

  // Strategy 5: Search for text patterns "LABEL: value" or "LABEL value" in the full text
  const fullText = doc.body.textContent || '';
  KNOWN_LABELS.forEach(label => {
    if (data[label]) return; // Already found

    // Create regex patterns to match "LABEL: value" or "LABEL value" (case-insensitive)
    const patterns = [
      new RegExp(`(?:^|\\n|\\s)${label}[:\\s▹►→|]+([^\\n]+)`, 'i'),
      new RegExp(`\\*\\*${label}\\*\\*[:\\s▹►→|]*([^\\n*]+)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        if (value && value.length > 0 && value.length < 200) {
          data[label] = value;
          break;
        }
      }
    }
  });

  return data;
}

/**
 * Maps wiki field names to character profile field names
 */
const FIELD_MAPPING: Record<string, keyof ParsedCharacterData> = {
  // German wiki field names -> DTO field names
  'alter': 'age',
  'age': 'age',
  'namenstag': 'birthday',
  'geburtstag': 'birthday',
  'birthday': 'birthday',
  'geschlecht': 'pronouns',
  'gender': 'pronouns',
  'haarfarbe': 'haircolor',
  'hair': 'haircolor',
  'hair color': 'haircolor',
  'augenfarbe': 'eyecolor',
  'eyes': 'eyecolor',
  'eye color': 'eyecolor',
  'größe': 'height',
  'groesse': 'height',
  'height': 'height',
  'statur': 'build',
  'körperbau': 'build',
  'build': 'build',
  'hautfarbe': 'skintone',
  'skin': 'skintone',
  'skin tone': 'skintone',
  'gewicht': 'weight',
  'weight': 'weight',
  'heimat': 'birthplace',
  'geburtsort': 'birthplace',
  'birthplace': 'birthplace',
  'wohnort': 'residence',
  'residence': 'residence',
  'familienstand': 'relationsshipstatus',
  'beziehungsstatus': 'relationsshipstatus',
  'relationship': 'relationsshipstatus',
  'familie': 'family',
  'klan': 'family',
  'clan': 'family',
  'family': 'family',
  'gottheit': 'deity',
  'schutzgottheit': 'deity',
  'deity': 'deity',
  'beruf': 'profession',
  'profession': 'profession',
  'job': 'profession',
  'titel': 'title',
  'title': 'title',
  'spitzname': 'nickname',
  'nickname': 'nickname',
  'stimme': 'voice',
  'voice': 'voice',
  'besonderheiten': 'specialfeatures',
  'merkmale': 'specialfeatures',
  'optisches alter': 'apparentage',
  'apparent age': 'apparentage',
};

/**
 * Maps wiki section names to character profile field names
 */
const SECTION_MAPPING: Record<string, keyof ParsedCharacterData> = {
  'prolog': 'background',
  'einleitung': 'background',
  'introduction': 'background',
  'hintergrund': 'background',
  'background': 'background',
  'aussehen': 'appearance',
  'erscheinung': 'appearance',
  'appearance': 'appearance',
  'verhalten': 'personality',
  'persönlichkeit': 'personality',
  'personality': 'personality',
  'charakter': 'personality',
};

/**
 * Parses wiki page data into character profile fields
 */
export function parseWikiContent(pageData: WikiPageData): ParsedCharacterData {
  const result: ParsedCharacterData = {};

  // Parse infobox data
  const infoboxData = parseInfobox(pageData.text);

  // Map infobox fields
  for (const [wikiField, value] of Object.entries(infoboxData)) {
    const normalizedField = wikiField.toLowerCase().trim();
    const mappedField = FIELD_MAPPING[normalizedField];
    if (mappedField && value) {
      (result as Record<string, string>)[mappedField] = value;
    }
  }

  // Parse sections for HTML content fields
  for (const section of pageData.sections) {
    const normalizedTitle = section.title.toLowerCase().trim();
    const mappedField = SECTION_MAPPING[normalizedTitle];
    if (mappedField) {
      const content = extractSectionContent(pageData.text, section.title);
      if (content) {
        (result as Record<string, string>)[mappedField] = content;
      }
    }
  }

  return result;
}

/**
 * Groups parsed data by edit page section
 */
export interface GroupedImportData {
  profile: Partial<ParsedCharacterData>;
  appearance: Partial<ParsedCharacterData>;
  personality: Partial<ParsedCharacterData>;
  contacts: Partial<ParsedCharacterData>;
  rumors: Partial<ParsedCharacterData>;
}

const PROFILE_FIELDS: (keyof ParsedCharacterData)[] = [
  'title', 'nickname', 'profession', 'age', 'pronouns',
  'birthplace', 'birthday', 'deity', 'family',
  'relationsshipstatus', 'residence', 'background'
];

const APPEARANCE_FIELDS: (keyof ParsedCharacterData)[] = [
  'haircolor', 'eyecolor', 'skintone', 'build', 'height',
  'weight', 'apparentage', 'voice', 'specialfeatures',
  'appearance', 'aether'
];

const PERSONALITY_FIELDS: (keyof ParsedCharacterData)[] = [
  'personality', 'loves', 'hates', 'wishes', 'fears',
  'motivation', 'strengths', 'weaknesses'
];

const CONTACTS_FIELDS: (keyof ParsedCharacterData)[] = [
  'partners', 'parents', 'children', 'relatives',
  'friends', 'acquaintances', 'enemies'
];

const RUMORS_FIELDS: (keyof ParsedCharacterData)[] = [
  'openinformation', 'commonrumors', 'rarerumors'
];

export function groupImportData(data: ParsedCharacterData): GroupedImportData {
  const pick = (fields: (keyof ParsedCharacterData)[]) => {
    const result: Partial<ParsedCharacterData> = {};
    for (const field of fields) {
      if (data[field] !== undefined) {
        (result as Record<string, string>)[field] = data[field] as string;
      }
    }
    return result;
  };

  return {
    profile: pick(PROFILE_FIELDS),
    appearance: pick(APPEARANCE_FIELDS),
    personality: pick(PERSONALITY_FIELDS),
    contacts: pick(CONTACTS_FIELDS),
    rumors: pick(RUMORS_FIELDS),
  };
}

/**
 * Field display names for the UI
 */
export const FIELD_LABELS: Record<keyof ParsedCharacterData, string> = {
  title: 'Titel',
  nickname: 'Spitzname',
  profession: 'Profession',
  age: 'Alter',
  pronouns: 'Geschlecht',
  birthplace: 'Geburtsort',
  birthday: 'Namenstag',
  deity: 'Schutzgottheit',
  family: 'Familie',
  relationsshipstatus: 'Beziehungsstatus',
  residence: 'Wohnort',
  background: 'Einleitung',
  haircolor: 'Haarfarbe',
  eyecolor: 'Augenfarbe',
  skintone: 'Hautfarbe',
  build: 'Statur',
  height: 'Größe',
  weight: 'Gewicht',
  apparentage: 'Optisches Alter',
  voice: 'Stimme',
  specialfeatures: 'Besonderheiten',
  appearance: 'Erscheinungsbild',
  aether: 'Äther',
  personality: 'Persönlichkeit',
  loves: 'Vorlieben',
  hates: 'Abneigungen',
  wishes: 'Wünsche',
  fears: 'Ängste',
  motivation: 'Motivation',
  strengths: 'Stärken',
  weaknesses: 'Schwächen',
  partners: 'Partner',
  parents: 'Eltern',
  children: 'Kinder',
  relatives: 'Verwandte',
  friends: 'Freunde',
  acquaintances: 'Bekannte',
  enemies: 'Feinde',
  openinformation: 'Öffentliche Informationen',
  commonrumors: 'Häufige Gerüchte',
  rarerumors: 'Seltene Gerüchte',
};

/**
 * Checks if a field contains HTML content
 */
export function isHtmlField(field: keyof ParsedCharacterData): boolean {
  return ['background', 'appearance', 'aether', 'personality'].includes(field);
}
