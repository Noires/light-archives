/**
 * Fandom Tab Functionality
 * Implements tab switching for Fandom WDS-style tabbers
 */

export function initializeFandomTabs(container: HTMLElement): void {
  // Find all tabber containers
  const tabbers = container.querySelectorAll('.tabber, .wds-tabber');

  console.log('Initializing Fandom tabs, found tabbers:', tabbers.length);

  tabbers.forEach(tabber => {
    const tabs = Array.from(tabber.querySelectorAll('.wds-tabs__tab'));
    const contents = Array.from(tabber.querySelectorAll('.wds-tab__content'));

    console.log('Tabs found:', tabs.length, 'Contents found:', contents.length);

    if (tabs.length === 0 || contents.length === 0) {
      console.warn('No tabs or contents found in tabber');
      return;
    }

    // Add click handlers to tabs
    tabs.forEach((tab, index) => {
      // Prevent anchor default behavior but allow event to bubble to tab
      const anchors = tab.querySelectorAll('a');
      anchors.forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          // Don't stopPropagation - let it bubble to the tab handler
        });
      });

      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('Tab clicked:', index);

        // Remove current class from all tabs and contents
        tabs.forEach(t => t.classList.remove('wds-is-current'));
        contents.forEach(c => c.classList.remove('wds-is-current'));

        // Add current class to clicked tab and corresponding content
        tab.classList.add('wds-is-current');
        if (contents[index]) {
          contents[index].classList.add('wds-is-current');
          console.log('Set content', index, 'to visible');
        } else {
          console.warn('No content found for tab index', index);
        }
      });

      // Make tab keyboard accessible
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', '0');

      // Add keyboard navigation
      tab.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          e.preventDefault();
          (tab as HTMLElement).click();
        }
      });
    });

    // Set ARIA attributes for accessibility
    tabs.forEach((tab, index) => {
      tab.setAttribute('aria-controls', `tab-content-${index}`);
      tab.setAttribute('aria-selected', tab.classList.contains('wds-is-current') ? 'true' : 'false');
    });

    contents.forEach((content, index) => {
      content.setAttribute('id', `tab-content-${index}`);
      content.setAttribute('role', 'tabpanel');
    });
  });
}
