"""Export the accomplishment report to printable HTML and copy to Downloads."""
from pathlib import Path
import html
import re
import shutil

root = Path(__file__).resolve().parents[1]
src = root / "docs" / "ACCREVIA_FRONTEND_ACCOMPLISHMENT_REPORT.md"
md = src.read_text(encoding="utf-8")


def esc(t: str) -> str:
    return html.escape(t)


lines = md.splitlines()
out: list[str] = []
in_ul = False
in_table = False
table_rows: list[str] = []


def close_ul() -> None:
    global in_ul
    if in_ul:
        out.append("</ul>")
        in_ul = False


def flush_table() -> None:
    global in_table, table_rows
    if not table_rows:
        return
    out.append("<table>")
    for i, row in enumerate(table_rows):
        cells = [c.strip() for c in row.strip("|").split("|")]
        if i == 1 and all(re.match(r"^:?-+:?$", c.replace(" ", "")) for c in cells):
            continue
        tag = "th" if i == 0 else "td"
        out.append("<tr>" + "".join(f"<{tag}>{esc(c)}</{tag}>" for c in cells) + "</tr>")
    out.append("</table>")
    table_rows = []
    in_table = False


for raw in lines:
    line = raw.rstrip()
    if line.startswith("|") and "|" in line[1:]:
        close_ul()
        in_table = True
        table_rows.append(line)
        continue
    if in_table:
        flush_table()

    if not line.strip() or line.strip() == "---":
        close_ul()
        continue

    if line.startswith("# "):
        close_ul()
        out.append(f"<h1>{esc(line[2:])}</h1>")
        continue
    if line.startswith("## "):
        close_ul()
        out.append(f"<h2>{esc(line[3:])}</h2>")
        continue
    if line.startswith("### "):
        close_ul()
        out.append(f"<h3>{esc(line[4:])}</h3>")
        continue
    if line.startswith("#### "):
        close_ul()
        out.append(f"<h4>{esc(line[5:])}</h4>")
        continue

    if line.startswith("- "):
        if not in_ul:
            out.append("<ul>")
            in_ul = True
        item_html = esc(line[2:])
        item_html = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", item_html)
        out.append(f"<li>{item_html}</li>")
        continue

    close_ul()
    p = esc(line)
    p = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", p)
    p = re.sub(r"`(.+?)`", r"<code>\1</code>", p)
    if p.startswith("<strong>") and p.endswith("</strong>") and "Purpose:" not in line and len(line) < 40:
        out.append(f'<p class="section-label">{p}</p>')
    else:
        out.append(f"<p>{p}</p>")

close_ul()
flush_table()
body = "\n".join(out)

doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ACCREVIA Frontend Development Accomplishment Report</title>
<style>
  :root {{ --ink:#0f172a; --muted:#475569; --line:#e2e8f0; --brand:#0b6e99; --bg:#ffffff; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: "Segoe UI", Calibri, Arial, sans-serif; color: var(--ink); background: #f8fafc; margin: 0; line-height: 1.55; }}
  .page {{ max-width: 820px; margin: 24px auto; background: var(--bg); padding: 40px 48px; border: 1px solid var(--line); box-shadow: 0 8px 24px rgba(15,23,42,.06); }}
  h1 {{ font-size: 1.55rem; margin: 0 0 .35rem; color: var(--brand); }}
  h2 {{ font-size: 1.2rem; margin: 1.75rem 0 .65rem; padding-bottom: .35rem; border-bottom: 2px solid var(--brand); color: var(--ink); }}
  h3 {{ font-size: 1.05rem; margin: 1.25rem 0 .5rem; color: var(--ink); }}
  h4 {{ font-size: .95rem; margin: 1rem 0 .4rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }}
  p {{ margin: .45rem 0; color: var(--ink); }}
  p.section-label {{ margin-top: 1rem; font-size: 1rem; }}
  ul {{ margin: .4rem 0 .8rem 1.2rem; padding: 0; }}
  li {{ margin: .3rem 0; }}
  code {{ font-family: Consolas, "Courier New", monospace; background: #f1f5f9; padding: .1rem .35rem; border-radius: 4px; font-size: .9em; }}
  table {{ width: 100%; border-collapse: collapse; margin: 1rem 0 1.25rem; font-size: .92rem; }}
  th, td {{ border: 1px solid var(--line); padding: .55rem .65rem; text-align: left; vertical-align: top; }}
  th {{ background: #eef6fa; color: var(--brand); }}
  @media print {{
    body {{ background: white; }}
    .page {{ margin: 0; border: none; box-shadow: none; max-width: none; padding: 12mm; }}
  }}
</style>
</head>
<body>
  <article class="page">
    {body}
  </article>
</body>
</html>
"""

html_path = root / "docs" / "ACCREVIA_FRONTEND_ACCOMPLISHMENT_REPORT.html"
html_path.write_text(doc, encoding="utf-8")

downloads = Path.home() / "Downloads"
for p in (src, html_path):
    dest = downloads / p.name
    shutil.copy2(p, dest)
    print(f"Copied: {dest}")

print(f"Project HTML: {html_path}")
