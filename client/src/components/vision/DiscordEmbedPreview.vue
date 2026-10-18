<template>
  <figure class="discord-preview" :aria-label="ariaLabel">
    <div class="discord-preview__message">
      <span class="discord-preview__bot-avatar" aria-hidden="true">
        <q-icon name="smart_toy" size="20px" />
      </span>
      <div class="discord-preview__body">
        <div class="discord-preview__bot">
          <span class="discord-preview__bot-name">{{ botName }}</span>
          <span class="discord-preview__bot-tag">App</span>
          <span class="discord-preview__bot-time">{{ timeLabel }}</span>
        </div>

        <div class="discord-preview__embed" :style="{ borderLeftColor: color }">
          <div class="discord-preview__embed-grid">
            <div class="discord-preview__embed-main">
              <div v-if="authorName" class="discord-preview__author">{{ authorName }}</div>
              <div v-if="title" class="discord-preview__title">{{ title }}</div>
              <!-- eslint-disable-next-line vue/no-v-html -- escaped in renderMarkdown -->
              <div v-if="description" class="discord-preview__description" v-html="descriptionHtml"></div>
              <div v-if="fields.length" class="discord-preview__fields">
                <div
                  v-for="(field, index) in fields"
                  :key="`${field.name}-${index}`"
                  class="discord-preview__field"
                  :class="{ 'discord-preview__field--inline': field.inline }"
                >
                  <div class="discord-preview__field-name">{{ field.name }}</div>
                  <!-- eslint-disable-next-line vue/no-v-html -- escaped in renderMarkdown -->
                  <div class="discord-preview__field-value" v-html="renderMarkdown(field.value)"></div>
                </div>
              </div>
            </div>
          </div>
          <img v-if="imageUrl" :src="imageUrl" alt="" class="discord-preview__image" />
          <div v-if="footer || timestamp" class="discord-preview__footer">
            <span v-if="footer">{{ footer }}</span>
            <template v-if="footer && timestamp"> • </template>
            <span v-if="timestamp">{{ footerTime }}</span>
          </div>
        </div>
      </div>
    </div>
    <figcaption v-if="caption" class="discord-preview__caption">{{ caption }}</figcaption>
  </figure>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

// ER2-606 — static preview of a Discord message with one embed, drawn in
// Discord's own dark palette (independent of Hydaelyn/Zodiark, because that
// is what members see in Discord). Supports the embed parts the Steward bot
// uses: colour bar, author, title, description (a small Markdown subset:
// **bold**, *italic*, __underline__, `code`, [text](url), > quotes, line
// breaks), fields, image, footer and timestamp.

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class Props {
  /** Embed colour bar, e.g. '#8B6B79' */
  color = prop<string>({ default: '#8B6B79' });
  botName = prop<string>({ default: 'Steward' });
  authorName = prop<string>({ default: '' });
  title = prop<string>({ default: '' });
  description = prop<string>({ default: '' });
  fields = prop<DiscordEmbedField[]>({ default: () => [] });
  imageUrl = prop<string>({ default: '' });
  footer = prop<string>({ default: '' });
  timestamp = prop<number | null>({ default: null });
  caption = prop<string>({ default: '' });
}

@Options({
  name: 'DiscordEmbedPreview',
})
export default class DiscordEmbedPreview extends Vue.with(Props) {
  get ariaLabel(): string {
    return `Vorschau der Discord-Nachricht${this.title ? `: ${this.title}` : ''}`;
  }

  get time(): Date {
    return this.timestamp ? new Date(this.timestamp) : new Date();
  }

  get timeLabel(): string {
    return this.time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  get footerTime(): string {
    return this.time.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get descriptionHtml(): string {
    return this.renderMarkdown(this.description);
  }

  renderMarkdown(source: string): string {
    const lines = escapeHtml(source || '').split('\n');

    return lines
      .map((line) => {
        let html = line
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/__([^_]+)__/g, '<u>$1</u>')
          .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
          .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<span class="discord-preview__link">$1</span>')
          .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<span class="discord-preview__link">$2</span>');

        if (html.startsWith('&gt; ')) {
          html = `<span class="discord-preview__quote">${html.slice(5)}</span>`;
        }

        return html;
      })
      .join('<br>');
  }
}
</script>

<style lang="scss" scoped>
// Discord dark theme values (2024+): message #313338, embed #2B2D31.
.discord-preview {
  margin: 0;
  font-family: 'gg sans', 'Noto Sans', var(--font-ui), sans-serif;
}

.discord-preview__message {
  display: flex;
  gap: 12px;
  padding: 14px 14px 16px;
  border-radius: 10px;
  background: #313338;
  color: #DBDEE1;
}

.discord-preview__bot-avatar {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #5865F2;
  color: #FFFFFF;
}

.discord-preview__body {
  flex: 1 1 auto;
  min-width: 0;
}

.discord-preview__bot {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.discord-preview__bot-name {
  font-size: 15px;
  font-weight: 600;
  color: #F2F3F5;
}

.discord-preview__bot-tag {
  padding: 0 4px;
  border-radius: 3px;
  background: #5865F2;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 600;
  line-height: 15px;
  text-transform: uppercase;
}

.discord-preview__bot-time {
  font-size: 12px;
  color: #949BA4;
}

.discord-preview__embed {
  max-width: 520px;
  padding: 10px 14px 14px 12px;
  border-left: 4px solid #8B6B79;
  border-radius: 4px;
  background: #2B2D31;
}

.discord-preview__author {
  margin-top: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #B5BAC1;
}

.discord-preview__title {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: #00A8FC;
  overflow-wrap: anywhere;
}

.discord-preview__description {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.375;
  color: #DBDEE1;
  white-space: normal;
  overflow-wrap: anywhere;
  max-height: 340px;
  overflow: hidden;
}

.discord-preview__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
}

.discord-preview__field {
  flex: 1 1 100%;
  min-width: 0;
  font-size: 14px;
  line-height: 1.375;
}

.discord-preview__field--inline {
  flex: 1 1 28%;
}

.discord-preview__field-name {
  margin-bottom: 2px;
  font-weight: 600;
  color: #F2F3F5;
}

.discord-preview__field-value {
  color: #DBDEE1;
  overflow-wrap: anywhere;
}

.discord-preview__image {
  display: block;
  max-width: 100%;
  margin-top: 14px;
  border-radius: 4px;
}

.discord-preview__footer {
  margin-top: 10px;
  font-size: 12px;
  color: #B5BAC1;
}

.discord-preview__description,
.discord-preview__field-value {
  :deep(.discord-preview__link) {
    color: #00A8FC;
  }

  :deep(code) {
    padding: 0 3px;
    border-radius: 3px;
    background: #1E1F22;
    font-size: 0.85em;
  }

  :deep(.discord-preview__quote) {
    display: inline-block;
    padding-left: 10px;
    border-left: 4px solid #4E5058;
  }
}

.discord-preview__caption {
  margin-top: 8px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}
</style>
