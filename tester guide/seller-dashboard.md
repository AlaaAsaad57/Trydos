# Title

Seller Dashboard Manual Tester Guide - Full Scenario Coverage

## Purpose

Provide complete manual QA coverage for Seller Dashboard related flows, including access entry, store selection, permission-based tab visibility, and all operational tabs (Products, Boutiques, Permissions, Users, Orders).

## Scope

- Seller entry point from Settings.
- Store Selection page: `/{lang}/sellerProfile`.
- Seller Dashboard page: `/{lang}/sellerProfile/sellerDashboard/{sellerId}`.
- Permission-driven visibility and authorization behavior.
- Products, Boutiques, Permissions, Users, and Orders flows.
- Error handling, retry behavior, empty/loading states, and critical edge paths.

## Out Of Scope

- Customer storefront buying flow.
- Payment gateway correctness.
- Backend data migration or DB integrity validation beyond API response checks.
- SEO, sitemap, and crawler behavior.

## Assumptions

- Environment has active seller shops, products, boutiques, users, roles, and orders.
- QA can log in with multiple accounts: no-access user, limited-permission user, super admin.
- API endpoints are reachable and test data can be reset.
- Push/update channel for order updates is available in test env.

## Preconditions

1. Build is deployed and reachable.
2. Tester has valid credentials for these roles:
   - user with no shop
   - user with shop and limited permissions
   - `SUPER_ADMIN` user
3. At least one seller has pagination-worthy data in products/users/orders.
4. Browser devtools network panel is available for API validation.

## Environment And Build

- App environment: staging (or specified QA environment).
- Browser coverage: latest Chrome, Safari, and Firefox.
- Device coverage:
  - desktop: 1366x768 and 1920x1080
  - mobile: 390x844 and 412x915
- Locale coverage: one LTR and one RTL locale, for example `sy-en` and `lb-ar`.

## Test Data

- Seller A:
  - products: active, inactive, no-image, and enough items for pagination
  - boutiques: with and without image, long description
  - users: mixed role assignments
  - orders: mixed statuses and remaining-time variants
- Seller B:
  - empty datasets for products/boutiques/users/orders
- Role data:
  - `SUPER_ADMIN`
  - read-only product role
  - order-only role
  - employee management role

## Execution Steps

1. Validate access-entry and store selection scenarios.
2. Enter Seller Dashboard for each role profile.
3. Validate tab visibility against permissions.
4. Execute tab-specific scenarios in this order: Products, Boutiques, Permissions, Users, Orders.
5. Execute negative, security, and resilience scenarios.
6. Capture evidence and defects using the logging section below.

## Test Scenarios

