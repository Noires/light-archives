<template>
  <q-dialog ref="dialogRef" @show="onDialogShow" maximized>
    <q-card style="width: 90vw; max-width: 1400px; height: 90vh;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Quellcode bearbeiten</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none" style="height: calc(100% - 120px);">
        <div ref="editorContainer" style="width: 100%; height: 100%; border: 1px solid #ddd;"></div>
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

      // Configure editor with a warm theme
      this.editorInstance.setTheme('ace/theme/chrome');
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
.ace_editor {
  font-family: 'Courier New', Courier, monospace !important;
}

// Custom styling to match site theme
.ace_gutter {
  background: #f5f5f5 !important;
  color: #8B7355 !important;
}

.ace_gutter-active-line {
  background: #EDD297 !important;
}

.ace_scroller {
  background: #FEFEFE !important;
}
</style>
