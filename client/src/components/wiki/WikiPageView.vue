<template>
  <div class="wiki-page-view">
    <h2 class="wiki-page-view__title regular-header-font">{{ wikiPage.title }}</h2>
    <section class="text-caption wiki-page-view__subtitle row">
      <div class="wiki-page-view__posted-by">
      Verfasst von <router-link :to="authorLink">{{ wikiPage.author }}</router-link> am {{ date }}
      </div>
      <div class="wiki-page-view__type">
        Verfügbar unter der <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC-BY-SA 4.0 Lizenz <q-icon class="external-link-icon" name="launch" /></a>
      </div>
    </section>
    <triskelion-divider class="wiki-page-view__divider" />
    <section class="wiki-page-view__body mat-parchment">
      <html-viewer
        class="wiki-page-view__content"
        :content="wikiPage.content"
      />
    </section>
    <footer class="wiki-page-view__meta-footer">
      <span class="wiki-page-view__meta-time">
        <q-icon name="schedule" class="wiki-page-view__meta-icon" />
        Verfasst {{ relativeDate }}
      </span>
      <span class="wiki-page-view__meta-permission" :class="permissionClass">
        <q-icon :name="permissionIcon" class="wiki-page-view__meta-icon" />
        {{ permissionLabel }}
      </span>
    </footer>
  </div>
</template>

<script lang="ts">
import { WikiPageDto } from '@app/shared/dto/wiki/wiki-page.dto';
import { EditPermission } from '@app/shared/enums/edit-permission.enum';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import HtmlViewer from '../common/HtmlViewer.vue';

class Props {
  wikiPage = prop<WikiPageDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'WikiPageView',
  components: {
    HtmlViewer,
    TriskelionDivider,
  }
})
export default class WikiPageView extends Vue.with(Props) {
  get date(): string {
    return this.$display.formatDate(this.wikiPage.createdAt);
  }

  get relativeDate(): string {
    return this.$display.relativeTime(this.wikiPage.createdAt);
  }

