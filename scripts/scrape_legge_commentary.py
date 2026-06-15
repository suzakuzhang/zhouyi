#!/usr/bin/env python3
"""
Scrape James Legge's (1882, SBE vol.16, public domain) commentary on the I Ching
from ctext.org and merge it into src/data/hexagrams_en.json.

This reproduces the 2026-06-06 extraction of the 传文 (Ten Wings appendixes):
  - 彖 Tuan         -> tuan_en          (Legge "Treatise on the Thwan", App. I)
  - 大象 Great Image -> xiang_overall_en (Legge "Symbolism", App. II)
  - 小象 Small Image -> xiang_line_en[1..6]
  - 文言 Wenyan      -> wenyan_en        (hexagrams 1 & 2 only, App. IV)

Why ctext: sacred-texts.com 403s on scraping; ctext per-hexagram pages serve
Legge verbatim in a clean bilingual table. Each English cell is a
  <td class="etext opt">LABEL</td><td class="etext"><div/>TEXT</td>
pair, appearing only after the "English translation: James Legge" marker.
Within one hexagram the order is: name(=judgment), Tuan Zhuan(=彖),
Xiang Zhuan(=大象), then (line, Xiang Zhuan)*6 (=小象 for lines 1..6); qian/kun
add a yong line+image and trailing name-labelled cells (=文言).

NOTE the slug list is NOT name_en.lower() (e.g. hexagram 15 谦 = "qian1"); it is
read in order from the /book-of-changes index.

Usage:  python3 scripts/scrape_legge_commentary.py            # extend Xu Gua / Za Gua here later
Run from the repo root. Polite ~0.7s delay between requests.
"""
import json, re, html, time, subprocess, os, sys

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"
BASE = "https://ctext.org/book-of-changes"
DATA = os.path.join(os.path.dirname(__file__), "..", "src", "data", "hexagrams_en.json")


def curl(url):
    for _ in range(3):
        out = subprocess.run(["curl", "-s", "--max-time", "25", "-A", UA, url],
                             capture_output=True, text=True, timeout=30)
        if out.stdout and len(out.stdout) > 30000:
            return out.stdout
        time.sleep(2)
    return None


def hexagram_slugs():
    t = curl(BASE)
    slugs = re.findall(r"book-of-changes/([A-Za-z0-9-]+)", t)
    drop = {"ens", "zh", "yi-jing"}
    seen = []
    for s in slugs:
        if s not in seen and s not in drop:
            seen.append(s)
    return seen[:64]


def parse_page(t):
    pairs = re.findall(
        r'class="etext opt">(.*?)</td>\s*<td class="etext">\s*(?:<div[^>]*></div>)?(.*?)</td>',
        t, re.S)
    started, seq = False, []
    for label, body in pairs:
        label = html.unescape(re.sub(r"<[^>]+>", " ", label)).strip()
        text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", body)).strip())
        if "James Legge" in label:
            started = True
            continue
        if not started or not text:
            continue
        kind = "tuan" if label == "Tuan Zhuan:" else "xiang" if label == "Xiang Zhuan:" else "name"
        seq.append((kind, text))
    tuan = next((c for k, c in seq if k == "tuan"), "")
    xiang = [c for k, c in seq if k == "xiang"]
    last_xiang = max((i for i, (k, _) in enumerate(seq) if k == "xiang"), default=-1)
    wenyan = " ".join(c for i, (k, c) in enumerate(seq) if k == "name" and i > last_xiang).strip()
    return tuan, xiang, wenyan


def main():
    slugs = hexagram_slugs()
    assert len(slugs) == 64, f"expected 64 slugs, got {len(slugs)}"
    en = json.load(open(DATA, encoding="utf-8"))
    for i, slug in enumerate(slugs):
        hid = str(i + 1)
        t = curl(f"{BASE}/{slug}")
        if not t:
            print(f"{hid:>2} {slug} FETCH FAIL", file=sys.stderr)
            continue
        tuan, xiang, wenyan = parse_page(t)
        assert tuan and len(xiang) >= 7, f"hex {hid} parse anomaly: xiang={len(xiang)}"
        en[hid]["tuan_en"] = tuan
        en[hid]["xiang_overall_en"] = xiang[0]
        en[hid]["xiang_line_en"] = {str(p): xiang[p] for p in range(1, 7)}
        if int(hid) in (1, 2) and wenyan:
            en[hid]["wenyan_en"] = wenyan
        print(f"{hid:>2} {slug:10} tuan={bool(tuan)} xiang={len(xiang)} wy={len(wenyan)}")
        time.sleep(0.7)
    json.dump(en, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("merged into", DATA)


if __name__ == "__main__":
    main()
