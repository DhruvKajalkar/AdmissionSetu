"""Extract only selected institute sections from official cutoff PDFs.

This is an offline preparation step. The checked-in text extracts are consumed by
the deterministic Node generator; production never requires Python or PDF access.
"""

from pathlib import Path
import re

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "scripts" / "cet" / "source-data" / "cutoffs"
MANIFEST = (ROOT / "scripts" / "cet" / "source-manifest.mts").read_text(encoding="utf-8")
SELECTED = set(re.findall(r'"(\d{5})"', MANIFEST.split("cetSources", 1)[0]))


def extract_selected(source_name: str) -> None:
    pdf_path = SOURCE_ROOT / f"{source_name}.pdf"
    output_path = SOURCE_ROOT / f"{source_name}-selected.txt"
    selected_pages: list[str] = []
    current_institute: str | None = None

    pdf = PdfReader(pdf_path)
    for page_number, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        for line in text.splitlines():
            match = re.match(r"^(\d{5})\s+-\s+", line.strip())
            if match:
                current_institute = match.group(1)
                break
        if current_institute in SELECTED:
            selected_pages.append(f"=== OFFICIAL PDF PAGE {page_number} ===\n{text.strip()}\n")

    if not selected_pages:
        raise RuntimeError(f"No selected institute pages found in {pdf_path}")
    output_path.write_text("\n".join(selected_pages), encoding="utf-8", newline="\n")
    print(f"{source_name}: {len(selected_pages)} selected pages -> {output_path}")


if __name__ == "__main__":
    extract_selected("cap2")
    extract_selected("cap3")
