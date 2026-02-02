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
export async function fetchWikiPage(pageName: string): Promise<WikiPageData> {
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

  return {
    title: parse.title,
    text: rawHtml,
    cleanedHtml,
    properties,
    sections: parse.sections || [],
  };
}

/**
 * Extracts and cleans the main content from wiki HTML
 * Removes navigation, categories, infobox chrome but keeps content
 */
function extractMainContent(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements but keep main content
  const removeSelectors = [
    'script',
    'style',
    '.noprint',
    '.mw-editsection',
    '.mw-headline-anchor',
    '.toc',
    '.navbox',
    '.reference',
    '.references',
    '.mbox-image',
    '.ambox',
    '.metadata',
    '.sistersitebox',
    '.catlinks',
    '.printfooter',
    '[style*="display:none"]',
    '[style*="display: none"]',
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get the main content wrapper
  const content = doc.querySelector('.mw-parser-output') || doc.body;

  // Clean up the HTML
  let cleanedHtml = content.innerHTML;

  // Convert wiki links to plain text or keep as links
  cleanedHtml = cleanedHtml
    // Remove edit section links
    .replace(/<span class="mw-editsection">.*?<\/span>/gi, '')
    // Clean up excessive whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return sanitizeWikiHtml(cleanedHtml);
}

/**
 * Sanitizes HTML content from the wiki
 * Removes wiki-specific elements and keeps only safe HTML
 */
export function sanitizeWikiHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove unwanted elements
  const removeSelectors = [
    'script',
    'style',
    '.noprint',
    '.mw-editsection',
    '.mw-headline-anchor',
    '.toc',
    '.navbox',
    '.reference',
    '.references',
    '.mbox-image',
    '.ambox',
    '.metadata',
    '.sistersitebox',
    '[style*="display:none"]',
    '[style*="display: none"]',
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Remove all attributes except href on links
  const allElements = doc.body.querySelectorAll('*');
  allElements.forEach(el => {
    const tagName = el.tagName.toLowerCase();
    const attrs = Array.from(el.attributes);

    attrs.forEach(attr => {
      if (tagName === 'a' && attr.name === 'href') {
        // Keep href but convert wiki links
        const href = attr.value;
        if (href.startsWith('/de/wiki/') || href.startsWith('/wiki/')) {
          // Convert to plain text or remove link
          const text = el.textContent || '';
          el.replaceWith(document.createTextNode(text));
        }
      } else {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Get the cleaned HTML
  let cleanedHtml = doc.body.innerHTML;

  // Remove empty paragraphs and excessive whitespace
  cleanedHtml = cleanedHtml
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return cleanedHtml;
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
