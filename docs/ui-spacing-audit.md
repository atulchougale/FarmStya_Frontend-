# UI spacing verification

The shared form defaults use an 8px label gap. Field/action rows use an 8px gap and stack on small screens. Deliberately joined controls, such as password visibility buttons and phone prefixes, retain their existing layout.

Corrections include the assisted booking customer lookup and OTP form, admin identity upload labels, gallery category filter, verification resend actions, and login OTP secondary actions. Login OTP secondary actions have a minimum 40px height.

## Verification

- Main audit: 252 rendered states across desktop (1440px), tablet (768px), and mobile (375px).
- Checkout and discount form: 6 additional states.
- Refund lookup, profile contact verification, and mobile OTP login: 20 additional states.
- Total: 46 routes, 278 rendered states, no detected spacing findings, horizontal overflow, or page errors.
- Production Angular build passed. Existing CSS optimization warnings remain.
- `git diff --check` passed.

The automated checks use isolated headless Chrome and intercepted API fixtures. They do not submit real bookings, send OTPs, or post financial transactions. These checks cover the rendered fixture states, rather than every possible data or provider response.

The verification script is `scripts/audit-ui-spacing.cjs`. Set `FARMSTAY_PLAYWRIGHT_MODULE` to the available Playwright module path and run it with `node --preserve-symlinks`. Optional environment variables include `SPACING_WIDTHS`, `SPACING_ROUTE`, `SHELL_OUTPUT`, and `SPACING_STRICT=1`.
