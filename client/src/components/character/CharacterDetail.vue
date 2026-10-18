<template>
  <div class="character-detail" v-show="value">
    <div class="character-detail__label" :class="{ 'character-detail__label-narrow': label && label.length > 12 } ">{{label}}</div>
    <div class="character-detail__value">
      <template v-if="link"><a :href="link">{{value}}</a></template>
      <template v-else-if="routerLink"><router-link :to="routerLink">{{value}}</router-link></template>
      <template v-else><link-field :content="value"></link-field></template>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import LinkField from '../common/LinkField.vue';

class Props {
  label = prop<string>({
    required: true,
  });

  value = prop<string>({
    required: true,
  });

  link = prop<string>({
    required: false,
    default: ''
  });

  routerLink = prop<string>({
    required: false,
    default: ''
  });
}

@Options({
  name: 'CharacterDetail',
  components: {
    LinkField,
  },
})
export default class CharacterDetail extends Vue.with(Props) {
  
}
</script>

<style lang="scss">
.character-detail {
  display: flex;
  flex-basis: 50%;
  flex-grow: 0.5;
  max-width: 50%;
  /* ELPIS-205 — Aetherium-token divider replaces the bare #ddd. The base
     rule sits on --rule-gold-soft (Hydaelyn) / --rule-arcane-soft (Zodiark)
     so it integrates with both themes; on hover the colour lifts to a
     stronger gold/arcane (alpha 0 → 0.4 in the transition). 160 ms / elpis
     ease per plan §4.2 — falls back to instant via the global reduced-motion
     guard, no per-component @media needed. */
  border-bottom: 1px solid var(--rule-gold-soft);
  transition: border-bottom-color var(--motion-fast) var(--ease-elpis);
  margin-bottom: -1px; /* So that odd last child doesn't have uneven borders */
}

.character-detail:hover {
  /* --rule-gold (#BA9B5B) channel triple at 0.4 alpha. The hover bump from
     0.28 (--rule-gold-soft) → 0.40 reads as the rule "warming up" rather
     than appearing from nothing. */
  border-bottom-color: rgba(186, 155, 91, 0.4);
}

body.body--dark .character-detail {
  border-bottom-color: var(--rule-arcane-soft);
}

body.body--dark .character-detail:hover {
  /* --rule-arcane (#6B4FA8) channel triple at 0.4 alpha. */
  border-bottom-color: rgba(107, 79, 168, 0.4);
}

.character-detail:only-child {
  flex-grow: 1;
}

.character-detail > div {
  padding: 4px 8px;
}

.character-detail__label {
  flex-basis: 0;
  flex-grow: 1;
  min-width: 110px;
  font-weight: bold;
}

.character-detail__label-narrow {
  letter-spacing: -0.3px;
}

.character-detail__value {
  flex-basis: 0;
  flex-grow: 3;
  min-width: 0;
  overflow-wrap: anywhere;
}

@media screen and (max-width: 768px) {
  .character-detail {
    flex-basis: 100%;
    max-width: 100%;
  }
}

@media screen and (max-width: 460px) {
  .character-detail {
    flex-direction: column;
  }

  .character-detail__label {
    min-width: 0;
    padding-bottom: 0;
  }

  .character-detail__value {
    padding-top: 2px;
  }
}
</style>
