<template>
	<nav v-if="crumbs.length" class="vision-crumbs" aria-label="Brotkrumen">
		<ol class="vision-crumbs__list">
			<li
				v-for="(crumb, index) in crumbs"
				:key="`${index}-${crumb.label}`"
				class="vision-crumbs__item"
			>
				<span v-if="index > 0" class="vision-crumbs__sep" aria-hidden="true">›</span>
				<span
					v-if="index === crumbs.length - 1"
					class="vision-crumbs__current"
					aria-current="page"
				>{{ crumb.label }}</span>
				<router-link v-else-if="crumb.to" class="vision-crumbs__link" :to="crumb.to">{{ crumb.label }}</router-link>
				<span v-else class="vision-crumbs__plain">{{ crumb.label }}</span>
			</li>
		</ol>
	</nav>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw, RouteRecordNormalized } from 'vue-router';
import type { BreadcrumbItem, BreadcrumbMeta, BreadcrumbMetaValue, BreadcrumbSegment } from './types';

// ER2-007 — breadcrumbs from `route.meta.breadcrumb` on each matched record.
// `breadcrumb` is a string, an array of segments (strings or `{ label, to }`),
// or a function of the route returning either. A string contributes one crumb
// linking to its record; an array contributes one crumb per segment, and only
// its last string segment links to the record. Records without it are
// skipped. Pass `items` to override the route-derived trail entirely.

class Props {
	items = prop<BreadcrumbItem[] | null>({ default: null });
}

@Options({
	name: 'Breadcrumbs',
})
export default class Breadcrumbs extends Vue.with(Props) {
	get crumbs(): BreadcrumbItem[] {
		if (this.items) {
			return this.items;
		}
		const result: BreadcrumbItem[] = [];
		for (const record of this.$route.matched) {
			const meta = record.meta.breadcrumb as BreadcrumbMeta | undefined;
			const value: BreadcrumbMetaValue | undefined = typeof meta === 'function' ? meta(this.$route) : meta;
			const segments: BreadcrumbSegment[] = Array.isArray(value) ? value : value ? [value] : [];
			segments.forEach((segment, index) => {
				const item = this.toItem(segment, index === segments.length - 1 ? record : null);
				if (item && !(result.length && result[result.length - 1].label === item.label)) {
					result.push(item);
				}
			});
		}
		return result;
	}

	private toItem(segment: BreadcrumbSegment, record: RouteRecordNormalized | null): BreadcrumbItem | null {
		if (typeof segment === 'string') {
			const label = segment.trim();
			if (!label) {
				return null;
			}
			return record ? { label, to: this.linkFor(record) } : { label };
		}
		if (!segment || !segment.label) {
			return null;
		}
		return segment;
	}

	private linkFor(record: RouteRecordNormalized): RouteLocationRaw | undefined {
		if (record.name) {
			// Only pass the params this record declares; vue-router warns on extras.
			const keys = Array.from(record.path.matchAll(/:(\w+)/g), (m) => m[1]);
			const params: Record<string, string | string[]> = {};
			for (const key of keys) {
				const value = this.$route.params[key];
				if (value !== undefined) {
					params[key] = value;
				}
			}
			return { name: record.name, params };
		}
		if (!record.path.includes(':')) {
			return record.path || '/';
		}
		return undefined;
	}
}
</script>

<style lang="scss" scoped>
.vision-crumbs {
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 20px;
}

.vision-crumbs__list {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	margin: 0;
	padding: 0;
	list-style: none;
}

.vision-crumbs__item {
	display: inline-flex;
	align-items: center;
	min-width: 0;
}

.vision-crumbs__sep {
	margin: 0 8px;
	color: var(--ink-muted);
}

.vision-crumbs__link {
	color: var(--ink-link);
	text-decoration: none;
	border-radius: 4px;

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;
		text-decoration: underline;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.vision-crumbs__plain {
	color: var(--ink-muted);
}

.vision-crumbs__current {
	font-weight: 600;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
}
</style>
