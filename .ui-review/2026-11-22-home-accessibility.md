# Homepage keyboard and assistive-technology review

Ready to ship: yes, with fixes. Three decorative preview words are exposed as buttons but do not activate with Enter; an actual screen-reader pass remains outstanding.

## Review record

- Local homepage `/`, 22 November 2026. Purpose (assumed): introduce the developer and let visitors explore work and make contact.
- Playwright with Chromium, 390 × 900 and 1280 × 900, reduced motion enabled. Captures and accessibility trees are in `a11y/`; the final index-label wording changed after those captures.
- `npm run check`: exit 0. Guarded capture: exit 0. Automated axe scan: no violations at either width after fixes. This is not a full accessibility conformance audit.
- Keyboard probes: Tab through the first 14 controls, Enter on the preview and archive folder, dialog opening, Tab, arrow navigation, Escape and focus return. The selected folder's text and expanded state updated at both widths.
- Criteria: `/Users/Admin/.agents/skills/ui-review/references/criteria.md`, especially 5 (labels), 6 (location), and 13 (focus).

## Should fix

- **Decorative previews are exposed as buttons** (criterion 5, both widths): accessibility tree reports “cosmic archive”, “interfaces” and “motion” as buttons; Enter produces no activation. This adds misleading stops for keyboard and screen-reader users. Decide whether these should be genuine operable controls with an accessible description of the preview, or plain text with the visual preview treated as decoration. This changes semantics and needs human review.

## Fixed during review

- Index dialog selection now follows Tab focus, so Arrow Down advances from the focused link rather than jumping to an earlier one. Escape returned focus to the index button in both probes. Visible focus indicators were added.
- Index trigger now has a descriptive visible name and improved contrast. The archive heading hierarchy was corrected; contact status has a live status role.

## Limits and edge cases

- Accessibility trees and automated checks are not a substitute for VoiceOver, NVDA, or another real screen reader; announcement timing and usability were not verified. No claim of WCAG conformance.
- Full keyboard walk of every route and control, touch interaction, focus appearance captures, press timing, screen magnification, throttled loading, errors, and mail-app handoff were not tested. Contact submission was not invoked.
- Loading, offline, error, success, and unusual content states were not exercised; outside the requested homepage keyboard/assistive-technology scope.

Coverage: homepage, 390 and 1280 CSS pixels, dark site theme, reduced motion, first keyboard stops, index dialog and one archive selection; no live screen-reader test or other routes.
