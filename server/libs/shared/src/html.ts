import sanitizeHtml from 'sanitize-html';

const html = {
	sanitize(input: string): string {
		return sanitizeHtml(input, {
			allowedTags: [ ...sanitizeHtml.defaults.allowedTags, 'img' ],
			allowedClasses: {
				'section': [ 'hide-details' ],
				'div': [ 'hide-details__title', 'hide-details__content' ],
			},
			allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes,
				'*': [ 'style' ],
				'table': [ 'border', 'cellpadding', 'cellspacing' ],
				'img': [ 'src', 'alt', 'title', 'width', 'height' ],
			},
			allowedStyles: {
				'*': {
					// Text styling
					'color': [/.*/],
					'font-size': [/.*/],
					'font-family': [/.*/],
					'font-weight': [/.*/],
					'font-style': [/.*/],
					'line-height': [/.*/],
					'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
					'text-decoration': [/.*/],
					'text-transform': [/.*/],
					'letter-spacing': [/.*/],
					'word-spacing': [/.*/],

					// Safe spacing (contained units only, supports 1-4 value shorthand)
					'margin': [/^(?:\d+(?:px|em|rem|%)\s*){1,4}$/],
					'margin-top': [/^\d+(?:px|em|rem|%)$/],
					'margin-bottom': [/^\d+(?:px|em|rem|%)$/],
					'margin-left': [/^\d+(?:px|em|rem|%)$/],
					'margin-right': [/^\d+(?:px|em|rem|%)$/],
					'padding': [/^(?:\d+(?:px|em|rem|%)\s*){1,4}$/],
					'padding-top': [/^\d+(?:px|em|rem|%)$/],
					'padding-bottom': [/^\d+(?:px|em|rem|%)$/],
					'padding-left': [/^\d+(?:px|em|rem|%)$/],
					'padding-right': [/^\d+(?:px|em|rem|%)$/],

					// Safe sizing (for inline elements)
					'width': [/^\d+(?:px|em|rem|%)$/],
					'height': [/^\d+(?:px|em|rem|%)$/],
					'max-width': [/^\d+(?:px|em|rem|%)$/],
					'max-height': [/^\d+(?:px|em|rem|%)$/],
					'min-width': [/^\d+(?:px|em|rem|%)$/],
					'min-height': [/^\d+(?:px|em|rem|%)$/],

					// Background styling (no url() allowed via regex)
					'background-color': [/.*/],
					'background': [/^(?!.*url).*$/i], // Deny url() to prevent external resources

					// Border styling
					'border': [/.*/],
					'border-top': [/.*/],
					'border-bottom': [/.*/],
					'border-left': [/.*/],
					'border-right': [/.*/],
					'border-width': [/.*/],
					'border-style': [/.*/],
					'border-color': [/.*/],
					'border-radius': [/.*/],

					// Display (safe values only - basic + flex/grid)
					'display': [/^inline$/, /^block$/, /^inline-block$/, /^none$/, /^flex$/, /^inline-flex$/, /^grid$/, /^inline-grid$/],

					// Float (contained)
					'float': [/^left$/, /^right$/, /^none$/],
					'clear': [/^left$/, /^right$/, /^both$/, /^none$/],

					// Opacity
					'opacity': [/^[0-9.]+$/],

					// Flexbox/Grid layout (safe - only affects internal layout)
					'flex-direction': [/^row$/, /^row-reverse$/, /^column$/, /^column-reverse$/],
					'flex-wrap': [/^nowrap$/, /^wrap$/, /^wrap-reverse$/],
					'justify-content': [/^flex-start$/, /^flex-end$/, /^center$/, /^space-between$/, /^space-around$/, /^space-evenly$/],
					'align-items': [/^flex-start$/, /^flex-end$/, /^center$/, /^baseline$/, /^stretch$/],
					'align-content': [/^flex-start$/, /^flex-end$/, /^center$/, /^space-between$/, /^space-around$/, /^stretch$/],
					'gap': [/^\d+(?:px|em|rem|%)$/],
					'row-gap': [/^\d+(?:px|em|rem|%)$/],
					'column-gap': [/^\d+(?:px|em|rem|%)$/],
					'grid-template-columns': [/.*/],
					'grid-template-rows': [/.*/],
					'vertical-align': [/^top$/, /^middle$/, /^bottom$/, /^baseline$/, /^text-top$/, /^text-bottom$/],

					// EXPLICITLY DENIED (not listed):
					// - position (fixed, absolute, sticky)
					// - z-index
					// - top, left, right, bottom
					// - transform
					// - overflow
					// - clip-path
					// - Any viewport units (vw, vh, vmin, vmax)
				}
			}
		});
	},

	escape(input: string): string {
		return input.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/'/g, '&apos;')
			.replace(/"/g, '&quot;');
	}
};

export default html;
