# CLAUDE.md

Guidance for working in this repository. Read [ARCHITECTURE.md](ARCHITECTURE.md) for how the code fits together, including the behaviour decisions that shouldn't be changed by accident, and keep it accurate when the design changes.

## Commands

- `npm run dev`: start the Vite dev server.
- `npx vitest run`: run the tests once. `npm test` starts watch mode, which never exits.
- `npm run lint`: check style. `npm run lint:fix` corrects most problems.
- `npx tsc`: type check. It emits nothing.
- `npm run build`: type check and build to `dist/`.

Run the tests, lint, and type check before calling work finished.

## Code conventions

### TypeScript imports

Import types with their own `import type` statements, above the other imports and separated from them by one blank line. Don't use inline `type` modifiers. Lint doesn't enforce this, so check it by hand.

```ts
import type {Operation} from './operators';
import type {AngleUnit} from './scientificFunctions';

import {OPERATORS} from './operators';
```

### Structure

- Keep the DOM out of `Calculator`. It should stay testable without a browser.
- Prefer adding a table entry over adding a branch. Operators and functions are data, and `CalculatorUI.actions` is a lookup.
- Let non-finite results reach the existing error handling, rather than checking for individual cases.
- Reuse the CSS custom properties rather than writing new colour values, so every view keeps the same theme.
- Don't add device detection. Layouts respond to viewport size through media queries.
- Don't add `user-scalable=no` to the viewport tag. People need to be able to zoom.

## Common changes

### Adding a scientific key

1. Add the behaviour to the table in `src/operators.ts` or `src/scientificFunctions.ts`. Operators also need a precedence.
2. Add the button to `.calculator-keys-scientific` in `index.html`, with a `grid-area`, a `data-type`, a `value`, and a `title` naming its hotkey.
3. Place its `grid-area` in **both** scientific templates in `src/styles/main.css`: the 5 × 4 one beside the basic keys and the 6 × 3 one above them. Both are currently full, so they have to grow or lose a span.
4. Add the hotkey to `SCIENTIFIC_HOTKEYS`, and to the table in `README.md`.
5. Add engine tests and, if it has a hotkey, a UI test.

### Adding an action

Add the method to `Calculator`, an entry to `CalculatorUI.actions`, and a key or hotkey that uses it.

## Testing

- `tests/calculatorUI.test.ts` builds its own small DOM fixture rather than loading `index.html`. New elements that `CalculatorUI` requires must be added to the fixture, and a wrong `value` in `index.html` won't fail these tests. The `%` key once failed in exactly this way.
- `CalculatorUI` never removes its `window` listeners, so that test file's `afterEach` removes them. Keep that cleanup, or instances from earlier tests will handle later key presses.
- jsdom doesn't evaluate media queries or calculate layout, so the tests can't catch layout bugs. After changing `index.html` or the CSS, run the app in a real browser and press real keys.
    - Playwright isn't a project dependency. Install `playwright-core` in a temporary directory outside the repo and launch it with `channel: 'chrome'`.
    - Check both views at 320×568, 393×852, 400×400, 320×300, 852×393, 568×320, 600×581, 768×1024, and 1280×800, plus both sides of each breakpoint: 540/541px wide and 580/581px tall.
    - Check that the display and keys don't overlap, that keys keep their minimum height, and that there's no sideways scrolling. Look at screenshots too.
    - Device emulation doesn't cover notches, Safari's toolbars, or iOS pressed-key styling. Say so when reporting, unless they've been checked on a real phone.

## Git

- The default branch is `master`. Create a new branch from an up-to-date `master` before making changes, named `brian/<short-description>`.
- Commit, push, and open PRs only when asked. PR descriptions are short bullet lists.
- PRs are squash merged, so commits from a merged branch don't appear in `master`. If a branch was stacked on one that has since merged, move only its own commits with `git rebase --onto origin/master <last-merged-branch-commit> <branch>`, and check `git diff` shows the same content afterwards.

## Known gaps

These are existing behaviours, left alone so far. Don't fix them as a side effect of other work without mentioning it:

- No `font-family` is set on `body`, so the display uses the browser's default serif font while keys use the system font.
- The expression line repeats the primary display while the first number is typed, and stays empty while a new number is typed after a result.
- `lib/error.ts` and the `@lib/*` path alias aren't used yet.
