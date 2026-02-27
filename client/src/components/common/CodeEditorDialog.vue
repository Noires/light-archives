<template>
  <q-dialog ref="dialogRef" @show="onDialogShow" maximized>
    <q-card class="code-editor-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Quellcode bearbeiten</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="code-editor-dialog__content q-pt-none">
        <div ref="editorContainer" class="code-editor-dialog__editor"></div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Abbrechen" color="primary" v-close-popup />
        <q-btn unelevated label="Speichern" color="primary" @click="onSave" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

interface AceEditor {
  getValue(): string;
  setValue(content: string, cursorPos?: number): void;
  getSession(): {
    setMode(mode: string): void;
    setUseWrapMode(wrap: boolean): void;
  };
  setTheme(theme: string): void;
  setOptions(options: Record<string, unknown>): void;
}

interface WindowWithAce extends Window {
  ace?: {
    edit(element: HTMLElement): AceEditor;
  };
}

class Props {
  modelValue = prop<string>({
    required: true,
  });
}

@Options({
  name: 'CodeEditorDialog',
  emits: ['update:modelValue', 'ok'],
})
export default class CodeEditorDialog extends Vue.with(Props) {
  editorInstance: AceEditor | null = null;

  get isDarkMode(): boolean {
    return this.$q.dark.isActive;
  }

  onDialogShow() {
    // Wait for dialog to be fully rendered
    setTimeout(() => {
      this.initAceEditor();
    }, 100);
  }

  initAceEditor() {
    const win = window as WindowWithAce;
    const container = this.$refs.editorContainer as HTMLElement;

    if (!container || !win.ace) {
      console.error('Ace Editor or container not available');
      return;
    }

    try {
      // Initialize Ace Editor
      this.editorInstance = win.ace.edit(container);

      // Set the value
      this.editorInstance.setValue(this.modelValue || '', -1);

      // Configure editor with a dark/light theme depending on current app mode.
      this.applyAceTheme();
      this.editorInstance.getSession().setMode('ace/mode/html');
      this.editorInstance.getSession().setUseWrapMode(true);
      this.editorInstance.setOptions({
        fontSize: '14px',
        showPrintMargin: false,
        highlightActiveLine: true,
        showGutter: true,
      });

      console.log('Ace Editor initialized successfully');
    } catch (error) {
      console.error('Error initializing Ace Editor:', error);
    }
  }

  private applyAceTheme() {
    if (!this.editorInstance) {
      return;
    }

    const preferredTheme = this.isDarkMode ? 'ace/theme/tomorrow_night' : 'ace/theme/chrome';
    const fallbackTheme = this.isDarkMode ? 'ace/theme/monokai' : 'ace/theme/chrome';

    try {
      this.editorInstance.setTheme(preferredTheme);
    } catch {
      this.editorInstance.setTheme(fallbackTheme);
    }
  }

  onSave() {
    if (this.editorInstance) {
      const newCode = this.editorInstance.getValue();
      this.$emit('update:modelValue', newCode);
      this.$emit('ok', newCode);
    }
    const dialog = this.$refs.dialogRef as { hide: () => void };
    dialog.hide();
  }
}
</script>

<style lang="scss">
body {
  --code-editor-border: #ddd;
}

body.body--dark {
  --code-editor-border: #2f3f54;
}

.code-editor-dialog {
  width: 90vw;
  max-width: 1400px;
  height: 90vh;
}

.code-editor-dialog__content {
  height: calc(100% - 120px);
}

.code-editor-dialog__editor {
  width: 100%;
  height: 100%;
  border: 1px solid var(--code-editor-border);
}

.ace_editor {
  font-family: 'Courier New', Courier, monospace !important;
}

body:not(.body--dark) .ace_gutter {
  background: #f5f5f5 !important;
  color: #8B7355 !important;
}

body:not(.body--dark) .ace_gutter-active-line {
  background: #EDD297 !important;
}

body:not(.body--dark) .ace_scroller {
  background: #FEFEFE !important;
}

body.body--dark .ace_editor {
  background: #0d1117 !important;
  color: #e6edf3 !important;
}

body.body--dark .ace_gutter {
  background: #161b22 !important;
  color: #8b949e !important;
}

body.body--dark .ace_gutter-active-line {
  background: #1f2937 !important;
}

body.body--dark .ace_scroller,
body.body--dark .ace_content {
  background: #0d1117 !important;
}

body.body--dark .ace_print-margin {
  background: #1f2937 !important;
}

body.body--dark .ace_cursor {
  color: #f0f6fc !important;
}
</style>