| ID     | Scenario                                             | Precondition                                | Steps                                | Expected Result                                                               | Severity If Failed |
| ------ | ---------------------------------------------------- | ------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | ------------------ |
| SD-001 | Settings shows seller entry button for eligible user | User belongs to one or more shops           | Open Settings                        | `Go to Seller Dashboard` is visible                                           | Major              |
| SD-002 | Settings shows become-seller CTA for ineligible user | User has no shops                           | Open Settings and tap CTA            | `Become A Seller At Trydos` shown and modal opens                             | Major              |
| SD-003 | Store Selection loads assigned shops                 | Eligible user logged in                     | Open `/{lang}/sellerProfile`         | Table shows Shop Name, Seller ID, actions                                     | Major              |
| SD-004 | Store Selection empty state                          | User with no assigned shops                 | Open Store Selection                 | `No shops available` message shown                                            | Minor              |
| SD-005 | Store Selection loading state                        | Slow network simulation                     | Open page                            | Spinner and loading text shown before data appears                            | Minor              |
| SD-006 | Enter shop routes to dashboard                       | Store exists in list                        | Click `Enter`                        | Navigate to `/{lang}/sellerProfile/sellerDashboard/{sellerId}`                | Critical           |
| SD-007 | Leave shop modal appears                             | Store exists in list                        | Click `Leave`                        | Confirmation modal appears                                                    | Major              |
| SD-008 | Confirm leave removes shop                           | Leave modal open                            | Confirm leave                        | Shop removed from list without full reload                                    | Major              |
| SD-009 | Cancel leave keeps shop                              | Leave modal open                            | Cancel leave                         | Modal closes and shop remains                                                 | Minor              |
| SD-010 | Leave API failure handling                           | Force leave API error                       | Confirm leave                        | Error message visible in modal; no unintended removal                         | Major              |
| SD-011 | Dashboard header and navigation elements             | Entered dashboard                           | Observe header and drawer            | Back bar, shop name, seller ID, drawer toggle shown                           | Minor              |
| SD-012 | Drawer tab visibility follows permissions            | Test each role profile                      | Open drawer                          | Only permitted tabs are visible                                               | Critical           |
| SD-013 | Unauthorized direct tab access blocked               | User lacks module permission                | Open restricted tab route/action     | Access denied state appears; no protected data leakage                        | Critical           |
| SD-014 | Products tab basic load                              | User has product permission                 | Open Products tab                    | Grid loads with product cards                                                 | Major              |
| SD-015 | Products card content and badge correctness          | Products available                          | Validate multiple cards              | Image/name/category/price/stock/status shown correctly                        | Major              |
| SD-016 | Products missing image fallback                      | Product without image exists                | Open Products tab                    | `No Image` placeholder appears                                                | Minor              |
| SD-017 | Products empty state                                 | Seller with no products                     | Open Products tab                    | `No products found` message shown                                             | Minor              |
| SD-018 | Products API failure and retry                       | Force API error once                        | Open tab then click `Retry`          | Error shown, retry re-fetches successfully                                    | Major              |
| SD-019 | Products pagination controls                         | Multiple product pages exist                | Move next and previous               | Correct page index updates; disabled at boundaries                            | Major              |
| SD-020 | Boutiques tab basic load                             | User has boutique permission                | Open Boutiques tab                   | Boutique cards load                                                           | Major              |
| SD-021 | Boutiques card formatting                            | Boutiques with long desc                    | Validate card text                   | Description truncates around 100 chars with ellipsis                          | Minor              |
| SD-022 | Boutiques missing image fallback                     | Boutique without image exists               | Open tab                             | `No Image` placeholder shown                                                  | Minor              |
| SD-023 | Boutiques empty and error states                     | Seller with none / forced API error         | Open tab and retry flow              | Empty message and recoverable retry behavior work                             | Major              |
| SD-024 | Permissions tab super admin banner                   | `SUPER_ADMIN` user                          | Open Permissions tab                 | Full-access banner appears                                                    | Minor              |
| SD-025 | Permissions grouped and color-coded                  | User with mixed permissions                 | Open Permissions tab                 | Groups render and action colors map correctly                                 | Minor              |
| SD-026 | Permissions empty state and retry                    | No permission payload / forced error        | Open tab and retry                   | Empty state or error+retry handled correctly                                  | Major              |
| SD-027 | Users tab visibility gating                          | Compare role profiles                       | Open drawer                          | Users tab only for eligible permissions                                       | Critical           |
| SD-028 | Add User form validation                             | Users tab open                              | Try submit with missing fields       | Add button disabled until required fields valid                               | Major              |
| SD-029 | Role search debounce behavior                        | Add user form open                          | Type role query quickly              | Debounced API search (~400ms), dropdown results update                        | Minor              |
| SD-030 | Add user success flow                                | Valid phone and role selected               | Submit form                          | Success message shown and form reset                                          | Major              |
| SD-031 | Add user API failure                                 | Force create-user error                     | Submit form                          | Error visible; user not added                                                 | Major              |
| SD-032 | Users table load and empty state                     | Mixed seller datasets                       | Open Users tab                       | Correct rows or `No users found` message                                      | Minor              |
| SD-033 | Super admin change role flow                         | Login as `SUPER_ADMIN`                      | Change role from row action          | Role updated and reflected immediately                                        | Critical           |
| SD-034 | Change role dropdown close behavior                  | Role dropdown opened                        | Click outside and press Escape       | Dropdown closes correctly                                                     | Minor              |
| SD-035 | Super admin delete user flow                         | Non-self target user exists                 | Click delete and confirm action path | User removed and list refreshes correctly                                     | Critical           |
| SD-036 | Self leave-shop action in users list                 | Current user row visible                    | Click `Leave Shop` on self row       | Leave action succeeds and access updates                                      | Major              |
| SD-037 | Users load-more pagination                           | Many users exist                            | Click `Load more`                    | Next set of users appended without duplicates                                 | Major              |
| SD-038 | Orders list initial load                             | User has order permission                   | Open Orders tab                      | Orders load with filters visible                                              | Major              |
| SD-039 | Orders filter behavior                               | Orders with mixed statuses exist            | Switch each filter tab               | Correct filtered list shown and selected tab highlighted                      | Major              |
| SD-040 | Orders list card fields correctness                  | Orders exist                                | Validate card fields                 | Timestamp, remaining time, status, item count, amount, images shown correctly | Major              |
| SD-041 | Orders list empty/error/retry                        | Empty dataset / forced error                | Open tab and retry                   | Proper empty state and recoverable retry flow                                 | Major              |
| SD-042 | Open order detail page                               | At least one order in list                  | Click order card                     | Navigates to detail with correct header and stats                             | Critical           |
| SD-043 | Order detail progress cards                          | Detail page open                            | Validate pipeline and summary values | Confirm/pack/collect progression and counts are accurate                      | Major              |
| SD-044 | Confirm item action                                  | Pending item exists                         | Click `Confirm & Start Backing`      | Item moves to confirmed state with loading feedback                           | Critical           |
| SD-045 | Cancel item action                                   | Pending item exists                         | Click `Cancel`                       | Item removed or canceled per backend behavior                                 | Critical           |
| SD-046 | Pack item action                                     | Confirmed item exists                       | Click `Packed`                       | Item moves to packed state with loading feedback                              | Critical           |
| SD-047 | Ready-to-collect read-only state                     | Packed item exists                          | Validate action controls             | `Ready To Collect` shown as non-editable state                                | Major              |
| SD-048 | Real-time order creation update                      | Push/update channel active                  | Create new order externally          | New order appears near top without manual refresh                             | Major              |
| SD-049 | Real-time order modification update                  | Existing order changed externally           | Trigger update event                 | List/detail reflects latest state                                             | Major              |
| SD-050 | Direct URL unauthorized access                       | Invalid session or unauthorized sellerId    | Open dashboard URL directly          | Redirect or protected error state without data leak                           | Critical           |
| SD-051 | Permission fallback behavior                         | Simulate permission load failure with cache | Enter dashboard                      | Cached permissions used when available                                        | Major              |
| SD-052 | Rapid tab switching stability                        | Multiple tabs permitted                     | Switch tabs quickly                  | No crash, stale-data corruption, or duplicate loaders                         | Major              |