  get authorLink(): string {
    const server = this.wikiPage.authorServer || '';
    const character = this.wikiPage.author?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get permissionLabel(): string {
    return this.wikiPage.editPermission === EditPermission.EVERYONE
      ? 'Bearbeitbar von vertrauenswürdigen Mitgliedern'
      : 'Nur vom Autor bearbeitbar';
  }

  get permissionIcon(): string {
    return this.wikiPage.editPermission === EditPermission.EVERYONE ? 'group' : 'lock';
  }

  get permissionClass(): string {
    return this.wikiPage.editPermission === EditPermission.EVERYONE
      ? 'wiki-page-view__meta-permission--everyone'
      : 'wiki-page-view__meta-permission--me';
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

// ELPIS-506 — Wiki body lives on Parchment for visual parity with Story view.
// Triskelion divider replaces the legacy hr separator. Wikilinks (anchors with
// /link/ hrefs as emitted by parseWikilinksInHtml) get a distinct dashed-gold
// underline so they read as intra-archive references rather than external URLs.
//
// ELPIS-507 — The page title's first letter is treated as an illuminated initial
// (larger, ornamental Cinzel Eorzea, gold ink). The title is centered, so this
// is an inline initial rather than a float-left drop cap. Per-page opt-out is
// deferred until WikiPageDto exposes a flag for it (see memory.md verification
// notes); for now the treatment applies to every wiki page.
.wiki-page-view__title::first-letter {
  font-family: var(--font-ornament);
  font-size: 1.5em;
  color: var(--rule-gold);
  letter-spacing: 0.01em;
  font-weight: 500;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

body.body--dark .wiki-page-view__title::first-letter {
  color: var(--glow-aether-d);
  text-shadow: 0 0 14px rgba(184, 165, 255, 0.32);
}

.wiki-page-view__subtitle {
  color: var(--ink-muted);
  font-family: var(--font-section);
  font-style: italic;
}

.wiki-page-view__posted-by {
  flex-grow: 1;
  padding-right: 16px;
}

.wiki-page-view__type {
  flex-grow: 0;
  white-space: nowrap;
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
}

.wiki-page-view__divider {
  margin: 24px auto 18px;
}

.wiki-page-view__body {
  padding: 28px 32px;
  margin-bottom: 16px;
}

.wiki-page-view__body .wiki-page-view__content {
  font-family: var(--font-body);
  line-height: var(--lh-body);
}

// Wikilinks: dashed gold underline + warm ink. External anchors (any href that
// doesn't start with /link/) keep the global --app-link-color. The dash hints
// "this points elsewhere in the archive" without competing with the launch icon
// pattern external links use.
//
// ELPIS-508 — hover transitions the underline from 1 px dashed to 2 px solid
// over 180 ms via animatable `text-decoration-thickness` + `text-decoration-
// color`, and adds a soft warm `box-shadow` glow ring around the link
// fragment so it reads as "lit" on hover. `text-decoration-thickness` is
// animatable in Chrome 89+ / Firefox 70+ / Safari 16.4+; older browsers
// jump-cut between thickness values without breaking the visual contract.
// Using `text-decoration` rather than `border-bottom` lets the underline
// wrap with multi-line wikilinks and keeps the dashed cadence consistent.
.wiki-page-view__body .wiki-page-view__content a[href^="/link/"] {
  color: var(--rule-gold);
  text-decoration: underline;
  text-decoration-style: dashed;
  text-decoration-color: var(--rule-gold-soft);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  border-radius: 2px;
  transition:
    text-decoration-color var(--motion-fast) var(--ease-elpis),
    text-decoration-thickness var(--motion-fast) var(--ease-elpis),
    color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);
}

.wiki-page-view__body .wiki-page-view__content a[href^="/link/"]:hover {
  text-decoration-style: solid;
  text-decoration-color: var(--rule-gold);
  text-decoration-thickness: 2px;
  box-shadow: 0 0 0 4px rgba(186, 155, 91, 0.18);
}

// ELPIS-509 — Subtle metadata footer with relative time + edit-permission
// badge. Sits below the parchment, separated by extra top padding rather than
// a rule so the parchment retains its "framed page" silhouette.
.wiki-page-view__meta-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 6px 4px 0;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.wiki-page-view__meta-time,
.wiki-page-view__meta-permission {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wiki-page-view__meta-permission {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--rule-gold-soft);
  background: rgba(186, 155, 91, 0.08);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
}

.wiki-page-view__meta-permission--everyone {
  border-color: var(--rule-gold);
  background: rgba(186, 155, 91, 0.14);
  color: var(--rule-gold);
}

.wiki-page-view__meta-permission--me {
  // muted (gold-soft) chip — "locked" reads as the default, less emphatic state
  color: var(--ink-muted);
}

.wiki-page-view__meta-icon {
  font-size: 14px;
}

body.body--dark .wiki-page-view__subtitle,
body.body--dark .wiki-page-view__meta-footer {
  color: rgba(236, 227, 247, 0.74);
}

body.body--dark .wiki-page-view__body .wiki-page-view__content a[href^="/link/"] {
  color: var(--glow-aether-d);
  text-decoration-color: var(--rule-arcane-soft);
}

body.body--dark .wiki-page-view__body .wiki-page-view__content a[href^="/link/"]:hover {
  text-decoration-color: var(--rule-arcane);
  box-shadow: 0 0 0 4px rgba(184, 165, 255, 0.22);
}

body.body--dark .wiki-page-view__meta-permission {
  border-color: var(--rule-arcane-soft);
  background: rgba(193, 155, 255, 0.10);
}

body.body--dark .wiki-page-view__meta-permission--everyone {
  border-color: var(--rule-arcane);
  background: rgba(193, 155, 255, 0.18);
  color: var(--ink-luminous);
}

@media screen and (max-width: 600px) {
  .wiki-page-view__body {
    padding: 20px 18px;
  }

  .wiki-page-view__meta-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
