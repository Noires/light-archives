<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="wiki-import-dialog">
      <q-card-section>
        <h5>Import von FF14 Light Wiki</h5>

        <!-- Step 1: URL Input -->
        <template v-if="step === 'input'">
          <p>
            Importiere Charakterdaten von einer Wiki-Seite auf
            <strong>ff14-light.fandom.com</strong>.
          </p>
          <q-input
            v-model="wikiUrl"
            label="Wiki-URL"
            placeholder="https://ff14-light.fandom.com/de/wiki/Charaktername"
            :error="!!urlError"
            :error-message="urlError"
            outlined
            dense
            @keyup.enter="onFetchClick"
          >
            <template v-slot:prepend>
              <q-icon name="link" />
            </template>
          </q-input>
        </template>

        <!-- Step 2: Import Options -->
        <template v-else-if="step === 'preview'">
          <p>
            Daten von <strong>{{ pageTitle }}</strong> geladen.
          </p>

          <!-- Full Content Import Option -->
          <div class="wiki-import-dialog__section wiki-import-dialog__section--highlight">
            <q-checkbox
              v-model="importFullContent"
              :label="fullContentLabel"
              dense
            />
            <div class="wiki-import-dialog__field-preview q-ml-lg">
              Importiert den gesamten Seiteninhalt in den Editor.
              Du kannst ihn dort bearbeiten und aufteilen.
            </div>
          </div>

          <!-- Detected Fields -->
          <template v-if="hasAnyFields">
            <p class="q-mt-md q-mb-sm"><strong>Zusätzlich erkannte Felder:</strong></p>

            <div class="wiki-import-dialog__section" v-if="hasFieldsInSection('profile')">
              <h6>Profil</h6>
              <div class="wiki-import-dialog__fields">
                <template v-for="(value, key) in groupedData.profile" :key="key">
                  <q-checkbox
                    v-model="selectedFields"
                    :val="key"
                    :label="getFieldLabel(key)"
                    dense
                  />
                  <div class="wiki-import-dialog__field-preview">
                    {{ truncateValue(value) }}
                  </div>
                </template>
              </div>
            </div>

            <div class="wiki-import-dialog__section" v-if="hasFieldsInSection('appearance')">
              <h6>Aussehen</h6>
              <div class="wiki-import-dialog__fields">
                <template v-for="(value, key) in groupedData.appearance" :key="key">
                  <q-checkbox
                    v-model="selectedFields"
                    :val="key"
                    :label="getFieldLabel(key)"
                    dense
                  />
                  <div class="wiki-import-dialog__field-preview">
                    {{ truncateValue(value) }}
                  </div>
                </template>
              </div>
            </div>

            <div class="wiki-import-dialog__section" v-if="hasFieldsInSection('personality')">
              <h6>Persönlichkeit</h6>
              <div class="wiki-import-dialog__fields">
                <template v-for="(value, key) in groupedData.personality" :key="key">
                  <q-checkbox
                    v-model="selectedFields"
                    :val="key"
                    :label="getFieldLabel(key)"
                    dense
                  />
                  <div class="wiki-import-dialog__field-preview">
                    {{ truncateValue(value) }}
                  </div>
                </template>
              </div>
            </div>

            <div class="wiki-import-dialog__section" v-if="hasFieldsInSection('contacts')">
              <h6>Kontakte</h6>
              <div class="wiki-import-dialog__fields">
                <template v-for="(value, key) in groupedData.contacts" :key="key">
                  <q-checkbox
                    v-model="selectedFields"
                    :val="key"
                    :label="getFieldLabel(key)"
                    dense
                  />
                  <div class="wiki-import-dialog__field-preview">
                    {{ truncateValue(value) }}
                  </div>
                </template>
              </div>
            </div>

            <div class="wiki-import-dialog__section" v-if="hasFieldsInSection('rumors')">
              <h6>Gerüchte</h6>
              <div class="wiki-import-dialog__fields">
                <template v-for="(value, key) in groupedData.rumors" :key="key">
                  <q-checkbox
                    v-model="selectedFields"
                    :val="key"
                    :label="getFieldLabel(key)"
                    dense
                  />
                  <div class="wiki-import-dialog__field-preview">
                    {{ truncateValue(value) }}
                  </div>
                </template>
              </div>
            </div>
          </template>

          <q-banner v-if="hasSelections" class="bg-info text-dark q-mt-md">
            {{ selectionSummary }}
          </q-banner>
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <template v-if="step === 'input'">
          <q-btn flat color="secondary" label="Abbrechen" @click="onCancelClick" />
          <q-btn
            flat
            color="primary"
            label="Laden"
            @click="onFetchClick"
            :disable="!wikiUrl"
          />
        </template>
        <template v-else-if="step === 'preview'">
          <q-btn flat color="secondary" label="Zurück" @click="onBackClick" />
          <q-btn
            flat
            color="primary"
            label="Importieren"
            @click="onImportClick"
            :disable="!hasSelections"
          />
        </template>
      </q-card-actions>

      <q-inner-loading :showing="loading" />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import { notifyError } from 'src/common/notify';
import {
  validateWikiUrl,
  fetchWikiPage,
  parseWikiContent,
  groupImportData,
  FIELD_LABELS,
  type ParsedCharacterData,
  type GroupedImportData,
  type WikiPageData,
} from 'src/common/wiki-import';

interface DialogRef {
  show(): void;
  hide(): void;
}

type ImportStep = 'input' | 'preview';

// Map target sections to HTML content fields
const SECTION_TO_CONTENT_FIELD: Record<string, keyof ParsedCharacterData> = {
  'profile': 'background',
  'appearance': 'appearance',
  'personality': 'personality',
  'contacts': 'background',
  'rumors': 'openinformation',
  'all': 'background',
};

