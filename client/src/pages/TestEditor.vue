<template>
  <q-page padding>
    <div class="test-editor">
      <h2>Wiki Import Test</h2>

      <div class="test-editor__import-form">
        <q-input
          v-model="wikiUrl"
          label="Wiki Page URL"
          placeholder="https://ff14-light.fandom.com/de/wiki/Character_Name"
          outlined
          dense
          class="test-editor__url-input"
          :error="!!urlError"
          :error-message="urlError"
        >
          <template v-slot:prepend>
            <q-icon name="link" />
          </template>
        </q-input>

        <div class="test-editor__controls">
          <q-btn
            @click="importWiki"
            color="primary"
            label="Import"
            icon="download"
            :loading="loading"
            :disable="!wikiUrl"
          />
          <q-btn
            @click="clearContent"
            color="secondary"
            label="Clear"
            icon="clear"
            class="q-ml-sm"
            :disable="!importedHtml"
          />
        </div>
      </div>

      <div v-if="loading" class="test-editor__loading">
        <q-spinner color="primary" size="50px" />
        <p>Loading wiki page...</p>
      </div>

      <div v-if="error" class="test-editor__error">
        <q-banner class="bg-negative text-white">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ error }}
        </q-banner>
      </div>

      <div v-if="importedHtml && !loading" class="test-editor__preview">
        <h3>Imported Content Preview:</h3>
        <p class="text-caption">
          This is how the wiki content will appear in the character profile.
          The tabs should be clickable and functional.
        </p>

        <div ref="contentWrapper" class="test-editor__content-wrapper">
          <div
            class="character-profile__appearance-background"
            v-html="importedHtml"
          />
        </div>
      </div>

      <div v-if="debugInfo" class="test-editor__debug">
        <q-expansion-item label="Debug Info" icon="info">
          <q-card>
            <q-card-section>
              <p><strong>Page Title:</strong> {{ debugInfo.title }}</p>
              <p><strong>HTML Length:</strong> {{ debugInfo.htmlLength }} characters</p>
              <p><strong>Tabs Found:</strong> {{ debugInfo.tabsFound }}</p>
              <p><strong>Tab Contents:</strong> {{ debugInfo.contentsFound }}</p>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { fetchWikiPage, validateWikiUrl } from 'src/common/wiki-import';
import { initializeFandomTabs } from 'src/common/fandom-tabs';

interface DebugInfo {
  title: string;
  htmlLength: number;
  tabsFound: number;
  contentsFound: number;
}

@Options({
  name: 'TestEditor'
})
export default class TestEditor extends Vue {
  loading = false;
  error = '';
  urlError = '';
  wikiUrl = '';
  importedHtml = '';
  debugInfo: DebugInfo | null = null;

  async importWiki() {
    // Validate URL
    const validation = validateWikiUrl(this.wikiUrl);
    if (!validation.valid) {
      this.urlError = validation.error || 'Invalid URL';
      return;
    }

    this.urlError = '';
    this.error = '';
    await this.loadWiki(validation.pageName!);
  }

  async loadWiki(pageName: string) {
    this.loading = true;
    this.error = '';
    this.debugInfo = null;

    try {
      const pageData = await fetchWikiPage(pageName, { includeCss: true });

      console.log('Page data received:', {
        title: pageData.title,
        htmlType: typeof pageData.cleanedHtml,
        htmlLength: pageData.cleanedHtml?.length || 0
      });

      if (!pageData.cleanedHtml || typeof pageData.cleanedHtml !== 'string') {
        throw new Error('Invalid HTML received from wiki import');
      }

      this.importedHtml = pageData.cleanedHtml;

      // Gather debug info
      const parser = new DOMParser();
      const doc = parser.parseFromString(pageData.cleanedHtml, 'text/html');
      this.debugInfo = {
        title: pageData.title,
        htmlLength: pageData.cleanedHtml.length,
        tabsFound: doc.querySelectorAll('.wds-tabs__tab').length,
        contentsFound: doc.querySelectorAll('.wds-tab__content').length,
      };

      // Set loading to false so the v-if condition becomes true
      this.loading = false;

      // Initialize tabs after DOM update
      await this.$nextTick();
      this.initializeTabs();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Import failed';
      console.error('Wiki import error:', e);
      this.loading = false;
    }
  }

  initializeTabs() {
    console.log('initializeTabs called');
    const container = this.$refs.contentWrapper as HTMLElement;
    console.log('container:', container);

    if (container instanceof HTMLElement) {
      console.log('Calling initializeFandomTabs');
      initializeFandomTabs(container);
    } else {
      console.error('Container not found or not an HTMLElement');
    }
  }

  clearContent() {
    this.importedHtml = '';
    this.debugInfo = null;
    this.error = '';
  }
}
</script>

<style lang="scss" scoped>
.test-editor {
  max-width: 1200px;
  margin: 0 auto;

  h2 {
    margin-bottom: 20px;
  }

  h3 {
    margin-top: 30px;
    margin-bottom: 10px;
  }
}

.test-editor__import-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.test-editor__url-input {
  margin-bottom: 15px;
}

.test-editor__controls {
  display: flex;
  gap: 10px;
}

.test-editor__loading {
  text-align: center;
  padding: 40px;

  p {
    margin-top: 20px;
    color: #666;
  }
}

.test-editor__error {
  margin-bottom: 20px;
}

.test-editor__preview {
  margin-top: 30px;
}

.test-editor__content-wrapper {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;

  // Character profile styling context
  .character-profile__appearance-background {
    font-family: $body-font;
    line-height: 1.6;
    color: #333;
  }
}

.test-editor__debug {
  margin-top: 30px;
  font-size: 0.9em;
}
</style>
