<template>
  <div class="html-editor">
    <editor
      ref="hugerteEditor"
      v-if="bundleReady"
      class="html-editor__editor"
      :style="{ height: height }"
      :init="options"
      v-model="editorValue"
      output-format="html"
      model-events="change keyup undo redo"
      @click.capture="onClickCapture"
    />
    <div v-else class="html-editor__loading">Editor wird geladen...</div>
    <wikilink-hint />
  </div>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import Editor from '@hugerte/hugerte-vue';
import { onHtmlViewClickCapture } from 'src/common/html-view-utils';
import { DefineComponent } from 'vue';
import { Options, prop, Vue } from 'vue-class-component';
import WikilinkHint from 'src/components/common/WikilinkHint.vue';

const FONTS = [
  // Three main ones
  'Noto Sans',
  'Cinzel',
  'Michroma',
  // Extra fonts
  'Alegreya',
  'Alegreya Sans',
  'EB Garamond',
  'Lato',
  'Merriweather',
  'Oswald',
  'Roboto',
  'Playfair Display',
  'PT Serif',
  'Raleway',
];

const FONT_OPTION = FONTS.map(font => `${font}=${font},sans-serif`).join(';');

const RTE_PLUGINS = 'importcss advlist autolink charmap help image link lists nonbreaking searchreplace table visualblocks wordcount';

const RTE_OPTIONS = {
  toolbar:
    'undo redo | formatselect | bold italic | \
    alignleft aligncenter alignright | \
    image gallery upload link hr charmap nonbreaking | \
    bullist numlist | searchreplace code | removeformat',
  toolbar_mode: 'wrap',
  toolbar_persist: true,
  menu: {
    edit: { title: 'Bearbeiten', items: 'undo redo | cut copy paste | selectall | searchreplace' },
    view: { title: 'Ansicht', items: 'code' },
    insert: { title: 'Einfügen', items: 'image gallery upload link | charmap nonbreaking hr | hidedetails' },
    format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats blockformats fontformats fontsizes align lineheight | forecolor backcolor | removeformat' },
    list: { title: 'Listen', items: 'outdent indent' },
    table: { title: 'Tabelle', items: 'inserttable | cell row column | tableprops deletetable' },
    help: { title: 'Hilfe', items: 'help' }
  },
  menubar: false,
  image_title: true,
  image_description: false,
  image_advtab: true,
  link_title: false,
  block_formats: 'Paragraph=p; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6',
  font_formats: FONT_OPTION,
  style_formats: [
    { title: 'Überschriften', items: [
      { title: 'Überschrift 3', format: 'h3' },
      { title: 'Überschrift 4', format: 'h4' },
      { title: 'Überschrift 5', format: 'h5' },
      { title: 'Überschrift 6', format: 'h6' }
    ]},
    { title: 'Inline', items: [
      { title: 'Fett', format: 'bold' },
      { title: 'Kursiv', format: 'italic' },
      { title: 'Unterstrichen', format: 'underline' },
      { title: 'Durchgestrichen', format: 'strikethrough' },
      { title: 'Hochgestellt', format: 'superscript' },
      { title: 'Tiefgestellt', format: 'subscript' },
      { title: 'Code', format: 'code' }
    ]},
    { title: 'Blocks', items: [
      { title: 'Paragraph', format: 'p' },
      { title: 'Blockquote', format: 'blockquote' },
      { title: 'Div', format: 'div' },
      { title: 'Pre', format: 'pre' }
    ]},
    { title: 'Ausrichtung', items: [
      { title: 'Links', format: 'alignleft' },
      { title: 'Zentriert', format: 'aligncenter' },
      { title: 'Rechts', format: 'alignright' },
      { title: 'Blocksatz', format: 'alignjustify' }
    ]}
  ],
  fontsize_formats: '8pt 10.5pt 12pt 14pt 18pt 24pt 36pt',
};

const HugeRteEditor = Editor as unknown as DefineComponent;

type EditorRegistrySpec = {
  text?: string;
  tooltip?: string;
  icon?: string;
  onAction: () => void;
};

interface EditorApi {
  ui: {
    registry: {
      addMenuItem(name: string, spec: EditorRegistrySpec): void;
      addButton(name: string, spec: EditorRegistrySpec): void;
    };
  };
  execCommand(command: string): void;
  undoManager: {
    transact(callback: () => void): void;
  };
  selection: {
    getContent(options: { format: string }): string;
    setContent(html: string): void;
  };
  getContent(): string;
  setContent(content: string): void;
  focus(): void;
}

interface HugeRteVueRef {
  rerender(init: Record<string, unknown>): void;
}

class Props {
  modelValue = prop<string>({
    required: true,
  });

  height = prop<string>({
    default: '400px',
  });

  allowImages = prop<boolean>({ type: Boolean,
    default: true
  });
}

@Options({
  name: 'HtmlEditor',
  components: {
    Editor: HugeRteEditor,
    WikilinkHint
  },
  watch: {
    isDarkMode: 'onDarkModeChanged'
  }
})
export default class HtmlEditor extends Vue.with(Props) {
  bundleReady = false;

