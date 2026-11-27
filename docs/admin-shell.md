# Responsive administration shell

## Behavior

All routes rendered by AdminLayoutComponent share one shell. The header is naturally sticky; ResizeObserver measures its actual height for the toolbar/sidebar offset. Sidebar width and grid column use the same CSS custom property, so content cannot retain an obsolete left offset.

- The content Administration toolbar appears only while the sidebar is closed; an open sidebar provides its own close control.
- Desktop (1024px and above): hide/show, smooth 180ms column transition, independent scrollable menu, content reclaims the hidden column.
- Drag the sidebar's right edge to resize, from 224px to 384px in 8px increments; default 280px.
- Keyboard: focus the divider, Left/Right changes 8px, Shift changes 32px, Home/End chooses the limits. Double-click resets width.
- Browser preference key: `farmstay.admin.sidebar.v1`, containing width/open only. Corrupt or unavailable storage falls back safely.
- Below 1024px: overlay drawer, backdrop dismissal, Escape, navigation dismissal, background inert/scroll lock, CDK focus trap and initial focus. Desktop preference survives breakpoint changes; mobile open state is not persisted.
- Reduced-motion preference disables transitions. Orange/Blue tokens and English/Marathi labels are retained.

The existing public/admin header switches to its compact navigation below 1200px to avoid smaller-desktop overflow. Its menu uses Angular state rather than relying on Bootstrap collapse actions. Utility spacing is adjusted at 320px.

Accounts container queries had invalid missing whitespace between the container name and query. Correcting these allows cards/forms to respond to their available content width, including sidebar resizing. Wide data tables scroll inside panels. Main page content is not hidden to mask overflow.

## Source map

- `src/app/layouts/admin-layout/admin-layout.component.{ts,html,css}`: shell geometry, persisted state, resize, drawer and measured header.
- `src/app/features/admin/admin-sidebar/admin-sidebar.component.css`: fills the shell-owned panel instead of hardcoding a second width/top offset. Existing menu/RBAC/routes stay in the sidebar component.
- `src/app/shared/components/header/header.component.{ts,html,css}`: compact responsive header/menu behavior.
- `src/app/features/admin/accounts/accounts.css`: functional content-container queries.
- `src/styles/admin-ui.css`: routed-host sizing and local table scrolling.
- `src/app/core/i18n/mr.json`: new shell control translations.

## Verification

15 focused Karma/ChromeHeadless tests passed: bounds/persistence, real collapse state, pointer/keyboard resize, mobile drawer, route dismissal, scroll restoration, header measurement, sidebar route compatibility and header toggle. Specs are beside their components.

`scripts/verify-admin-shell.cjs` exercises the running Angular application in a separate headless Chrome context. It intercepts API calls with read-only fixtures, so it does not alter real records or the user's login/browser profile. The fixtures do not establish backend business-flow correctness.

- 14 representative administration routes at 1440, 1280, 1100, 1024, 768, 375 and 320px: 98 page states, plus four interaction/resize states; 102 checks passed.
- Supplemental Accounts/theme run: 8 states passed, including Blue theme, Marathi desktop/mobile, utility controls at 320px, collapse persistence, pointer/keyboard resize and repeated Tab focus staying inside the drawer.
- Geometry assertions check document horizontal overflow, header/content separation and sidebar/content non-overlap. Desktop/mobile screenshots were visually inspected.
- Screenshots and geometry evidence: `output/sidebar` and `output/sidebar-theme` (synthetic UI data only).
- Development and final production builds passed. Production uses the existing Google Fonts inlining step; network access is required for uncached fonts. Existing CSS optimization warnings remain. No Angular major or package dependency changed.

Run the script with an available `playwright` module, or set `FARMSTAY_PLAYWRIGHT_MODULE` to the bundled runtime's `playwright/index.js`. `SHELL_WIDTHS`, `SHELL_ROUTE`, `SHELL_OUTPUT` and `SHELL_THEMES=1` select focused checks. Node may require `--preserve-symlinks` for the WindowsApps bundled module location.

There are no backend/API/database migrations for this UI change. Full authenticated financial training remains separate from these fixture-based layout tests.
