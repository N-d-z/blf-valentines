"""Builds index.html from _src/index.src.html by inlining the icons.
Run from the project root:  python3 _src/build.py
"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "_src/index.src.html").read_text()

def icon(m):
    s = (root / "_src/icons" / f"{m.group(1)}.svg").read_text()
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S).strip()
    s = re.sub(r"\s*\n\s*", " ", s)
    s = re.sub(r'class="[^"]*"\s*', "", s)
    s = s.replace('width="24" height="24" ', "").replace("<svg ", '<svg aria-hidden="true" focusable="false" ')
    return s

out = re.sub(r"\{\{i:([a-z0-9-]+)\}\}", icon, src)
assert "{{" not in out
(root / "index.html").write_text(out)
print("index.html built,", len(out), "bytes")
