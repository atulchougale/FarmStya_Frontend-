# Accounts navigation

`/admin/accounts` is the Accounts menu, opened by the administration sidebar. The old `/admin/accounts/overview` URL continues to open the dashboard.

The menu groups quick actions and transaction lists first, then masters, financial years/periods, reconciliation/review, and reporting. Create shortcuts open the form directly. Master cards open their list first.

## Separate pages

- Lists retain their existing URLs: `ledgers`, `vendors`, `money-accounts`, `masters`, `assets`, `recurring`, and `statements`.
- Create: `/admin/accounts/{area}/new`.
- View: `/admin/accounts/{area}/{id}/view`.
- Edit: `/admin/accounts/{area}/{id}/edit`, except assets and statements, which retain their controlled actions.
- Settings remains its own configuration page.
- Voucher creation: `/admin/accounts/vouchers/new?type=Journal|Income|Expense|VendorBill|VendorPayment`.
- Vendor bills retain `/admin/accounts/payables`; `/admin/accounts/vendor-bills` redirects there.
- Vendor payments have a dedicated `/admin/accounts/vendor-payments` list, filtered by voucher type on the backend before pagination.
- Reports retain `/admin/accounts/reports` and 14 separate `/admin/accounts/reports/{report}` pages, with filters and PDF/Excel exports.

List pages do not embed creation forms. Save and Cancel return to the corresponding list. Read-only master details disable the form and do not offer Save. Protected defaults cannot be edited. Existing accounting posting, period actions, asset actions and reconciliation rules remain in place.

The shared Accounts breadcrumb provides a parent-list link where appropriate and Back to Accounts. The horizontal all-menu navigation and footer shortcuts were removed in favour of the menu page.

## Access and data

Create/edit route guards enforce the same Accounts permission required by the corresponding feature. Quick actions requiring that permission are hidden for view-only users. API access remains authoritative.

Single-record master pages use the optional `Id` filter on the existing paged query. The filter is applied server-side alongside farmhouse scope (or authorised global master scope); the UI does not scan pages to locate a record. Invalid nonpositive IDs are rejected. No database migration is required.

## Verification

- `scripts/verify-accounts-navigation.cjs`: 83 assertions; isolated Chrome with mocked APIs, no real financial writes. Checks menu routes, list/form separation, save navigation, active boolean payload, edit/view/protected defaults, all report pages, responsive overflow at 1440/768/375px, Blue theme, Marathi and permission redirects.
- Accounts backend verification: 54 tests passed in a disposable `FSAccounts_Test_*` database, including exact tenant-scoped ID lookup and Vendor Payments filtering.
- Development frontend and backend builds passed. Production Angular 19 build passed; existing CSS optimisation warnings remain. Result is recorded in `.accounts-pages-production.log`.

Screenshots are under `output/accounts-navigation`. The previously delivered training PDF describes the earlier navigation; the underlying accounting concepts still apply, while these routes describe the reorganised screens.
