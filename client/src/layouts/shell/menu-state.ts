import { reactive } from 'vue';

// Open state of the mobile "Mehr" sheet, shared so both the bottom bar and
// the menu button in the top bar (below 1024px) open the same sheet.
export const shellMenu = reactive({
  open: false,
});

export function openShellMenu(): void {
  shellMenu.open = true;
}
