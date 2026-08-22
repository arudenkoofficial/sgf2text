## Why

The share control was put in the form's action row, third after Convert and Copy,
where it reads as one more thing done to the game record rather than something done
to the page. It was missed on a first look at the live site.

For a visitor reading by screen reader the cost is the same mistake in another form:
the page's own actions are otherwise gathered at the top and the bottom — the language
control beside the site's name, the home screen instruction in the footer — while the
one control that hands the page to somebody else sat among the buttons that convert a
game. Reaching it meant passing through the conversion controls, and finding it meant
already knowing it was there.

## What Changes

- The share control leaves the form's action row.
- Two share controls instead of one: in the masthead beside the language control, and
  in the footer beside the home screen instruction. Both carry the same name, because
  two names for one action promise a difference that does not exist.
- Each carries a decorative mark beside its name, drawn in the page's own line idiom
  rather than borrowed from one platform's share glyph.
- The outcome of a share is announced beside the control that was pressed, rather than
  in one fixed place that is now far from at least one of them.
- **BREAKING** for the archived requirement about sharing, which states that the
  outcome is announced beside the controls that produced it and describes a single
  control in the form.

## Capabilities

### New Capabilities

None. This moves a control the page already has.

### Modified Capabilities

- `web-converter`: the sharing requirement stops describing one control in the form
  and describes two page-level controls, each announcing beside itself. The
  requirement about a message describing only what it is about gains the case of
  several notice regions, only one of which speaks at a time.

## Impact

- `web/index.html`: the button moves out of `.actions`; two new controls, the
  decorative mark, and one notice region per control.
- `web/main.ts`: the region a message is rendered into becomes a property of the
  announcement rather than a fixed node, so `announce` takes the region to speak in.
  `web/announcement.ts` keeps deciding validity and focus and learns nothing about
  position.
- `test/web-index-html.test.ts`: the markup assertions about the share control and the
  regions.
- No change to `web/share.ts`: what happens when the control is pressed is unaffected
  by where the control is.
