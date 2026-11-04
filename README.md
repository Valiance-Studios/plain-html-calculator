# plain-html-calculator

A calculator utility written in plain HTML, CSS, and TypeScript, with basic and scientific views that adapt to desktop and mobile screens.

## Getting started

```sh
npm install
npm run dev
```

Run the tests with `npm test` and check style with `npm run lint`.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) explains how the code fits together, so you can understand the engine, layouts, and deliberate behaviour choices without reading all of the source.
- [CLAUDE.md](CLAUDE.md) holds the working instructions for this repository, such as commands, code conventions, and testing steps. [Claude Code](https://claude.com/claude-code) loads it automatically so that each new session works the same way, and it's just as useful for anyone new to the code.

## Keyboard shortcuts

Digits, `.`, `+`, `-`, `*`, `/`, `%`, `=` or `Enter`, `Backspace`, and `Escape` work in every view. `M` switches between the basic and scientific views.

The scientific view adds:

| Key | Input | Key | Input |
|---|---|---|---|
| `(` `)` | Parentheses | `N` | ln |
| `^` | x<sup>y</sup> | `L` | log |
| `Shift+M` | mod | `Q` | x<sup>2</sup> |
| `S` `C` `T` | sin, cos, tan | `R` | Square root |
| `Shift+S` `Shift+C` `Shift+T` | Inverse sin, cos, tan | `Shift+R` | Cube root |
| `D` | Degrees or radians | `P` `E` | π, e |

Functions apply to the number on the display, so `9` then `√` gives `3`.
