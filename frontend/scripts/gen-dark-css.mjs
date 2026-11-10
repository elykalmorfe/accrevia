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
  brand: ['59 130 246', '96 165 250', '147 197 253'],
  blue: ['59 130 246', '96 165 250', '147 197 253'],
  indigo: ['99 102 241', '129 140 248', '165 180 252'],
  violet: ['139 92 246', '167 139 250', '196 181 253'],
  purple: ['168 85 247', '192 132 252', '216 180 254'],
  sky: ['14 165 233', '56 189 248', '125 211 252'],
  cyan: ['6 182 212', '34 211 238', '103 232 249'],
  teal: ['20 184 166', '45 212 191', '94 234 212'],
  emerald: ['16 185 129', '52 211 153', '110 231 183'],
  green: ['34 197 94', '74 222 128', '134 239 172'],
  success: ['34 197 94', '74 222 128', '134 239 172'],
  amber: ['245 158 11', '251 191 36', '252 211 77'],
  warning: ['245 158 11', '251 191 36', '252 211 77'],
  gold: ['245 158 11', '251 191 36', '252 211 77'],
  yellow: ['234 179 8', '250 204 21', '253 224 71'],
  orange: ['249 115 22', '251 146 60', '253 186 116'],
  rose: ['244 63 94', '251 113 133', '253 164 175'],
  red: ['239 68 68', '248 113 113', '252 165 165'],
  danger: ['239 68 68', '248 113 113', '252 165 165'],
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
