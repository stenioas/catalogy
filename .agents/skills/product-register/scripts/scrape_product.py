#!/usr/bin/env python3
"""Extrai um HTML local; o agente escolhe o slug e prepara o destino."""

import argparse
from dataclasses import dataclass
from pathlib import Path
import re
import shutil
import subprocess
import sys
from urllib.parse import urlsplit, urlunsplit

from bs4 import BeautifulSoup, Comment, NavigableString, Tag
from PIL import Image, ImageOps


BLOCKS = set('address article aside blockquote dd div dl dt fieldset figcaption figure footer '
             'h1 h2 h3 h4 h5 h6 header hr li main ol p pre section table td th tr ul'.split())
USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'


def visible_lines(root):
    """Traverse template contents too (BeautifulSoup.get_text omits them)."""
    parts = []

    def visit(node):
        if isinstance(node, Comment):
            return
        if isinstance(node, NavigableString):
            parts.append(re.sub(r'\s+', ' ', str(node)))
            return
        if not isinstance(node, Tag):
            return
        style = re.sub(r'\s+', '', node.get('style', '').lower())
        if (node.name in {'script', 'style', 'noscript'} or node.has_attr('hidden')
                or 'display:none' in style or 'visibility:hidden' in style):
            return
        boundary = node.name in BLOCKS or node.name == 'br'
        if boundary:
            parts.append('\n')
        for child in node.children:
            visit(child)
        if boundary:
            parts.append('\n')

    visit(root)
    return [line for raw in ''.join(parts).splitlines()
            if (line := re.sub(r'\s+', ' ', raw).strip())]


def text(node):
    return ' '.join(visible_lines(node)) if node else ''


def clean_slider_url(url):
    pieces = urlsplit(url)
    path = re.sub(r'_(?:\d+x\d+)(?:q\d+)?\.[a-zA-Z0-9]+(?:_\.[a-zA-Z0-9]+)?$',
                  '', pieces.path)
    return urlunsplit(pieces._replace(path=path))


@dataclass
class Product:
    title: str
    summary: list
    specifications: list
    description: list
    media: list  # (image | video, URL), in collection order


def parse_html(html):
    soup = BeautifulSoup(html, 'html.parser')
    title = text(soup.select_one('h1[data-pl="product-title"]'))
    summary = [value for li in soup.select('ul.seo-sellpoints--sellerPoint--RcmFO_y li')
               if (value := text(li))]
    specs = []
    for prop in soup.select('ul.specification--list--GZuXzRX .specification--prop--Jh28bKu'):
        name = text(prop.select_one('.specification--title--SfH3sA8'))
        value = text(prop.select_one('.specification--desc--Dxx6W0W'))
        if name and value:
            specs.append((name, value))

    # The supplied HTML has nested elements with the same description ID.
    descriptions = [n for n in soup.select('#product-description')
                    if n.find_parent(id='product-description') is None]
    description = [line for root in descriptions for line in visible_lines(root)]
    media = []
    seen = set()

    def add(kind, url, slider=False):
        if not url:
            return
        url = url.strip()
        if url.startswith('//'):
            url = 'https:' + url
        if slider:
            url = clean_slider_url(url)
        if url and url not in seen:
            seen.add(url)
            media.append((kind, url))

    def video(node):
        add('video', node.get('src'))
        for source in node.select('source[src]'):
            add('video', source['src'])

    for image in soup.select('[class*="slider--img--"] img[src]'):
        if not image.find_parent(id='product-description'):
            add('image', image['src'], slider=True)
    for node in soup.select('video[class*="video--video--"]'):
        if not node.find_parent(id='product-description'):
            video(node)
    for root in descriptions:
        for node in root.find_all(['img', 'video']):
            if node.name == 'img':
                add('image', node.get('src'))
            else:
                video(node)
    return Product(title, summary, specs, description, media)


def download(url, target, attempts=3):
    for _ in range(attempts):
        try:
            subprocess.run(['curl', '-fsSL', '--max-time', '60', '--user-agent', USER_AGENT,
                            '--output', str(target), '--', url], check=True)
            return True
        except (OSError, subprocess.CalledProcessError):
            target.unlink(missing_ok=True)
    return False


DISPLAY_MAX_PX = 768
THUMB_MAX_PX = 400
WEBP_QUALITY = 80


def display_image(source):
    """EXIF orientation, real alpha kept, longest side at most 768px, never upscaled."""
    image = ImageOps.exif_transpose(source)
    mode = 'RGBA' if 'A' in image.getbands() or 'transparency' in image.info else 'RGB'
    image = image.convert(mode)
    image.thumbnail((DISPLAY_MAX_PX, DISPLAY_MAX_PX), Image.Resampling.LANCZOS)
    return image


