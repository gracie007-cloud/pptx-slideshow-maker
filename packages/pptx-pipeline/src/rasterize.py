"""Rasterize PDF pages to PNG images using Poppler's pdftoppm."""

import subprocess
from pathlib import Path

from PIL import Image


def rasterize_pdf_to_images(
    pdf_path: Path,
    output_dir: Path,
    width: int = 1920,
    height: int = 1080,
    fmt: str = "png",
) -> list[Path]:
    """Convert each page of a PDF to a PNG image.

    Args:
        pdf_path: Path to the input PDF.
        output_dir: Directory for output images.
        width: Target image width in pixels.
        height: Target image height in pixels.
        fmt: Output format (png or jpg).

    Returns:
        List of paths to generated images, one per page.
    """
    prefix = output_dir / "slide"

    result = subprocess.run(
        [
            "pdftoppm",
            "-r", "150",  # DPI for good quality
            f"-{fmt}",
            str(pdf_path),
            str(prefix),
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        raise RuntimeError(f"pdftoppm failed: {result.stderr}")

    # pdftoppm outputs files like slide-1.png, slide-2.png, etc.
    image_paths = sorted(output_dir.glob(f"slide-*.{fmt}"))

    # Resize images to target dimensions
    optimized_paths = []
    for img_path in image_paths:
        optimized = _optimize_image(img_path, width, height)
        optimized_paths.append(optimized)

    return optimized_paths


def _optimize_image(
    image_path: Path,
    target_width: int,
    target_height: int,
) -> Path:
    """Resize and optimize an image to target dimensions."""
    with Image.open(image_path) as img:
        img = img.resize(
            (target_width, target_height),
            Image.Resampling.LANCZOS,
        )
        img.save(image_path, optimize=True, quality=90)
    return image_path
