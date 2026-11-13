import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Generates src/styles/dark.css for the colour utilities currently used in src/.
// Run from the frontend folder (`npm run gen:dark`) after adding new hard-coded colour classes.

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(p)) acc.push(readFileSync(p, 'utf8'));
  }
  return acc;
}
const used = new Set(walk(join(process.cwd(), 'src')).join('\n').match(/[\w:/.-]+/g));

const D = ':where(.dark)';
const esc = (c) => c.replace(/[:/]/g, (m) => '\\' + m);
const ALPHAS = [10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 95];

const palette = {
  // Institutional blue (#005A9C): soft fill, mid accent, light text on dark surfaces.
  brand: ['0 90 156', '61 143 199', '124 179 220'],
  blue: ['0 90 156', '61 143 199', '124 179 220'],
  indigo: ['0 90 156', '61 143 199', '124 179 220'],
  violet: ['0 90 156', '61 143 199', '124 179 220'],
  purple: ['0 90 156', '61 143 199', '124 179 220'],
  sky: ['0 90 156', '61 143 199', '124 179 220'],
  cyan: ['0 90 156', '61 143 199', '124 179 220'],
  teal: ['0 74 130', '26 116 181', '124 179 220'],
  emerald: ['0 90 156', '61 143 199', '124 179 220'],
  green: ['0 90 156', '61 143 199', '124 179 220'],
  success: ['0 90 156', '61 143 199', '124 179 220'],
  amber: ['0 74 130', '26 116 181', '124 179 220'],
  warning: ['0 74 130', '26 116 181', '124 179 220'],
  gold: ['0 74 130', '26 116 181', '124 179 220'],
  yellow: ['0 74 130', '26 116 181', '124 179 220'],
  orange: ['0 74 130', '26 116 181', '124 179 220'],
  rose: ['0 59 104', '61 143 199', '124 179 220'],
  red: ['0 59 104', '61 143 199', '124 179 220'],
  danger: ['0 59 104', '61 143 199', '124 179 220'],
};

const out = [];
const rule = (selectors, body) => {
  const kept = selectors.filter((s) => {
    const cls = s.match(/\.((?:\\.|[\w-])+)(?::hover)?(?: >.*)?$/)?.[1]?.replace(/\\/g, '');
    return cls && used.has(cls);
  });
  // Paper previews marked `.light-island` keep their light colours in dark mode.
  const island = kept.map((s) => s.replace(/(\.(?:\\.|[\w-])+)((?::hover)?)((?: >.*)?)$/, '$1:not(:where(.light-island, .light-island *))$2$3'));
  if (island.length) out.push(`${island.join(',\n')} {\n  ${body}\n}`);
};

/** Selectors for a utility across its base, hover and group-hover forms (with optional opacity variants). */
function sel(cls, { variants = ['', 'hover', 'group-hover'], alphas = false } = {}) {
  const names = [cls, ...(alphas ? ALPHAS.map((a) => `${cls}/${a}`) : [])];
  const list = [];
  for (const v of variants) {
    for (const n of names) {
      if (!v) list.push(`${D} .${esc(n)}`);
      else if (v === 'hover') list.push(`${D} .${esc('hover:' + n)}:hover`);
      else list.push(`${D} .group:hover .${esc('group-hover:' + n)}`);
    }
  }
  return list;
}

out.push('/* Generated dark-theme overrides for hard-coded light utilities. Light mode is untouched. */');

// Surfaces
rule(sel('bg-white', { variants: [''] }), 'background-color: rgb(var(--surface));');
for (const a of [50, 60, 70, 80, 85, 90, 95]) {
  rule([`${D} .${esc(`bg-white/${a}`)}`, `${D} .${esc(`hover:bg-white/${a}`)}:hover`], `background-color: rgb(var(--surface) / ${a / 100});`);
}
rule([`${D} .${esc('hover:bg-white')}:hover`], 'background-color: rgb(var(--surface));');
rule([`${D} .from-white`], '--tw-gradient-from: rgb(var(--surface)) var(--tw-gradient-from-position);');
rule([`${D} .to-white`], '--tw-gradient-to: rgb(var(--surface)) var(--tw-gradient-to-position);');
rule([`${D} .via-white`], '--tw-gradient-stops: var(--tw-gradient-from), rgb(var(--surface)) var(--tw-gradient-via-position), var(--tw-gradient-to);');
rule([`${D} .border-white`, `${D} .${esc('border-white/80')}`], 'border-color: rgb(var(--surface));');
rule([`${D} .ring-white`], '--tw-ring-color: rgb(var(--surface));');
rule([`${D} .bg-ink`], 'background-color: rgb(51 65 85);');
rule([`${D} .${esc('bg-ink/40')}`], 'background-color: rgb(2 6 23 / 0.6);');
rule([`${D} .${esc('bg-ink/50')}`], 'background-color: rgb(2 6 23 / 0.7);');

