<template>
  <figure class="discord-preview" :aria-label="ariaLabel">
    <div class="discord-preview__message">
      <span class="discord-preview__bot-avatar" aria-hidden="true">
        <q-icon name="smart_toy" size="20px" />
      </span>
      <div class="discord-preview__body" @click="onSpoiler" @keydown.enter="onSpoiler" @keydown.space.prevent="onSpoiler">
        <div class="discord-preview__bot">
          <span class="discord-preview__bot-name">{{ botName }}</span>
          <span class="discord-preview__bot-tag">App</span>
          <span class="discord-preview__bot-time">{{ timeLabel }}</span>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -- escaped in renderMentionLine -->
        <p v-if="message.mentionLine" class="discord-preview__mentions" v-html="mentionHtml"></p>

        <div class="discord-preview__container" :style="{ borderLeftColor: message.accentColor }">
          <template v-for="(component, index) in message.components" :key="index">
            <div v-if="component.type === 'section'" class="discord-preview__section">
              <!-- eslint-disable-next-line vue/no-v-html -- escaped in renderDiscordMarkdown -->
              <div class="discord-preview__text" v-html="markdown(component.content)"></div>
              <img :src="component.thumbnailUrl" alt="" class="discord-preview__thumbnail" />
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -- escaped in renderDiscordMarkdown -->
            <div v-else-if="component.type === 'text'" class="discord-preview__text" v-html="markdown(component.content)"></div>
            <img v-else-if="component.type === 'media'" :src="component.url" :alt="component.alt" class="discord-preview__media" />
            <hr v-else-if="component.type === 'separator'" class="discord-preview__separator" />
            <div v-else-if="component.type === 'buttons'" class="discord-preview__buttons">
              <span v-for="button in component.buttons" :key="button.url + button.label" class="discord-preview__button">
                {{ button.label }}
                <q-icon name="open_in_new" size="14px" aria-hidden="true" />
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
    <figcaption v-if="caption" class="discord-preview__caption">{{ caption }}</figcaption>
  </figure>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import { DiscordPreviewMessage, renderDiscordMarkdown, renderMentionLine } from './discord-preview';

// Static preview of a Steward Discord post in Discord's own dark palette
// (independent of Hydaelyn/Zodiark, because that is what members see in
// Discord). Renders the Components V2 layout the bot posts: mention line,
// accent container, title section with thumbnail, text, media, separator and
// link buttons. Timestamps show in the reader's local time, like in Discord;
// spoilers reveal on click.

class Props {
  message = prop<DiscordPreviewMessage>({ required: true });
  botName = prop<string>({ default: 'Steward' });
  /** Post time shown next to the bot name (ms); defaults to now. */
  timestamp = prop<number | null>({ default: null });
  caption = prop<string>({ default: '' });
  /** Accessible name, e.g. the post's title. */
  label = prop<string>({ default: '' });
}

@Options({
  name: 'DiscordMessagePreview',
})
export default class DiscordMessagePreview extends Vue.with(Props) {
  get ariaLabel(): string {
    return `Vorschau der Discord-Nachricht${this.label ? `: ${this.label}` : ''}`;
  }

  get timeLabel(): string {
    const time = this.timestamp ? new Date(this.timestamp) : new Date();
    return `Heute um ${time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  }

  get mentionHtml(): string {
    return renderMentionLine(this.message.mentionLine);
  }

  markdown(source: string): string {
    return renderDiscordMarkdown(source);
  }

  onSpoiler(event: Event) {
    const target = (event.target as HTMLElement | null)?.closest('.discord-preview__spoiler');
    if (target) {
      target.classList.add('discord-preview__spoiler--revealed');
      target.removeAttribute('role');
      target.removeAttribute('tabindex');
    }
  }
}
</script>

<style lang="scss">
// Discord's dark theme (fixed on purpose, see the component note).
.discord-preview {
  --dp-bg: #313338;
  --dp-container: #2b2d31;
  --dp-text: #dbdee1;
  --dp-muted: #949ba4;
  --dp-heading: #f2f3f5;
  --dp-link: #00a8fc;
  --dp-mention-bg: rgba(88, 101, 242, 0.3);
  --dp-mention-text: #c9cdfb;
  --dp-spoiler: #1e1f22;
  --dp-button: #4e5058;

  margin: 0;
  font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.discord-preview__message {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  background: var(--dp-bg);
  border-radius: 8px;
}

.discord-preview__bot-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #ffffff;
  background: #5865f2;
  border-radius: 50%;
}

.discord-preview__body {
  flex: 1;
  min-width: 0;
  color: var(--dp-text);
  font-size: 14px;
  line-height: 1.375;
}

.discord-preview__bot {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  margin-bottom: 4px;
}

.discord-preview__bot-name {
  font-weight: 600;
  color: var(--dp-heading);
}

.discord-preview__bot-tag {
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 15px;
  color: #ffffff;
  background: #5865f2;
  border-radius: 3px;
}

.discord-preview__bot-time {
  font-size: 12px;
  color: var(--dp-muted);
}

.discord-preview__mentions {
  margin: 0 0 6px;
}

.discord-preview__mention {
  padding: 0 2px;
  font-weight: 500;
  color: var(--dp-mention-text);
  background: var(--dp-mention-bg);
  border-radius: 3px;
}

.discord-preview__container {
  display: grid;
  gap: 8px;
  max-width: 520px;
  padding: 16px;
  background: var(--dp-container);
  border-left: 4px solid #8b6b79;
  border-radius: 8px;
}

.discord-preview__section {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.discord-preview__thumbnail {
  flex: none;
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
}

.discord-preview__text {
  min-width: 0;
  overflow-wrap: anywhere;

  strong {
    font-weight: 600;
    color: var(--dp-heading);
  }

  code {
    padding: 0 3px;
    font-size: 0.85em;
    background: var(--dp-spoiler);
    border-radius: 3px;
  }
}

.discord-preview__h1,
.discord-preview__h2,
.discord-preview__h3 {
  display: block;
  margin: 2px 0 4px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--dp-heading);
}

.discord-preview__h1 {
  font-size: 24px;
}

.discord-preview__h2 {
  font-size: 20px;
}

.discord-preview__h3 {
  font-size: 16px;
}

.discord-preview__h1 .discord-preview__link,
.discord-preview__h2 .discord-preview__link {
  color: var(--dp-link);
}

.discord-preview__subtext {
  display: block;
  font-size: 12px;
  color: var(--dp-muted);
}

.discord-preview__quote {
  display: block;
  padding-left: 10px;
  border-left: 4px solid #4e5058;
}

.discord-preview__link {
  color: var(--dp-link);
}

.discord-preview__timestamp {
  padding: 0 2px;
  background: rgba(78, 80, 88, 0.48);
  border-radius: 3px;
}

.discord-preview__spoiler {
  color: transparent;
  background: var(--dp-spoiler);
  border-radius: 3px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--dp-link);
  }
}

.discord-preview__spoiler--revealed {
  color: inherit;
  background: rgba(78, 80, 88, 0.48);
  cursor: auto;
}

.discord-preview__media {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 8px;
}

.discord-preview__separator {
  height: 1px;
  margin: 2px 0;
  background: #3f4147;
  border: 0;
}

.discord-preview__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.discord-preview__button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 2px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: var(--dp-button);
  border-radius: 8px;
}

.discord-preview__caption {
  margin-top: 6px;
  font: 400 12px/16px var(--font-ui);
  color: var(--ink-muted);
}
</style>
