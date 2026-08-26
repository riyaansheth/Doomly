# Mobile

Mobile is the design target. Desktop is the same 600px column with more air around it.
**Check 390×844 first**; if it works there it works everywhere.

---

## The two rules that are functional, not aesthetic

### 1. Nothing focusable below 16px

iOS Safari zooms the entire page when a focused input is smaller than 16px, and does not
zoom back out. Every `input`, `select` and `textarea` is 16px minimum.

This was shipped wrong once — controls were 14px, and every date picker and dropdown
yanked the page.

### 2. Nothing tappable below 44×44pt

Apple's floor. Enforced with `min-height: 44px` on buttons, links, inputs and selects.

The trap is a control that *looks* big because its parent has padding:

```css
/* wrong — anchor is 23px inside a 52px row */
.subjects li { padding: 14px 16px; }
.row-link    { display: flex; }

/* right — the anchor is the row */
.subjects li:has(> .row-link) { padding: 0; }
.row-link { padding: 14px 16px; min-height: 52px; }
```

**One documented exception:** `.tab` at 40px, because Apple's own segmented controls are
32pt.

---

## Safe areas

```css
:root { --tabbar: calc(52px + env(safe-area-inset-bottom)); }

main       { padding: calc(20px + env(safe-area-inset-top)) 16px calc(var(--tabbar) + 24px); }
.tabs      { top: calc(12px + env(safe-area-inset-top)); }
.toggle    { top: calc(12px + env(safe-area-inset-top)); }
.card      { padding: calc(62px + env(safe-area-inset-top)) 16px var(--tabbar); }
.sheet     { height: calc(100dvh - 62px - env(safe-area-inset-top) - var(--tabbar) - 8px); }
.tabbar    { padding-bottom: env(safe-area-inset-bottom); }
```

Requires `viewportFit: 'cover'` in the Next `viewport` export, or the insets are all zero.

**Any new fixed or full-height element must account for both insets and `--tabbar`.** The
failure mode is invisible on a laptop and fatal on a phone: buttons sitting under the tab
bar cannot be tapped at all.

---

## Touch behaviour

```css
button, a, select, label, .opt, .tab, .tabbar-item {
  -webkit-tap-highlight-color: transparent;   /* no grey flash box */
  touch-action: manipulation;                 /* no 300ms double-tap delay */
  -webkit-user-select: none; user-select: none;
}
input, textarea, .prose, .why, .code, .sheet h2 {
  -webkit-user-select: text; user-select: text;
}
```

Controls are not selectable; **card prose is.** Long-pressing a definition to copy it is a
reasonable thing to want, and disabling selection globally would break it.

---

## Viewport

```ts
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F2F7' },
    { media: '(prefers-color-scheme: dark)',  color: '#000000' },
  ],
}
```

**`maximumScale` is deliberately unset.** Capping zoom is an accessibility regression;
people who need to zoom must be able to.

---

## Units

| use | not |
|---|---|
| `100dvh` for full-height | `100vh` — ignores browser chrome, cuts the card off |
| `dvh` throughout | `svh` / `lvh` — the wrong one is wrong half the time |
| `clamp()` for the card title | fixed px — it must survive 320px width |
| `px` for everything else | `rem` — no root-size scaling here, `rem` adds indirection for nothing |

---

## PWA icons

Two crops of one artwork, because the platforms want opposite things.

| file | crop | why |
|---|---|---|
| `favicon.png` | squircle, transparent margin | macOS-style icon, correct in a browser tab |
| `apple-touch-icon.png` (180) | full-bleed | iOS applies its own mask |
| `icon-192`, `icon-512` | full-bleed | Android maskable |

**Never hand iOS a pre-rounded icon.** It rounds the rounded corners again, leaving a small
shape floating in a thick border.

`manifest.webmanifest` sets `display: standalone`, `orientation: portrait`, and theme and
background colour `#0B4FF0` — sampled from the icon so the splash and status bar don't
clash with it.

---

## Push, and why the manifest is load-bearing

**iOS delivers web push only to sites added to the home screen.** The manifest is not
decoration; without it, exam reminders can never fire on an iPhone. Both Add to Home
Screen and push also require HTTPS — neither works over `http://localhost` or on a LAN IP,
so they can only be verified on the deployed site.

---

## Testing checklist

Before calling any UI change done:

1. **390×844**, both themes
2. No horizontal overflow: `document.documentElement.scrollWidth === innerWidth`
3. Every control ≥44px tall and ≥16px font — script it, don't eyeball it
4. On `/feed`: footer buttons clear the tab bar; snap still stops one card at a time
5. Rotate to landscape — nothing should be unreachable
