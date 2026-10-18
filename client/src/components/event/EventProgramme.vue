<template>
  <section class="event-programme" aria-labelledby="event-programme-title">
    <h2 id="event-programme-title" class="event-programme__title">Ablauf</h2>
    <ol class="event-programme__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="event-programme__item"
        :class="{ 'event-programme__item--now': index === currentIndex }"
        :aria-current="index === currentIndex ? 'time' : undefined"
      >
        <span class="event-programme__time">{{ item.time }}</span>
        <span class="event-programme__marker" aria-hidden="true"></span>
        <div class="event-programme__text">
          <span class="event-programme__name">
            {{ item.title }}
            <span v-if="index === currentIndex" class="event-programme__now">Jetzt</span>
          </span>
          <span v-if="item.note" class="event-programme__note">{{ item.note }}</span>
        </div>
      </li>
    </ol>
  </section>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import { isEventLive, serverDateTime } from './event-display';

// ER2-506 — event programme (`EventDto.programme`, ER2-803) as a vertical
// timeline. While the event runs, the current entry (last `HH:mm` at or
// before now, server time; times before the start count as after midnight)
// is marked "Jetzt".

interface ProgrammeItem {
  time: string;
  title: string;
  note?: string;
}

const TIME_REGEX = /^(\d{1,2})[:.](\d{2})/;

class Props {
  items = prop<ProgrammeItem[]>({ required: true });
  startDateTime = prop<number>({ default: 0 });
  endDateTime = prop<number | null>({ default: null });
}

@Options({
  name: 'EventProgramme',
})
export default class EventProgramme extends Vue.with(Props) {
  now = Date.now();
  private timer: number | null = null;

  mounted() {
    this.timer = window.setInterval(() => {
      this.now = Date.now();
    }, 60000);
  }

  beforeUnmount() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
    }
  }

  get currentIndex(): number {
    if (!this.startDateTime || !isEventLive({ startDateTime: this.startDateTime, endDateTime: this.endDateTime }, this.now)) {
      return -1;
    }
    const start = serverDateTime(this.startDateTime);
    const startMinutes = start.hour * 60 + start.minute;
    const nowMinutes = Math.floor((this.now - start.startOf('day').toMillis()) / 60000);
    let current = -1;
    this.items.forEach((item, index) => {
      const match = TIME_REGEX.exec(item.time.trim());
      if (!match) {
        return;
      }
      let minutes = Number(match[1]) * 60 + Number(match[2]);
      if (minutes < startMinutes) {
        minutes += 24 * 60;
      }
      if (minutes <= nowMinutes) {
        current = index;
      }
    });
    return current;
  }
}
</script>

<style lang="scss" scoped>
.event-programme__title {
  text-align: left;
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.event-programme__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.event-programme__item {
  position: relative;
  display: grid;
  grid-template-columns: 64px 20px minmax(0, 1fr);
  gap: 0 10px;
  padding-bottom: 18px;

  &::before {
    content: '';
    position: absolute;
    top: 14px;
    bottom: -2px;
    left: calc(64px + 10px + 9px);
    width: 2px;
    background-color: var(--rule-soft);
  }

  &:last-child {
    padding-bottom: 0;

    &::before {
      display: none;
    }
  }
}

.event-programme__time {
  padding-top: 1px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--ink-muted);
}

.event-programme__marker {
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin: 5px 0 0 4px;
  border: 2px solid var(--rule-strong);
  border-radius: 50%;
  background-color: var(--vision-card);
}

.event-programme__text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.event-programme__name {
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}

.event-programme__note {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-muted);
  overflow-wrap: anywhere;
}

.event-programme__item--now {
  .event-programme__marker {
    border-color: var(--vision-now);
    background-color: var(--vision-now);
  }

  .event-programme__time {
    color: var(--ink-primary);
  }
}

.event-programme__now {
  display: inline-block;
  margin-left: 6px;
  padding: 0 8px;
  border: 1px solid var(--vision-now);
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
  font-weight: 600;
  color: var(--ink-primary);
  vertical-align: 2px;
}
</style>
