# Venue Subpages Backlog

## T1 - Venue Sections and SEO
Status: Done
- Added optional venue subpages with route support for:
  - overview, rules, premises, menu, staff, jobs, ooc, media, events, network
- Added per-section metadata (title + description + OG tags) on venue pages.
- Added section toggles and section content fields in venue edit form.

## T2 - Staff from Venue Members
Status: Done
- Extended venue memberships with `showInStaff` flag.
- Added backend mapping so staff list is derived from confirmed venue members.
- Added owner fallback in staff list.
- Added staff visibility toggle in member permission editor.

## T3 - Jobs linked to Noticeboard
Status: Done
- Added optional venue relation on noticeboard items.
- Added venue-aware filtering in noticeboard list endpoint.
- Added venue selector in noticeboard edit/create form.
- Added venue-specific jobs section in venue page (types: Stellenangebot, Stellengesuch).

## T4 - Media as Real Image Relation
Status: Done
- Added optional venue relation on images.
- Added venue linking on image upload and image edit.
- Added permission checks: only users who can edit venue can link image to it.
- Added venue filter in image list endpoint.
- Added venue usage checks/unlinking in image deletion guard paths.
- Added venue media subpage rendering linked gallery images.

## T5 - API Surface and DTO updates
Status: Done
- Added new venue section fields and staff dto fields.
- Added noticeboard/image DTO relation fields for venue links.
- Added `venues/my-editable` API and client method.
- Added event venue endpoint support for `timeRange` (`upcoming`, `past`, `all`).

## T6 - Verification
Status: Done
- Server build successful (`npm run build` in `server/`).
- Client build successful (`npm run build` in `client/`) with pre-existing CSS order/minimizer warnings.

## Follow-up
Status: Pending
- Database migration scripts for new columns/relations should be added if running with schema sync disabled.
