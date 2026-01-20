import hugerte from 'hugerte';

// The HugeRTE global. This must be before other HugeRTE imports.
if (typeof globalThis !== 'undefined') {
  (globalThis as typeof globalThis & { hugerte?: typeof hugerte }).hugerte = hugerte;
}

// The DOM model
import 'hugerte/models/dom';

// The default icons.
import 'hugerte/icons/default';

// The silver theme.
import 'hugerte/themes/silver';

// The oxide skin.
import 'hugerte/skins/ui/oxide/skin.js';

// The content skin provided by oxide.
import 'hugerte/skins/ui/oxide/content.js';

// The default content CSS.
import 'hugerte/skins/content/default/content.js';

// Plugins used by HtmlEditor.
import 'hugerte/plugins/advlist';
import 'hugerte/plugins/autolink';
import 'hugerte/plugins/charmap';
import 'hugerte/plugins/code';
import 'hugerte/plugins/help';
import 'hugerte/plugins/image';
import 'hugerte/plugins/importcss';
import 'hugerte/plugins/link';
import 'hugerte/plugins/lists';
import 'hugerte/plugins/nonbreaking';
import 'hugerte/plugins/searchreplace';
import 'hugerte/plugins/table';
import 'hugerte/plugins/visualblocks';
import 'hugerte/plugins/wordcount';

// Help plugin keynav locales.
import 'hugerte/plugins/help/js/i18n/keynav/en.js';
import 'hugerte/plugins/help/js/i18n/keynav/de.js';

export default hugerte;