def save_webp(image, target):
    """Lossy WebP at quality 80. Images with real transparency stay lossless so the alpha survives."""
    if image.mode == 'RGBA' and image.getextrema()[-1][0] < 255:
        image.save(target, format='WEBP', lossless=True, quality=WEBP_QUALITY)
        return
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    image.save(target, format='WEBP', quality=WEBP_QUALITY)


def write_thumbnail(source, target):
    """Card and thumbnail file: longest side at most 400px, same WebP rule, never upscaled."""
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        thumb = image.copy()
        thumb.thumbnail((THUMB_MAX_PX, THUMB_MAX_PX), Image.Resampling.LANCZOS)
        save_webp(thumb, target)


def download_image(url, target):
    """Try up to three download/conversion cycles, cleaning every failed attempt."""
    original = target.with_suffix('.download')
    for _ in range(3):
        try:
            if not download(url, original, attempts=1):
                continue
            with Image.open(original) as source:
                save_webp(display_image(source), target)
            return True
        except (OSError, ValueError, Image.DecompressionBombError):
            target.unlink(missing_ok=True)
        finally:
            original.unlink(missing_ok=True)
    return False


def download_video(url, target):
    """Retry only downloads; after success, probe and transcode once to MP4."""
    extension = Path(urlsplit(url).path).suffix
    if not re.fullmatch(r'\.[a-zA-Z0-9]+', extension):
        extension = '.bin'
    original = target.with_name(target.stem + '-source' + extension)
    try:
        if not download(url, original):
            return False
        audio = subprocess.run(
            ['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index',
             '-of', 'csv=p=0', str(original)],
            check=True, capture_output=True, text=True,
        )
        command = [
            'ffmpeg', '-nostdin', '-y', '-i', str(original),
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p',
        ]
        if audio.stdout.strip():
            command.extend(['-c:a', 'aac', '-b:a', '128k', '-ac', '2'])
        command.extend(['-movflags', '+faststart', str(target)])
        subprocess.run(command, check=True)
        return True
    except (OSError, subprocess.CalledProcessError):
        target.unlink(missing_ok=True)
        return False
    finally:
        original.unlink(missing_ok=True)


def render_info(product, media_lines):
    sections = []
    if product.title:
        sections.append('# ' + product.title)
    if product.summary:
        sections.append('## Resumo do item com IA\n\n' + '\n'.join('- ' + s for s in product.summary))
    if product.specifications:
        sections.append('## Especificações\n\n' + '\n'.join(f'- {k}: {v}' for k, v in product.specifications))
    if product.description:
        sections.append('## Descrição\n\n' + '\n'.join(product.description))
    if media_lines:
        sections.append('## Mídias\n\n' + '\n'.join(media_lines))
    return '\n\n'.join(sections) + ('\n' if sections else '')


def scrape(input_path, output, replace=False):
    # Decode and parse everything before any mutation, even when replacing.
    product = parse_html(Path(input_path).read_text(encoding='utf-8'))
    output = Path(output)
    if not output.is_dir() or output.is_symlink():
        raise ValueError('O destino deve ser uma pasta existente, sem link simbólico.')
    info = output / 'info.md'
    media_dir = output / 'media'
    if info.is_symlink() or media_dir.is_symlink():
        raise ValueError('info.md e media/ não podem ser links simbólicos.')
    if (info.exists() and not info.is_file()) or (media_dir.exists() and not media_dir.is_dir()):
        raise ValueError('Tipo inválido para info.md ou media/.')
    if not replace and (info.exists() or media_dir.exists()):
        raise ValueError('Insumos existentes: use --replace para regravar info.md e media/.')
    if media_dir.exists():
        shutil.rmtree(media_dir)
    media_dir.mkdir()
    counts = {'image': 0, 'video': 0}
    lines = []
    failures = 0
    for kind, url in product.media:
        counts[kind] += 1
        if kind == 'image':
            filename = f'{output.name}-{counts[kind]}.webp'
            succeeded = download_image(url, media_dir / filename)
        else:
            filename = f'{output.name}-video-{counts[kind]}.mp4'
            succeeded = download_video(url, media_dir / filename)
        if succeeded:
            lines.append('- ' + filename)
        else:
            lines.append('- FALHA ' + url)
            failures += 1
    info.write_text(render_info(product, lines), encoding='utf-8')
    return failures


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--replace', action='store_true', help='Regrava somente info.md e media/.')
    args = parser.parse_args(argv)
    try:
        failures = scrape(args.input, args.output, args.replace)
    except (OSError, UnicodeError, ValueError) as exc:
        print(f'Erro: {exc}', file=sys.stderr)
        return 1
    print(f'Insumos gravados em {args.output}; falhas de mídia: {failures}.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
