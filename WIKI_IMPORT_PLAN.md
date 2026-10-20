# Wiki Import Plan - Preserve Original Styling

## Goal
Import character wiki pages (e.g., https://ff14-light.fandom.com/de/wiki/Namuu_Qalli) with **exact visual fidelity** to the original page, including:
- Tabbed navigation with working tabs
- Positioned images and overlays
- Background images
- Custom fonts
- All styling and layout

## Current Limitations

### Server-Side Sanitizer (server/libs/shared/src/html.ts)
Currently **BLOCKS**:
- ❌ `position: absolute, fixed, sticky`
- ❌ `top, left, right, bottom`
- ❌ `transform`
- ❌ `overflow` properties
- ❌ `z-index`
- ❌ `background: url()` (to prevent external resources)
- ❌ Viewport units (vw, vh, vmin, vmax)
- ❌ Most non-standard CSS classes

### Client-Side Import (client/src/common/wiki-import.ts)
Currently **STRIPS**:
- Tab structure (converts to hide-details)
- Fandom-specific classes (wds-*, mw-*)
- Complex inline styles
- Background images
- Positioned elements

## Implementation Plan

### Phase 1: Update Sanitizer (server/libs/shared/src/html.ts)

**Add to `allowedStyles`:**
```typescript
// Positioning (contained, for wiki imports)
'position': [/^static$/, /^relative$/, /^absolute$/],
'top': [/^\d+(?:px|em|rem|%)$/],
'left': [/^\d+(?:px|em|rem|%)$/],
'right': [/^\d+(?:px|em|rem|%)$/],
'bottom': [/^\d+(?:px|em|rem|%)$/],
'z-index': [/^-?\d+$/], // Allow integer z-index

// Overflow (needed for scrollable tab content)
'overflow': [/^visible$/, /^hidden$/, /^scroll$/, /^auto$/],
'overflow-x': [/^visible$/, /^hidden$/, /^scroll$/, /^auto$/],
'overflow-y': [/^visible$/, /^hidden$/, /^scroll$/, /^auto$/],

// Transform (limited to safe transforms)
'transform': [/^translate/, /^rotate/, /^scale/],

// Background with images (allow for wiki imports)
'background': [/.*/], // Remove url() restriction
'background-image': [/.*/],
'background-size': [/.*/],
'background-position': [/.*/],
'background-repeat': [/.*/],
```

**Add to `allowedClasses`:**
```typescript
allowedClasses: {
  '*': [
    // Fandom WDS classes
    'tabber', 'wds-tabber', 'wds-tabs', 'wds-tabs__wrapper',
    'wds-tabs__tab', 'wds-tabs__tab-label', 'wds-is-current',
    'wds-tab__content',
    // MediaWiki classes
    'mw-parser-output', 'mw-content-ltr', 'mw-collapsible',
    'mw-collapsed', 'mw-customtoggle-*',
    // Existing
    'hide-details', 'hide-details__title', 'hide-details__content'
  ]
}
```

**Add to `allowedAttributes`:**
```typescript
'*': ['style', 'class', 'id', 'data-hash'] // Add data-hash for tabs
```

### Phase 2: Update Wiki Import Logic

**Modify `extractMainContent()` in client/src/common/wiki-import.ts:**

1. **Remove conversion logic** - Don't convert tabbers to hide-details
2. **Preserve all inline styles** - Don't strip style attributes
3. **Keep Fandom classes** - Don't remove wds-* and mw-* classes
4. **Keep structure intact** - Minimal sanitization, preserve layout

```typescript
function extractMainContent(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Only remove truly unwanted elements
  const removeSelectors = [
    'script', 'style', '.noprint', '.mw-editsection',
    '.catlinks', '.printfooter'
  ];

  removeSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  const content = doc.querySelector('.mw-parser-output') || doc.body;

  // Return with minimal processing - keep structure intact
  return content.innerHTML;
}
```

3. **Remove the `convertTabbersToCollapsible()` call** - Keep tabs as-is

### Phase 3: Add Tab Functionality

**Option A: Include Fandom WDS Tab JS**
- Extract minimal tab switching code from Fandom
- Add to client as a utility

**Option B: Custom Tab Implementation**
```typescript
// client/src/common/fandom-tabs.ts
export function initializeTabs(container: HTMLElement) {
  const tabs = container.querySelectorAll('.wds-tabs__tab');
  const contents = container.querySelectorAll('.wds-tab__content');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      // Remove current class from all
      tabs.forEach(t => t.classList.remove('wds-is-current'));
      contents.forEach(c => c.classList.remove('wds-is-current'));
      // Add to clicked
      tab.classList.add('wds-is-current');
      contents[index]?.classList.add('wds-is-current');
    });
  });
}
```

**Add CSS for tab styling:**
```scss
// client/src/css/fandom-tabs.scss
.wds-tabber {
  .wds-tabs {
    display: flex;
    list-style: none;
    padding: 0;
    border-bottom: 2px solid #ccc;
  }

  .wds-tabs__tab {
    padding: 10px 20px;
    cursor: pointer;
    border: 1px solid transparent;

    &.wds-is-current {
      border-color: #ccc;
      border-bottom-color: white;
      background: white;
    }
  }

  .wds-tab__content {
    display: none;
    padding: 20px;

    &.wds-is-current {
      display: block;
    }
  }
}
```

### Phase 4: Create Test Page

**File: client/src/pages/TestEditor.vue**

```vue
<template>
  <q-page padding>
    <h2>Wiki Import Test</h2>

    <q-btn @click="loadWiki" color="primary" label="Load Namuu Qalli" />

    <div v-if="loading">Loading...</div>

    <div v-if="error" class="text-negative">{{ error }}</div>

    <div v-if="importedHtml" class="test-preview">
      <h3>Imported Content Preview:</h3>
      <div
        class="character-profile__appearance-background"
        v-html="importedHtml"
        @click.capture="onClickCapture"
      />
    </div>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { fetchWikiPage } from 'src/common/wiki-import';
import { onHtmlViewClickCapture } from 'src/common/html-view-utils';

@Options({
  name: 'TestEditor'
})
export default class TestEditor extends Vue {
  loading = false;
  error = '';
  importedHtml = '';

  async mounted() {
    // Auto-load on mount
    await this.loadWiki();
  }

  async loadWiki() {
    this.loading = true;
    this.error = '';

    try {
      const pageData = await fetchWikiPage('Namuu_Qalli');
      this.importedHtml = pageData.cleanedHtml;

      // Initialize tabs after DOM update
      await this.$nextTick();
      this.initializeTabs();
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Import failed';
    } finally {
      this.loading = false;
    }
  }

  initializeTabs() {
    // Initialize Fandom-style tabs
    const container = this.$el.querySelector('.test-preview');
    if (container) {
      // Tab initialization code here
    }
  }

  onClickCapture(event: Event) {
    onHtmlViewClickCapture(event, { links: true });
  }
}
</script>
```

**Add route in client/src/router/routes.ts:**
```typescript
{
  path: '/test-editor',
  component: () => import('pages/TestEditor.vue')
}
```

### Phase 5: Testing Checklist

- [ ] Sanitizer allows all needed CSS properties
- [ ] Images display with correct positioning
- [ ] Background images work
- [ ] Tabs are clickable and switch content
- [ ] Tab content displays correctly
- [ ] Collapsible sections work (mw-collapsible)
- [ ] Text styling preserved (fonts, colors, sizes)
- [ ] Layout matches original wiki page
- [ ] No console errors
- [ ] Content saves and loads correctly from database

## Security Considerations

**Risks of allowing more CSS:**
- `position: absolute` could be used to overlay content
- `z-index` could hide UI elements
- `background: url()` could load external resources

**Mitigations:**
1. Only allow for authenticated users' own content
2. Document that wiki imports are user-generated content
3. Consider adding `sandbox` attribute for iframe rendering if needed
4. Rate limit wiki imports to prevent abuse

## Timeline

1. **Phase 1**: Update sanitizer - 30 min
2. **Phase 2**: Update import logic - 20 min
3. **Phase 3**: Add tab functionality - 45 min
4. **Phase 4**: Create test page - 30 min
5. **Phase 5**: Testing & fixes - 60 min

**Total estimated time: ~3 hours**

## Success Criteria

✅ Import https://ff14-light.fandom.com/de/wiki/Namuu_Qalli
✅ Display in /test-editor looks identical to original
✅ All tabs work and switch content
✅ All images and styling preserved
✅ Content can be saved to character profile
✅ No security vulnerabilities introduced
