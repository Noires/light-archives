<template>
  <section v-if="available" class="story-reactions" aria-labelledby="story-reactions-title">
    <h2 id="story-reactions-title" class="story-reactions__title">Wie hat dir dieser Teil gefallen?</h2>
    <div class="story-reactions__pills">
      <button
        v-for="kind in kinds"
        :key="kind"
        type="button"
        class="story-reactions__pill"
        :class="{ 'story-reactions__pill--mine': isMine(kind) }"
        :aria-pressed="canReact ? (isMine(kind) ? 'true' : 'false') : undefined"
        :disabled="!canReact || busy"
        @click="toggle(kind)"
      >
        <q-icon :name="icons[kind]" size="18px" aria-hidden="true" />
        <span>{{ labels[kind] }}</span>
        <span class="story-reactions__count" :aria-label="`${counts[kind] || 0} Reaktionen`">{{ counts[kind] || 0 }}</span>
      </button>
    </div>
    <p v-if="!canReact" class="story-reactions__hint">
      {{ hint }}
    </p>
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

// ER2-601 — "Wie hat dir dieser Teil gefallen?" (ER2-807 reactions). Counts
// come from the StoryDto when present, otherwise from GET /reactions. If
// neither is available (older API), the whole block stays hidden.

const ICONS: { [kind: string]: string } = {
  [ReactionKind.GAENSEHAUT]: 'auto_awesome',
  [ReactionKind.MEHR_DAVON]: 'add_circle_outline',
  [ReactionKind.HERZSCHMERZ]: 'heart_broken',
  [ReactionKind.SPANNEND]: 'bolt',
};

class Props {
  storyId = prop<number>({ required: true });
  initialCounts = prop<ReactionCountsDto | null>({ default: null });
  initialMine = prop<ReactionKind[] | null>({ default: null });
  /** Own stories cannot be reacted to by their author. */
  mine = prop<boolean>({ default: false });
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

  get hint(): string {
    if (this.mine) {
      return 'Reaktionen deiner Leserinnen und Leser erscheinen hier.';
    }

    if (!this.$store.getters.character) {
      return 'Melde dich an, um zu reagieren.';
    }

    return 'Verifiziere deinen Charakter, um zu reagieren.';
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
.story-reactions {
  max-width: 68ch;
  margin: 8px auto 0;
  text-align: center;
  font-family: var(--font-ui);
}

.story-reactions__title {
  text-align: left;
  margin: 0 0 14px;
  font-family: var(--font-lore);
  font-style: italic;
  font-weight: 400;
  font-size: 1.25rem;
  color: var(--ink-primary);
}

.story-reactions__pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.story-reactions__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  background: var(--vision-card);
  color: var(--ink-primary);
  font: 600 var(--type-scale-1) / 1 var(--font-ui);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);

  &:hover:not(:disabled) {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }

  &:disabled {
    cursor: default;
  }
}

.story-reactions__pill--mine,
.story-reactions__pill--mine:hover:not(:disabled) {
  background: var(--vision-primary);
  border-color: var(--vision-primary);
  color: var(--vision-on-primary);
}

.story-reactions__count {
  min-width: 20px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--rule-tint);
  font-size: var(--type-scale-0);
}

.story-reactions__hint {
  margin: 10px 0 0;
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

@media (prefers-reduced-motion: reduce) {
  .story-reactions__pill {
    transition: none;
  }
}
</style>
