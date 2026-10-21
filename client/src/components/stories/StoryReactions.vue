<template>
  <section v-if="available" class="story-end" aria-labelledby="story-end-title">
    <h2 id="story-end-title" class="story-end__title">{{ endLabel }}</h2>
    <p class="story-end__prompt">{{ mine ? 'So reagieren deine Leserinnen und Leser' : 'Wie hat dich das berührt?' }}</p>

    <ul class="story-end__reactions" aria-label="Reaktionen">
      <li v-for="kind in kinds" :key="kind">
        <button
          type="button"
          class="story-end__chip"
          :class="{ 'story-end__chip--mine': isMine(kind), 'story-end__chip--empty': !counts[kind] }"
          :aria-pressed="canReact ? (isMine(kind) ? 'true' : 'false') : undefined"
          :disabled="mine || busy"
          :title="chipTitle"
          @click="onChipClick(kind)"
        >
          <q-icon :name="icons[kind]" size="18px" aria-hidden="true" />
          <span>{{ labels[kind] }}</span>
          <span v-if="counts[kind]" class="story-end__count" :aria-label="`${counts[kind]} Reaktionen`">{{ counts[kind] }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { ReactionCountsDto, ReactionSummaryDto } from '@app/shared/dto/reactions/reaction.dto';
import {
  REACTION_KINDS_BY_TARGET,
  REACTION_LABELS,
  ReactionKind,
  ReactionTargetType,
} from '@app/shared/enums/reaction.enum';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

// ER2-601 / ER2-807 — the end of a story part: "Ende von Teil N", a prompt
// and the reactions as chips like in the Lightbox (zero counts hidden). A
// click while logged out starts the Discord login, without a verified
// character it opens /verify; authors see their counts read-only. Counts
// come from the StoryDto when present, otherwise from GET /reactions. If
// neither is available (older API), the whole block stays hidden.

const ICONS: { [kind: string]: string } = {
  [ReactionKind.GAENSEHAUT]: 'ac_unit',
  [ReactionKind.MEHR_DAVON]: 'add_circle_outline',
  [ReactionKind.HERZSCHMERZ]: 'heart_broken',
  [ReactionKind.SPANNEND]: 'bolt',
};

class Props {
  storyId = prop<number>({ required: true });
  initialCounts = prop<ReactionCountsDto | null>({ default: null });
  initialMine = prop<ReactionKind[] | null>({ default: null });
  /** Own stories cannot be reacted to by their author. */
  mine = prop<boolean>({ type: Boolean, default: false });
  /** Heading of the colophon, e.g. "Ende von Teil 2". */
  endLabel = prop<string>({ default: 'Ende' });
}

@Options({
  name: 'StoryReactions',
  watch: {
    storyId() {
      void (this as StoryReactions).load();
    },
  },
})
export default class StoryReactions extends Vue.with(Props) {
  readonly kinds = REACTION_KINDS_BY_TARGET[ReactionTargetType.STORY];
  readonly labels = REACTION_LABELS;
  readonly icons = ICONS;

  available = false;
  busy = false;
  counts: ReactionCountsDto = {};
  myReactions: ReactionKind[] = [];

  get characterId(): number | null {
    return this.$store.getters.characterId;
  }

  get canReact(): boolean {
    const character = this.$store.getters.character;
    return !!this.characterId && !!character && character.verified && !this.mine;
  }

  get hintKind(): 'own' | 'login' | 'verify' {
    if (this.mine) {
      return 'own';
    }

    return this.$store.getters.character ? 'verify' : 'login';
  }

  get chipTitle(): string | undefined {
    if (this.canReact || this.mine) {
      return undefined;
    }

    return this.hintKind === 'login' ? 'Mit Discord anmelden, um zu reagieren' : 'Charakter verifizieren, um zu reagieren';
  }

  onChipClick(kind: ReactionKind) {
    if (this.canReact) {
      void this.toggle(kind);
    } else if (this.hintKind === 'login') {
      window.location.href = this.$api.user.getDiscordLoginUrl(window.location.origin);
    } else if (this.hintKind === 'verify') {
      void this.$router.push('/verify');
    }
  }

  created() {
    void this.load();
  }

  async load() {
    if (this.initialCounts) {
      this.apply({ reactionCounts: this.initialCounts, myReactions: this.initialMine || [] });
      return;
    }

    try {
      const summary = await this.$api.reactions.getReactions(
        ReactionTargetType.STORY,
        this.storyId,
        this.characterId || undefined,
      );
      this.apply(summary);
    } catch {
      this.available = false;
    }
  }

  apply(summary: ReactionSummaryDto) {
    this.counts = { ...(summary.reactionCounts || {}) };
    this.myReactions = [ ...(summary.myReactions || []) ];
    this.available = true;
  }

  isMine(kind: ReactionKind): boolean {
    return this.myReactions.includes(kind);
  }

  async toggle(kind: ReactionKind) {
    if (!this.canReact || this.busy || !this.characterId) {
      return;
    }

    this.busy = true;

    try {
      const summary = await this.$api.reactions.toggleReaction({
        targetType: ReactionTargetType.STORY,
        targetId: this.storyId,
        characterId: this.characterId,
        kind,
      });
      this.apply(summary);
    } catch (e) {
      notifyError(e);
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="scss" scoped>
// Under StoryView's closing triskelion: "Ende", a prompt, then the chips.
.story-end {
  margin: 4px auto 0;
  text-align: center;
  color: var(--ink-primary);
}

.story-end__title {
  margin: 0;
  font: 500 13px/1.4 var(--font-display);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.story-end__prompt {
  margin: 14px 0 16px;
  font: italic 400 1.05rem/1.4 var(--font-body);
  color: var(--ink-muted);
}

.story-end__reactions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.story-end__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 16px;
  font: 600 14px/1 var(--font-ui);
  color: var(--ink-primary);
  background: transparent;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis), border-color var(--motion-fast) var(--ease-elpis), color var(--motion-fast) var(--ease-elpis), transform var(--motion-fast) var(--ease-elpis);

  .q-icon {
    color: var(--ink-muted);
  }

  &:hover:not(:disabled) {
    background: var(--rule-tint);
    border-color: var(--rule-strong);
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
  }
}

// Authors see all four kinds; unused ones step back.
.story-end__chip--empty:disabled {
  opacity: 0.55;
}

.story-end__count {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-muted);
}

.story-end__chip--mine,
.story-end__chip--mine:hover:not(:disabled) {
  color: var(--vision-on-primary);
  background: var(--vision-primary);
  border-color: var(--vision-primary);

  .q-icon,
  .story-end__count {
    color: inherit;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-end__chip {
    transition: none;

    &:active:not(:disabled) {
      transform: none;
    }
  }
}
</style>
