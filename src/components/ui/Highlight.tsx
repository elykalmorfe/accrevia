import React from 'react';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function Highlight({ text, terms }: {text: string;terms: string[];}) {
  const clean = terms.filter((t) => t.length > 1).sort((a, b) => b.length - a.length).map(escapeRegExp);
  if (!clean.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${clean.join('|')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
      i % 2 === 1 ?
      <mark key={i} className="rounded-sm bg-gold-100 px-0.5 text-ink">
            {part}
          </mark> :

      <React.Fragment key={i}>{part}</React.Fragment>

      )}
    </>);

}