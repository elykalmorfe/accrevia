import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const SKIP = new Set(['styles/dark.css']);

const pairs = [
  [/bg-emerald-50/g, 'bg-brand-50'],
  [/bg-emerald-100/g, 'bg-brand-100'],
  [/bg-emerald-200/g, 'bg-brand-200'],
  [/bg-emerald-500/g, 'bg-brand-500'],
  [/bg-emerald-600/g, 'bg-brand-600'],
  [/bg-emerald-700/g, 'bg-brand-700'],
  [/bg-amber-50/g, 'bg-brand-50'],
  [/bg-amber-100/g, 'bg-brand-100'],
  [/bg-amber-200/g, 'bg-brand-200'],
  [/bg-amber-300/g, 'bg-brand-300'],
  [/bg-amber-400/g, 'bg-brand-400'],
  [/bg-amber-500/g, 'bg-brand-500'],
  [/bg-amber-600/g, 'bg-brand-600'],
  [/bg-amber-700/g, 'bg-brand-700'],
  [/bg-indigo-50/g, 'bg-brand-50'],
  [/bg-indigo-100/g, 'bg-brand-100'],
  [/bg-indigo-500/g, 'bg-brand-500'],
  [/bg-indigo-600/g, 'bg-brand-600'],
  [/bg-indigo-700/g, 'bg-brand-700'],
  [/bg-violet-50/g, 'bg-brand-50'],
  [/bg-violet-100/g, 'bg-brand-100'],
  [/bg-violet-500/g, 'bg-brand-500'],
  [/bg-violet-600/g, 'bg-brand-600'],
  [/bg-violet-700/g, 'bg-brand-700'],
  [/bg-purple-50/g, 'bg-brand-50'],
  [/bg-purple-100/g, 'bg-brand-100'],
  [/bg-purple-500/g, 'bg-brand-500'],
  [/bg-purple-600/g, 'bg-brand-600'],
  [/bg-purple-700/g, 'bg-brand-700'],
  [/bg-rose-50/g, 'bg-brand-50'],
  [/bg-rose-100/g, 'bg-brand-100'],
  [/bg-rose-500/g, 'bg-brand-800'],
  [/bg-rose-600/g, 'bg-brand-800'],
  [/bg-rose-700/g, 'bg-brand-900'],
  [/bg-sky-50/g, 'bg-brand-50'],
  [/bg-sky-100/g, 'bg-brand-100'],
  [/bg-sky-500/g, 'bg-brand-500'],
  [/bg-sky-600/g, 'bg-brand-600'],
  [/bg-sky-700/g, 'bg-brand-700'],
  [/bg-orange-50/g, 'bg-brand-50'],
  [/bg-orange-100/g, 'bg-brand-100'],
  [/bg-orange-500/g, 'bg-brand-500'],
  [/bg-orange-600/g, 'bg-brand-600'],
  [/bg-blue-50/g, 'bg-brand-50'],
  [/bg-blue-100/g, 'bg-brand-100'],
  [/bg-blue-500/g, 'bg-brand-500'],
  [/bg-blue-600/g, 'bg-brand-600'],
  [/bg-blue-700/g, 'bg-brand-700'],
  [/text-emerald-500/g, 'text-brand-500'],
  [/text-emerald-600/g, 'text-brand-600'],
  [/text-emerald-700/g, 'text-brand-700'],
  [/text-emerald-800/g, 'text-brand-800'],
  [/text-amber-400/g, 'text-brand-400'],
  [/text-amber-500/g, 'text-brand-500'],
  [/text-amber-600/g, 'text-brand-600'],
  [/text-amber-700/g, 'text-brand-700'],
  [/text-amber-800/g, 'text-brand-800'],
  [/text-amber-900/g, 'text-brand-900'],
  [/text-indigo-500/g, 'text-brand-500'],
  [/text-indigo-600/g, 'text-brand-600'],
  [/text-indigo-700/g, 'text-brand-700'],
  [/text-indigo-800/g, 'text-brand-800'],
  [/text-violet-500/g, 'text-brand-500'],
  [/text-violet-600/g, 'text-brand-600'],
  [/text-violet-700/g, 'text-brand-700'],
  [/text-violet-800/g, 'text-brand-800'],
  [/text-purple-500/g, 'text-brand-500'],
  [/text-purple-600/g, 'text-brand-600'],
  [/text-purple-700/g, 'text-brand-700'],
  [/text-rose-500/g, 'text-brand-700'],
  [/text-rose-600/g, 'text-brand-800'],
  [/text-rose-700/g, 'text-brand-900'],
  [/text-sky-500/g, 'text-brand-500'],
  [/text-sky-600/g, 'text-brand-600'],
  [/text-sky-700/g, 'text-brand-700'],
  [/text-sky-800/g, 'text-brand-800'],
  [/text-orange-500/g, 'text-brand-500'],
  [/text-orange-600/g, 'text-brand-600'],
  [/text-orange-700/g, 'text-brand-700'],
  [/text-blue-500/g, 'text-brand-500'],
  [/text-blue-600/g, 'text-brand-600'],
  [/text-blue-700/g, 'text-brand-700'],
  [/text-blue-800/g, 'text-brand-800'],
  [/border-emerald-/g, 'border-brand-'],
  [/border-amber-/g, 'border-brand-'],
  [/border-indigo-/g, 'border-brand-'],
  [/border-violet-/g, 'border-brand-'],
  [/border-purple-/g, 'border-brand-'],
  [/border-rose-/g, 'border-brand-'],
  [/border-sky-/g, 'border-brand-'],
  [/border-orange-/g, 'border-brand-'],
  [/border-blue-200/g, 'border-brand-200'],
  [/border-blue-300/g, 'border-brand-300'],
  [/ring-emerald-/g, 'ring-brand-'],
  [/ring-amber-/g, 'ring-brand-'],
  [/ring-indigo-/g, 'ring-brand-'],
  [/ring-violet-/g, 'ring-brand-'],
  [/ring-purple-/g, 'ring-brand-'],
  [/ring-rose-/g, 'ring-brand-'],
  [/ring-sky-/g, 'ring-brand-'],
  [/ring-orange-/g, 'ring-brand-'],
  [/ring-blue-/g, 'ring-brand-'],
  [/fill-amber-/g, 'fill-brand-'],
  [/fill-emerald-/g, 'fill-brand-'],
  [/fill-rose-/g, 'fill-brand-'],
  [/from-amber-/g, 'from-brand-'],
  [/via-amber-/g, 'via-brand-'],
  [/to-amber-/g, 'to-brand-'],
  [/from-emerald-/g, 'from-brand-'],
  [/to-emerald-/g, 'to-brand-'],
  [/from-indigo-/g, 'from-brand-'],
  [/to-indigo-/g, 'to-brand-'],
  [/from-violet-/g, 'from-brand-'],
  [/to-violet-/g, 'to-brand-'],
  [/hover:bg-emerald-/g, 'hover:bg-brand-'],
  [/hover:bg-amber-/g, 'hover:bg-brand-'],
  [/hover:bg-indigo-/g, 'hover:bg-brand-'],
  [/hover:bg-violet-/g, 'hover:bg-brand-'],
  [/hover:bg-rose-/g, 'hover:bg-brand-'],
  [/hover:text-emerald-/g, 'hover:text-brand-'],
  [/hover:text-amber-/g, 'hover:text-brand-'],
  [/hover:text-indigo-/g, 'hover:text-brand-'],
  [/hover:text-violet-/g, 'hover:text-brand-'],
  [/hover:text-rose-/g, 'hover:text-brand-'],
  [/hover:border-amber-/g, 'hover:border-brand-'],
  [/hover:border-emerald-/g, 'hover:border-brand-'],
  [/hover:border-indigo-/g, 'hover:border-brand-']
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|css)$/.test(name)) out.push(full);
  }
  return out;
}

let changedFiles = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (SKIP.has(rel)) continue;
  const text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [re, to] of pairs) next = next.replace(re, to);
  if (next !== text) {
    fs.writeFileSync(file, next);
    changedFiles += 1;
    console.log('updated', rel);
  }
}
console.log('changedFiles', changedFiles);
