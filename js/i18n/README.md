# i18n

Persian (`fa`) is the source language and the fallback. A missing key in another language falls back to Persian (and logs one console warning), so a half-translated language never breaks the page.

## Add a language (e.g. Arabic)

1. Copy `locales/en.js` to `locales/ar.js` and change the header:
   ```js
   I18n.register({ code: 'ar', name: 'العربية', dir: 'rtl', digits: '٠١٢٣٤٥٦٧٨٩', strings: { ... } });
   ```
2. Translate the values (keys stay the same).
3. Add one line in `index.html`, next to the other locale scripts:
   `<script src="js/i18n/locales/ar.js?v=1"></script>`

The language switcher, `<html lang/dir>` and persistence pick it up automatically.
A locale can be split across several files (they merge): `ar.js`, `ar.quests.js`, …

## Use it

| Where | How |
|---|---|
| HTML text | `<span data-i18n="tab.lab">…</span>` |
| HTML with markup / `&nbsp;` | `<p data-i18n-html="lab.resistor.note">…</p>` |
| HTML attributes | `<img data-i18n-attr="alt:char.knight; title:other.key">` |
| JS strings | `t('key')`, `t('key', { n: 3 })` for `{n}` placeholders |
| Content that keeps inline Persian | `I18n.field('quest.led_circuit.title', quest.title)` – returns the translation if there is one, otherwise the inline text |
| Numbers | `I18n.num(42)` – Persian digits in `fa`, Latin otherwise |
| Plurals / grammar | a value may be a function: `'items': ({n}) => n === 1 ? '1 item' : n + ' items'` |
| React to a switch | `I18n.onChange(lang => …)` (only fires when `I18n.config.reloadOnChange = false`) |

Static HTML keeps its Persian text inline; `fa.js` has the same strings. `test-i18n.js` checks that
they agree, that every key used in the HTML exists, and that `en` has exactly the keys `fa` has.
Run it with `node test-i18n.js`.

## Switching language

By default switching reloads the page (all JS-built UI is rebuilt in the new language; progress is in localStorage).
Set `I18n.config.reloadOnChange = false` once every module re-renders on `I18n.onChange`.
`?lang=en` in the URL selects and remembers a language.

## Layout

`dir` flips with the language. In CSS prefer logical properties (`margin-inline-start`, `inset-inline-end`,
`text-align: start`, `border-inline-start`) over `left/right`.