const SECTION_LABELS: Record<string, string> = {
  'profile': 'Einleitung',
  'appearance': 'Erscheinungsbild',
  'personality': 'Persönlichkeit',
  'contacts': 'Einleitung',
  'rumors': 'Öffentliche Informationen',
  'all': 'Einleitung',
};

class Props {
  targetSection = prop<string>({
    default: 'all',
  });
}

@Options({
  name: 'WikiImportDialog',
  emits: ['ok', 'hide'],
})
export default class WikiImportDialog extends Vue.with(Props) {
  step: ImportStep = 'input';
  loading = false;
  wikiUrl = '';
  urlError = '';
  pageTitle = '';
  pageData: WikiPageData | null = null;
  parsedData: ParsedCharacterData = {};
  groupedData: GroupedImportData = {
    profile: {},
    appearance: {},
    personality: {},
    contacts: {},
    rumors: {},
  };
  selectedFields: string[] = [];
  importFullContent = true;

  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

  onCancelClick() {
    this.hide();
  }

  onBackClick() {
    this.step = 'input';
    this.urlError = '';
  }

  get fullContentLabel(): string {
    const fieldLabel = SECTION_LABELS[this.targetSection] || 'Einleitung';
    return `Gesamten Seiteninhalt in "${fieldLabel}" importieren`;
  }

  get contentField(): keyof ParsedCharacterData {
    return SECTION_TO_CONTENT_FIELD[this.targetSection] || 'background';
  }

  async onFetchClick() {
    this.urlError = '';

    const validation = validateWikiUrl(this.wikiUrl);
    if (!validation.valid) {
      this.urlError = validation.error || 'Ungültige URL';
      return;
    }

    this.loading = true;

    try {
      this.pageData = await fetchWikiPage(validation.pageName!);
      this.pageTitle = this.pageData.title;
      this.parsedData = parseWikiContent(this.pageData);
      this.groupedData = groupImportData(this.parsedData);

      // Pre-select detected fields
      this.preselectFields();

      // Default to importing full content
      this.importFullContent = true;

      this.step = 'preview';
    } catch (e) {
      if (e instanceof Error) {
        this.urlError = e.message;
      } else {
        this.urlError = 'Fehler beim Laden der Wiki-Seite.';
      }
      notifyError(e);
    } finally {
      this.loading = false;
    }
  }

  preselectFields() {
    this.selectedFields = [];

    // Don't pre-select HTML content fields since we have full content option
    const htmlFields = ['background', 'appearance', 'personality', 'aether', 'openinformation', 'commonrumors', 'rarerumors'];

    if (this.targetSection === 'all') {
      // Select non-HTML fields
      this.selectedFields = Object.keys(this.parsedData).filter(f => !htmlFields.includes(f));
    } else {
      // Select fields for the target section (excluding HTML fields)
      const sectionData = this.groupedData[this.targetSection as keyof GroupedImportData];
      if (sectionData) {
        this.selectedFields = Object.keys(sectionData).filter(f => !htmlFields.includes(f));
      }
    }
  }

  onImportClick() {
    const importData: Partial<ParsedCharacterData> = {};

    // Import full content if selected
    if (this.importFullContent && this.pageData) {
      const field = this.contentField;
      (importData as Record<string, string>)[field] = this.pageData.cleanedHtml;
    }

    // Import selected individual fields
    for (const field of this.selectedFields) {
      const value = this.parsedData[field as keyof ParsedCharacterData];
      if (value !== undefined) {
        (importData as Record<string, string>)[field] = value;
      }
    }

    this.$emit('ok', importData);
    this.hide();
  }

  getFieldLabel(field: string): string {
    return FIELD_LABELS[field as keyof ParsedCharacterData] || field;
  }

  truncateValue(value: string): string {
    if (!value) return '';

    // Strip HTML for preview
    const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (text.length > 80) {
      return text.substring(0, 80) + '...';
    }
    return text;
  }

  hasFieldsInSection(section: keyof GroupedImportData): boolean {
    const htmlFields = ['background', 'appearance', 'personality', 'aether', 'openinformation', 'commonrumors', 'rarerumors'];
    const fields = Object.keys(this.groupedData[section]).filter(f => !htmlFields.includes(f));
    return fields.length > 0;
  }

  get hasAnyFields(): boolean {
    const htmlFields = ['background', 'appearance', 'personality', 'aether', 'openinformation', 'commonrumors', 'rarerumors'];
    return Object.keys(this.parsedData).filter(f => !htmlFields.includes(f)).length > 0;
  }

  get hasSelections(): boolean {
    return this.importFullContent || this.selectedFields.length > 0;
  }

  get selectionSummary(): string {
    const parts: string[] = [];
    if (this.importFullContent) {
      parts.push('Gesamter Seiteninhalt');
    }
    if (this.selectedFields.length > 0) {
      parts.push(`${this.selectedFields.length} Feld(er)`);
    }
    return parts.join(' + ') + ' werden importiert.';
  }
}
</script>

<style lang="scss">
.wiki-import-dialog {
  min-width: 400px;
  max-width: 600px;

  h5 {
    margin-top: 0;
    margin-bottom: 16px;
  }

  h6 {
    margin-top: 8px;
    margin-bottom: 8px;
    font-weight: 600;
  }
}

.wiki-import-dialog__section {
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.wiki-import-dialog__section--highlight {
  background: rgba(25, 118, 210, 0.08);
  border: 1px solid rgba(25, 118, 210, 0.3);
}

.wiki-import-dialog__fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  align-items: center;
}

.wiki-import-dialog__field-preview {
  font-size: 0.85em;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