## Expected Results

- All permitted modules are visible and functional per assigned permissions.
- Restricted modules remain hidden or blocked with safe messaging.
- CRUD-like user and order actions provide deterministic visual feedback.
- Loading, empty, and failure states are recoverable and understandable.
- No protected data appears for unauthorized users or invalid seller IDs.

## Negative And Edge Cases

- Invalid `sellerId` in URL.
- Expired session during in-tab action.
- Retry after transient network failure.
- Repeated rapid clicks on action buttons (confirm/pack/delete).
- Concurrent updates from two sessions on same seller/order.
- Zero inventory or no-content states across all tabs.
- Long strings and unusual characters in names/descriptions.

## API/Network Validation

- Validate status codes for success, validation failures, unauthorized, forbidden, and server error cases.
- Confirm request payload integrity for:
  - leave shop
  - add user
  - change role
  - delete user
  - order item state actions
- Confirm UI messaging aligns with API outcome.
- Validate retry does not duplicate writes.
- Confirm pagination requests increment correctly and do not duplicate rows.

## UI/Responsive Validation

- Validate drawer open/close and touch targets on mobile resolutions.
- Validate table/card readability at desktop and mobile widths.
- Validate RTL and LTR layout consistency for labels, numeric values, and action buttons.
- Ensure loading and error states are readable without overlap or clipping.

## Security/Permission Validation

- Confirm tab rendering is permission-based, not only UI-toggle based.
- Attempt restricted actions via direct URL/navigation and verify denial behavior.
- Confirm non-super-admin users cannot add/delete/change roles if restricted.
- Verify no sensitive identifiers or unauthorized records are exposed in blocked states.

## Performance/Latency Checks

- Under 3G/slow network, verify skeleton/spinner appears quickly and app remains interactive.
- Tab switching should not trigger unnecessary repeated fetches for already loaded data (where caching is expected).
- Large lists should paginate without UI freeze or duplicate render artifacts.

## Logging And Evidence To Capture

- For each failed scenario capture:
  - scenario ID
  - environment and build version
  - user role and seller ID
  - exact URL
  - request/response snapshot from network panel
  - screenshot or screen recording
  - reproduction steps and frequency

## Severity/Priority Guidance

- Critical:
  - unauthorized access/data exposure
  - wrong order state transition
  - destructive user actions affecting wrong account
  - dashboard inaccessible for valid seller users
- Major:
  - broken permission mapping
  - failed create/update/delete core operations
  - broken pagination/filtering
- Minor:
  - styling, truncation, low-impact message/content defects

## Exit Criteria

- All Critical scenarios pass.
- No open Major defects in core flows (access, permissions, users, orders).
- Minor defects are documented and accepted.
- Regression sanity completed for all tabs after fixes.

## Risks And Notes

- Real-time order updates can be environment-sensitive; verify channel health before raising defects.
- Role and permission seed data quality directly impacts test reliability.
- If backend behavior intentionally differs from this guide, update this document and retest impacted scenarios.
