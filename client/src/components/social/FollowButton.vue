<template>
  <q-btn
    v-if="visible"
    flat
    no-caps
    class="elpis-btn follow-btn"
    :class="variant === 'on-media' ? 'follow-btn--on-media' : 'elpis-btn--secondary'"
    :icon="following ? activeIcon : icon"
    :aria-pressed="following ? 'true' : 'false'"
    :aria-label="ariaLabel"
    @click.stop.prevent="toggle"
  >
    <span class="follow-btn__label">{{ following ? activeLabel : label }}</span>
    <span v-if="followerCount > 0" class="follow-btn__count" aria-hidden="true">{{ followerCount }}</span>
  </q-btn>
</template>

<script lang="ts">
import type { FollowTargetType } from '@app/shared/dto/social/follow.dto';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { canUseSocial, markUnavailable, socialState } from './social-state';

// ER2 social — follow toggle for characters, venues, story authors and story
// series. Loads the status first and stays hidden until then, for guests and
// unverified accounts, and when the API has no follows endpoint. Toggles
// optimistically and rolls back on failure. Shows the follower count when > 0.
//
//   <follow-button target-type="venue" :target-key="String(venue.id)" />
//   <follow-button target-type="story-series" :target-key="key" label="Benachrichtigen"
//     active-label="Wirst benachrichtigt" icon="notifications_none" active-icon="notifications_active" />

class Props {
  targetType = prop<FollowTargetType>({ required: true });
  /** Character or venue id, author character id, or `${authorCharacterId}:${seriesTitle}`. */
  targetKey = prop<string>({ required: true });
  label = prop<string>({ default: 'Folgen' });
  activeLabel = prop<string>({ default: 'Folge ich' });
  icon = prop<string>({ default: 'person_add_alt' });
  activeIcon = prop<string>({ default: 'check' });
  variant = prop<'secondary' | 'on-media'>({ default: 'secondary' });
}

@Options({
  name: 'FollowButton',
  watch: {
    statusKey() {
      void (this as FollowButton).load();
    },
  },
})
export default class FollowButton extends Vue.with(Props) {
  loaded = false;
  following = false;
  followerCount = 0;
  busy = false;

  get enabled(): boolean {
    return canUseSocial(this.$store.getters.realRole) && !socialState.unavailable.follows && !!this.targetKey;
  }

  get visible(): boolean {
    return this.enabled && this.loaded;
  }

  get statusKey(): string {
    return `${this.enabled ? 1 : 0}|${this.targetType}|${this.targetKey}`;
  }

  get ariaLabel(): string {
    const text = this.following ? this.activeLabel : this.label;
    if (this.followerCount <= 0) {
      return text;
    }
    return `${text} (${this.followerCount} ${this.followerCount === 1 ? 'Person folgt' : 'Personen folgen'})`;
  }

  created() {
    void this.load();
  }

  async load() {
    this.loaded = false;
    if (!this.enabled) {
      return;
    }
    const key = this.statusKey;
    try {
      const status = await this.$api.follows.getFollowStatus(this.targetType, this.targetKey);
      if (key !== this.statusKey) {
        return;
      }
      this.following = !!status?.following;
      this.followerCount = Math.max(0, status?.followerCount || 0);
      this.loaded = true;
    } catch (e) {
      markUnavailable('follows', e);
    }
  }

  async toggle() {
    if (this.busy) {
      return;
    }
    const wasFollowing = this.following;
    const previousCount = this.followerCount;
    this.following = !wasFollowing;
    this.followerCount = Math.max(0, previousCount + (wasFollowing ? -1 : 1));
    this.busy = true;
    try {
      if (wasFollowing) {
        await this.$api.follows.unfollow(this.targetType, this.targetKey);
      } else {
        const status = await this.$api.follows.follow(this.targetType, this.targetKey);
        if (status && typeof status.followerCount === 'number') {
          this.followerCount = Math.max(0, status.followerCount);
        }
      }
    } catch (e) {
      this.following = wasFollowing;
      this.followerCount = previousCount;
      if (!markUnavailable('follows', e)) {
        notifyError('Das hat nicht geklappt. Bitte versuche es erneut.');
      }
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.follow-btn__count {
  display: inline-block;
  min-width: 20px;
  margin-left: 8px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  border-radius: 999px;
  background: var(--rule-tint);
}

// Secondary on media (hero banners): text always sits on a dark scrim, so the
// colours are fixed in both themes, same as the other plate/hero actions.
.q-btn.follow-btn--on-media {
  border: 1px solid rgba(255, 255, 255, 0.32);
  background-color: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:not(.disabled):hover {
    background-color: rgba(255, 255, 255, 0.24);
  }

  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background-color: rgba(11, 6, 18, 0.6);
  }

  .follow-btn__count {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>