// Slate neutrals
const slateBg = { 50: 0.05, 100: 0.09, 200: 0.15, 300: 0.25 };
for (const [shade, alpha] of Object.entries(slateBg)) {
  rule(sel(`bg-slate-${shade}`, { alphas: true }), `background-color: rgb(148 163 184 / ${alpha});`);
}
const slateText = { 950: 'var(--ink)', 900: 'var(--ink)', 800: 'var(--ink)', 700: '203 213 225', 600: '148 163 184', 500: '148 163 184', 400: '100 116 139', 300: '71 85 105', 200: '51 65 85' };
for (const [shade, color] of Object.entries(slateText)) {
  const value = color.startsWith('var') ? `rgb(${color})` : `rgb(${color})`;
  rule(sel(`text-slate-${shade}`), `color: ${value};`);
}
const slateBorder = { 100: 'line-subtle', 200: 'line', 300: 'line-strong' };
for (const [shade, token] of Object.entries(slateBorder)) {
  rule(sel(`border-slate-${shade}`, { alphas: true }), `border-color: rgb(var(--${token}));`);
  rule([`${D} .${esc(`divide-slate-${shade}`)} > :not([hidden]) ~ :not([hidden])`], `border-color: rgb(var(--${token}));`);
}

// Pale tints and dark text shades of every accent colour
for (const [name, [base, light400, light300]] of Object.entries(palette)) {
  rule(sel(`bg-${name}-50`, { alphas: true }), `background-color: rgb(${base} / 0.1);`);
  rule(sel(`bg-${name}-100`, { alphas: true }), `background-color: rgb(${base} / 0.16);`);
  rule(sel(`bg-${name}-200`, { alphas: true }), `background-color: rgb(${base} / 0.24);`);
  rule(sel(`border-${name}-100`, { alphas: true }), `border-color: rgb(${base} / 0.2);`);
  rule(sel(`border-${name}-200`, { alphas: true }), `border-color: rgb(${base} / 0.3);`);
  rule(sel(`border-${name}-300`, { alphas: true }), `border-color: rgb(${base} / 0.45);`);
  rule(sel(`text-${name}-600`), `color: rgb(${light400});`);
  rule(
    ['700', '800', '900', '950'].flatMap((s) => sel(`text-${name}-${s}`, { alphas: true })),
    `color: rgb(${light300});`,
  );
  const fromNames = [`from-${name}-50`, ...ALPHAS.map((a) => `from-${name}-50/${a}`)];
  rule(fromNames.map((n) => `${D} .${esc(n)}`), `--tw-gradient-from: rgb(${base} / 0.1) var(--tw-gradient-from-position);`);
  const toNames = [`to-${name}-50`, ...ALPHAS.map((a) => `to-${name}-50/${a}`)];
  rule(toNames.map((n) => `${D} .${esc(n)}`), `--tw-gradient-to: rgb(${base} / 0.08) var(--tw-gradient-to-position);`);
  const viaNames = [`via-${name}-50`, ...ALPHAS.map((a) => `via-${name}-50/${a}`)];
  rule(
    viaNames.map((n) => `${D} .${esc(n)}`),
    `--tw-gradient-stops: var(--tw-gradient-from), rgb(${base} / 0.08) var(--tw-gradient-via-position), var(--tw-gradient-to);`,
  );
}

writeFileSync(join(process.cwd(), 'src', 'styles', 'dark.css'), out.join('\n\n') + '\n');
console.log(`dark.css: ${out.length} rules`);