  async created() {
    try {
      await import('src/common/hugerte-bundle');
      this.bundleReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  get editorValue() {
    return this.modelValue;
  }

  set editorValue(newValue: string) {
    this.onInput(newValue);
  }

  get options() {
    let plugins: string;

    if (this.allowImages) {
      plugins = RTE_PLUGINS;
    } else {
      plugins = RTE_PLUGINS.replace(/\bimage\b/g, '').replace(/\s+/g, ' ').trim();
    }

    return {
      ...RTE_OPTIONS,
      plugins,
      skin_url: this.isDarkMode ? 'dark' : 'default',
      content_css: this.isDarkMode ? 'dark' : 'default',
      setup: (editor: EditorApi) => {
        // Custom code dialog with Ace syntax highlighting
        editor.ui.registry.addButton('code', {
          tooltip: 'Quellcode bearbeiten',
          icon: 'sourcecode',
          onAction: () => this.openCodeDialog(editor)
        });

        editor.ui.registry.addMenuItem('code', {
          text: 'Quellcode',
          icon: 'sourcecode',
          onAction: () => this.openCodeDialog(editor)
        });

        editor.ui.registry.addMenuItem('outdent', {
          text: 'Einzug verkleinern',
          icon: 'outdent',
          onAction: () => editor.execCommand('Outdent')
        });

        editor.ui.registry.addMenuItem('indent', {
          text: 'Einzug vergrößern',
          icon: 'indent',
          onAction: () => editor.execCommand('Indent')
        });

        editor.ui.registry.addMenuItem('hidedetails', {
          text: 'Details verbergen',
          icon: 'chevron-right',
          onAction: () => this.onHideDetailsClick(editor)
        });

        if (this.allowImages) {
          editor.ui.registry.addMenuItem('gallery', {
            text: 'Bild aus meiner Galerie...',
            icon: 'gallery',
            onAction: () => this.onGalleryClick(editor)
          });

          editor.ui.registry.addButton('gallery', {
            tooltip: 'Bild aus meiner Galerie einfügen',
            icon: 'gallery',
            onAction: () => this.onGalleryClick(editor)
          });

          editor.ui.registry.addMenuItem('upload', {
            text: 'Bild hochladen...',
            icon: 'upload',
            onAction: () => this.onUploadClick(editor)
          });

          editor.ui.registry.addButton('upload', {
            tooltip: 'Bild hochladen',
            icon: 'upload',
            onAction: () => this.onUploadClick(editor)
          });
        }
      }
    };
  }

  get isDarkMode(): boolean {
    return this.$q.dark.isActive;
  }

  private onDarkModeChanged() {
    if (!this.bundleReady) {
      return;
    }

    const editorRef = this.$refs.hugerteEditor as HugeRteVueRef | undefined;
    if (!editorRef?.rerender) {
      return;
    }

    editorRef.rerender({
      skin_url: this.isDarkMode ? 'dark' : 'default',
      content_css: this.isDarkMode ? 'dark' : 'default',
    });
  }

  onClickCapture(event: Event) {
    onHtmlViewClickCapture(event, { links: false });
  }

  onInput(newValue: string) {
    if (newValue === this.modelValue) {
      return;
    }
    this.$emit('update:modelValue', newValue);
  }

  private async onGalleryClick(editor: EditorApi) {
    const GalleryDialog = (await import('./GalleryDialog.vue')).default;

    this.$q.dialog({
      component: GalleryDialog
    }).onOk((image: ImageSummaryDto) => {
      this.insertImage(editor, image.url, image.width, image.height, image.title);
    });
  }

  private async onUploadClick(editor: EditorApi) {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q.dialog({
      component: UploadDialog
    }).onOk((image: ImageSummaryDto) => {
      this.insertImage(editor, image.url, image.width, image.height, image.title);
    });
  }

  private insertImage(editor: EditorApi, src: string, width: number, height: number, title: string) {
    editor.undoManager.transact(() => {
      const img = document.createElement('img');
      img.src = src;
      img.width = width;
      img.height = height;
      img.alt = title;
      editor.focus();
      editor.selection.setContent(img.outerHTML);
    });
  }

  private onHideDetailsClick(editor: EditorApi) {
    editor.undoManager.transact(() => {
      editor.focus();
      const content = editor.selection.getContent({ format: 'html' });
      editor.selection.setContent(`<section class="hide-details hide-details_visible"><div class="hide-details__title">[insert title here]</div><div class="hide-details__content">${content || '[insert text here]'}</div></section>`);
    });
  }

  private async openCodeDialog(editor: EditorApi) {
    const CodeEditorDialog = (await import('./CodeEditorDialog.vue')).default;
    const initialContent = editor.getContent();

    this.$q.dialog({
      component: CodeEditorDialog,
      componentProps: {
        modelValue: initialContent,
      }
    }).onOk((newContent: string) => {
      editor.setContent(newContent);
    });
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

// ELPIS-601 / 602 — HtmlEditor frame rebased onto Aetherium tokens. The
// HugeRTE/TinyMCE chrome inside `.html-editor` is wrapped in a gold-rule
// frame (Vellum on Hydaelyn, Lift on Zodiark); the toolbar gets a 1 px gold
// underline + soft warm tint; the edit area sits on the Parchment-adjacent
// Vellum surface so authored copy reads as ink-on-cream. Active toolbar
// buttons (bold/italic when applied → `.tox-tbtn--enabled`) gain a soft
// `--glow-aether` halo + warm gold tint background so the user can see at
// a glance which formats are currently armed.

body {
  --html-editor-border: var(--rule-gold-soft);
  --html-editor-border-active: var(--rule-gold);
  --html-editor-surface: var(--surface-vellum);
  --html-editor-toolbar-bg: rgba(186, 155, 91, 0.06);
  --html-editor-muted: var(--ink-muted);
  --html-editor-active-tint: rgba(186, 155, 91, 0.18);
  --html-editor-active-ring: rgba(186, 155, 91, 0.32);
}

body.body--dark {
  --html-editor-border: var(--rule-arcane-soft);
  --html-editor-border-active: var(--rule-arcane);
  --html-editor-surface: var(--surface-lift);
  --html-editor-toolbar-bg: rgba(107, 79, 168, 0.14);
  --html-editor-muted: rgba(236, 227, 247, 0.74);
  --html-editor-active-tint: rgba(184, 165, 255, 0.18);
  --html-editor-active-ring: rgba(184, 165, 255, 0.34);
}

.html-editor {
  border-radius: 6px;
}

.html-editor h6 {
  font-family: var(--font-display);
}

.html-editor .text-caption {
  color: var(--html-editor-muted);
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  margin-top: 6px;
}

// ELPIS-601 — Gold-rule frame around the HugeRTE shell. Inset shadow gives
// the toolbar/edit-area boundary a subtle aether bloom without competing
// with the doubled gold rule.
.html-editor .tox.tox-tinymce {
  border: 1px solid var(--html-editor-border);
  border-radius: 6px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 1px 2px rgba(43, 36, 24, 0.06);
  font-family: $body-font !important;
  background: var(--html-editor-surface);
  transition:
    border-color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);
}

.html-editor .tox.tox-tinymce:focus-within {
  border-color: var(--html-editor-border-active);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 0 0 3px var(--html-editor-active-ring),
    0 1px 2px rgba(43, 36, 24, 0.08);
}

.html-editor .tox .tox-editor-header {
  background: var(--html-editor-toolbar-bg);
  border-bottom: 1px solid var(--html-editor-border);
}

.html-editor .tox .tox-toolbar,
.html-editor .tox .tox-toolbar__overflow,
.html-editor .tox .tox-toolbar__primary {
  background: transparent;
}

.html-editor .tox .tox-tbtn {
  border-radius: 4px;
  color: var(--surface-ink);
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);
}

.html-editor .tox .tox-tbtn:hover {
  background-color: rgba(186, 155, 91, 0.12);
  color: var(--surface-ink);
}

// ELPIS-602 — Active toolbar button (bold/italic/etc. when applied to the
// selection) gains a soft aether ring + gold tint background. HugeRTE uses
// `--enabled` for the toggled-on state and `--active` for the depressed/
// hover-active state — both pick up the same chrome so a depressed button
// also reads as "on".
.html-editor .tox .tox-tbtn--enabled,
.html-editor .tox .tox-tbtn--enabled:hover,
.html-editor .tox .tox-tbtn--active {
  background-color: var(--html-editor-active-tint);
  color: var(--rule-gold);
  box-shadow:
    inset 0 0 0 1px var(--html-editor-border-active),
    0 0 0 2px var(--html-editor-active-ring);
}

.html-editor .tox .tox-tbtn--enabled svg,
.html-editor .tox .tox-tbtn--active svg {
  fill: var(--rule-gold);
}

.html-editor .tox .tox-edit-area__iframe {
  background: var(--html-editor-surface);
}

.html-editor__editor {
  height: 400px;
  background: var(--html-editor-surface);
  border: 1px solid var(--html-editor-border);
  padding: 8px;
  overflow-y: auto;
  border-radius: 6px;
}

.tox,
.tox-tinymce {
  font-family: $body-font !important;
}

.html-editor__loading {
  padding: 12px;
  border: 1px solid var(--html-editor-border);
  background: var(--html-editor-surface);
  color: var(--html-editor-muted);
  border-radius: 6px;
  font-family: var(--font-ui);
}

body.body--dark .html-editor .tox .tox-tbtn {
  color: var(--ink-luminous);
}

body.body--dark .html-editor .tox .tox-tbtn:hover {
  background-color: rgba(184, 165, 255, 0.16);
  color: var(--ink-luminous);
}

body.body--dark .html-editor .tox .tox-tbtn--enabled,
body.body--dark .html-editor .tox .tox-tbtn--enabled:hover,
body.body--dark .html-editor .tox .tox-tbtn--active {
  color: var(--glow-aether-d);
}

body.body--dark .html-editor .tox .tox-tbtn--enabled svg,
body.body--dark .html-editor .tox .tox-tbtn--active svg {
  fill: var(--glow-aether-d);
}
</style>

