<template>
  <div class="html-editor">
    <div :id="toolbarId" class="html-editor__toolbar"></div>
    <editor
    class="html-editor__editor"
    :style="{ height: height }"
    :init="options"
    v-model="editorValue"
    :inline="true"
    output-format="html"
    model-events="change keyup undo redo"
    cdn-version="1"
    @click.capture="onClickCapture"
  />
    <div class="text-caption">Du kannst [[Wikilinks]], z.B. [[Charaktername]] oder [[Charaktername|Mein Lehrer]], nutzen.</div>
  </div>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import Editor from '@hugerte/hugerte-vue';
import { onHtmlViewClickCapture } from 'src/common/html-view-utils';
import { DefineComponent } from 'vue';
import { Options, prop, Vue } from 'vue-class-component';

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

const RTE_PLUGINS = [
  'code advlist autolink lists link image charmap hr nonbreaking',
  'searchreplace visualblocks',
  'table paste help wordcount'
];

const RTE_OPTIONS = {
  toolbar:
    'undo redo | formatselect | bold italic | \
    alignleft aligncenter alignright | \
    image gallery upload link hr | bullist numlist | removeformat',
  toolbar_mode: 'wrap',
  toolbar_persist: true,
  menu: {
    edit: { title: 'Bearbeiten', items: 'undo redo | cut copy paste | selectall | searchreplace' },
    view: { title: 'Ansicht', items: 'code | visualaid visualchars visualblocks' },
    insert: { title: 'Einfügen', items: 'image gallery upload link | charmap nonbreaking hr | hidedetails' },
    format: { title: 'Format', items: 'bold italic underline strikethrough superscript subscript | formats blockformats fontformats fontsizes align lineheight | forecolor backcolor | removeformat' },
    list: { title: 'Listen', items: 'outdent indent' },
    table: { title: 'Tabelle', items: 'inserttable | cell row column | tableprops deletetable' },
    help: { title: 'Hilfe', items: 'help' }
  },
  menubar: 'edit view insert format list table help',
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

let uid = 0;
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
  focus(): void;
}

class Props {
  modelValue = prop<string>({
    required: true,
  });

  height = prop<string>({
    default: '400px',
  });

  allowImages = prop<boolean>({
    default: true
  });
}

@Options({
  name: 'HtmlEditor',
  components: {
    Editor: HugeRteEditor
  },
})
export default class HtmlEditor extends Vue.with(Props) {
  toolbarId = `html-editor__toolbar${uid++}`;

  get editorValue() {
    return this.modelValue;
  }

  set editorValue(newValue: string) {
    this.onInput(newValue);
  }

  get options() {
    let plugins: string[];

    if (this.allowImages) {
      plugins = RTE_PLUGINS;
    } else {
      plugins = RTE_PLUGINS.map(str => str.replace(/image/g, ''));
    }

    return {
      ...RTE_OPTIONS,
      plugins,
      fixed_toolbar_container: `#${this.toolbarId}`,
      setup: (editor: EditorApi) => {
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
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.html-editor__editor {
  height: 400px;
  background: white;
  border: 1px solid #aaa;
  padding: 8px;
  overflow-y: auto;
}

.html-editor h6 {
  font-family: $header-font;
}

.tox, .tox-tinymce {
  font-family: $body-font!important;
}

.html-editor__toolbar {
  width: calc(100% + 4px);
}
</style>
