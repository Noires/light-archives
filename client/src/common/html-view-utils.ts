import { useRouter } from 'src/router';

const $router = useRouter();

export interface HtmlViewClickCaptureOptions {
  links: boolean;
}

export function onHtmlViewClickCapture(event: Event, options: HtmlViewClickCaptureOptions) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }
  
  const linkElement = target.closest('a');
  if (linkElement instanceof HTMLAnchorElement) {
    if (options.links) {
      // Follow internal links without reloading the page
      const link = linkElement;

      if (link.host === window.location.host && link.pathname) {
        event.preventDefault();
        event.stopPropagation();

        // link.pathname is guaranteed to start with /, so it's okay to pass to the router
        void $router.push(`${link.pathname}${link.search}${link.hash}`);
      }
    }
  } else {
    const detailsTitle = target.closest('.hide-details__title');
    const detailsBox = detailsTitle?.parentElement;

    if (detailsBox && detailsBox.classList.contains('hide-details')) {
      const visibleClassName = 'hide-details_visible';

      if (detailsBox.classList.contains(visibleClassName)) {
        detailsBox.classList.remove(visibleClassName);
      } else {
        detailsBox.classList.add(visibleClassName);
      }
    }
  }
}
