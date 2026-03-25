"""Convert PPTX to PDF using LibreOffice headless."""

import subprocess
from pathlib import Path


def convert_pptx_to_pdf(pptx_path: Path, output_dir: Path) -> Path:
    """Convert a PPTX file to PDF using LibreOffice.

    Args:
        pptx_path: Path to the input PPTX file.
        output_dir: Directory to write the PDF output.

    Returns:
        Path to the generated PDF file.

    Raises:
        RuntimeError: If LibreOffice conversion fails.
    """
    result = subprocess.run(
        [
            "libreoffice",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(output_dir),
            str(pptx_path),
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"LibreOffice conversion failed: {result.stderr}"
        )

    # LibreOffice outputs with the same name but .pdf extension
    pdf_name = pptx_path.stem + ".pdf"
    pdf_path = output_dir / pdf_name

    if not pdf_path.exists():
        raise RuntimeError(
            f"PDF output not found at {pdf_path}. "
            f"LibreOffice stdout: {result.stdout}"
        )

    return pdf_path
