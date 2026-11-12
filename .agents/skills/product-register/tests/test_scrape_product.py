import importlib.util
from pathlib import Path
import subprocess
import sys

import pytest
from PIL import Image


SKILL = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('scrape_product', SKILL / 'scripts/scrape_product.py')
scraper = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = scraper
spec.loader.exec_module(scraper)


@pytest.fixture
def curl(monkeypatch):
    calls = []

    def run(command, check, **kwargs):
        assert check is True
        if command[0] == 'ffprobe':
            return subprocess.CompletedProcess(command, 0, stdout='0\n')
        if command[0] == 'ffmpeg':
            Path(command[-1]).write_bytes(b'converted-mp4')
            return subprocess.CompletedProcess(command, 0)
        assert command[:4] == ['curl', '-fsSL', '--max-time', '60']
        assert 'Mozilla/' in command[command.index('--user-agent') + 1]
        target = Path(command[command.index('--output') + 1])
        calls.append((command[-1], target.name))
        if '.mp4' in command[-1]:
            target.write_bytes(b'original\x00bytes')
        else:
            Image.new('RGB', (32, 16), 'red').save(target, format='JPEG')
        return subprocess.CompletedProcess(command, 0)

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    return calls


def load(filename):
    return scraper.parse_html((SKILL / 'fixtures' / filename).read_text())


def test_aimimo(tmp_path, curl):
    product = load('aliexpress-product.html')
    assert product.title.startswith('Relógio masculino DD40MM com cristal de safira,')
    assert product.summary == []
    assert ('Nome da marca', 'AIMIMO DESIGN') in product.specifications
    assert 'Proteção ao Comprador' in product.description
    assert 'Mecanismo: Movimento de quartzo Miyota, fabricado no Japão.' in product.description
    assert '2. Reembolso total caso os pedidos não cheguem dentro do prazo de entrega.' in product.description
    first = 'https://ae-pic-a1.aliexpress-media.com/kf/Sf2536d5ed3a3499f8669ddc749213f42h.jpg'
    assert product.media[0] == ('image', first)
    assert sum(url == first for _, url in product.media) == 1
    assert all('_220x220q75.jpg_.avif' not in url for _, url in product.media)
    videos = [url for kind, url in product.media if kind == 'video']
    assert [url.split('/')[-1] for url in videos] == [
        '5000641012599.mp4?from=chrome', '5000641020113.mp4?from=chrome']
    assert scraper.scrape(SKILL / 'fixtures/aliexpress-product.html', tmp_path) == 0
    info = (tmp_path / 'info.md').read_text()
    assert info.startswith('# ' + product.title + '\n')
    assert '## Resumo do item com IA' not in info
    assert '## Especificações' in info
    assert f'- {tmp_path.name}-video-1.mp4' in info and f'- {tmp_path.name}-video-2.mp4' in info
    assert (tmp_path / f'media/{tmp_path.name}-video-1.mp4').read_bytes() == b'converted-mp4'
    with Image.open(tmp_path / f'media/{tmp_path.name}-1.png') as image:
        assert image.format == 'PNG'
        assert image.size == (32, 16)
    assert [url for url, _ in curl] == [url for _, url in product.media]
    assert all('adminAccountId' not in line and 'max-width' not in line for line in product.description)


def test_curren(tmp_path, curl):
    product = load('aliexpress-product-2.html')
    assert product.title.startswith("Relógio Masculino CURREN 8106 à Prova D'Água,")
    assert len(product.summary) == 7
    assert product.summary[0].startswith('Relógio masculino CURREN 8106 com design de luxo O relógio')
    assert ('Nome da marca', 'Curren') in product.specifications
    assert ('Número do modelo', 'curren 8106') in product.specifications
    assert 'Diâmetro da caixa: 4,0 cm' in product.description
    assert 'Pacote Inclui:' in product.description
    assert product.description.count('Pacote Inclui:') == 1
    assert any(url.endswith('/S8718fb0b88f146f9bd5b62976ca4d2e8t.jpg') for _, url in product.media)
    assert [url.split('/')[-1] for kind, url in product.media if kind == 'video'] == [
        '5000557758805.mp4?from=chrome']
    html = (SKILL / 'fixtures/aliexpress-product-2.html').read_text()
    assert 'display: none' in html
    scraper.scrape(SKILL / 'fixtures/aliexpress-product-2.html', tmp_path)
    info = (tmp_path / 'info.md').read_text()
    assert info.index('## Resumo') < info.index('## Especificações') < info.index('## Descrição') < info.index('## Mídias')
    assert '- Nome da marca: Curren' in info
    assert '<strong>' not in info
    assert len(curl) == len(set(url for _, url in product.media))


@pytest.mark.parametrize('unreadable', ['missing', 'directory', 'encoding'])
def test_unreadable_preserves_previous_output(tmp_path, curl, unreadable):
    output = tmp_path / 'product'
    output.mkdir()
    (output / 'info.md').write_text('original')
    (output / 'media').mkdir()
    (output / 'media/old.jpg').write_bytes(b'old')
    source = tmp_path / 'input.html'
    if unreadable == 'directory':
        source.mkdir()
    elif unreadable == 'encoding':
        source.write_bytes(b'\xff\xfe')
    assert scraper.main(['--input', str(source), '--output', str(output), '--replace']) == 1
    assert (output / 'info.md').read_text() == 'original'
    assert (output / 'media/old.jpg').read_bytes() == b'old'
    assert curl == []


def test_replace_preserves_catalog_files(tmp_path, curl):
    output = tmp_path / 'product'
    output.mkdir()
    (output / 'product.json').write_text('{"keep":true}')
    (output / 'img').mkdir()
    (output / 'img/photo.jpg').write_bytes(b'keep')
    (output / 'media').mkdir()
    (output / 'media/stale.jpg').write_bytes(b'stale')
    (output / 'info.md').write_text('old')
    scraper.scrape(SKILL / 'fixtures/aliexpress-product.html', output, replace=True)
    assert not (output / 'media/stale.jpg').exists()
    assert (output / 'product.json').read_text() == '{"keep":true}'
    assert (output / 'img/photo.jpg').read_bytes() == b'keep'


def test_without_title_and_partial_download_failure(tmp_path, curl, monkeypatch):
    source = tmp_path / 'input.html'
    source.write_text('''<div id="product-description"><template shadowrootmode="open">
        <p>Texto <strong>visível</strong><br>Outra linha</p><style>css</style><script>js</script>
        <img src="https://example.test/a.png"><img src="https://example.test/b.webp">
        <video style="display:none" src="https://example.test/v.mp4"></video>
        </template></div>''')
    output = tmp_path / 'product'
    output.mkdir()
    calls = []
    original_run = scraper.subprocess.run

    def run(command, check, **kwargs):
        if command[0] == 'curl':
            calls.append(command[-1])
            if command[-1].endswith('/a.png'):
                path = Path(command[command.index('--output') + 1])
                path.write_bytes(b'partial')
                raise subprocess.CalledProcessError(22, command)
        return original_run(command, check, **kwargs)

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    assert scraper.main(['--input', str(source), '--output', str(output)]) == 0
    assert len(calls) == 5
    assert (output / 'info.md').read_text() == (
        '## Descrição\n\nTexto visível\nOutra linha\n\n## Mídias\n\n'
        '- FALHA https://example.test/a.png\n- product-2.png\n- product-video-1.mp4\n')
    assert sorted(p.name for p in (output / 'media').iterdir()) == ['product-2.png', 'product-video-1.mp4']
    assert sorted(p.name for p in output.iterdir()) == ['info.md', 'media']


def test_collection_order_boundaries_and_thumbnail_cleanup():
    product = scraper.parse_html('''
        <img src="https://example.test/icon.png">
        <div class="slider--img--abc"><img src="https://example.test/a.jpg_960x960q75.jpg_.avif"></div>
        <div class="slider--item--abc"><img class="slider--videoIcon--abc" src="https://example.test/icon.png"></div>
        <div style="display:none"><video class="video--video--abc"><source src="https://example.test/v.mp4"></video></div>
        <div id="product-description"><template><div id="product-description">
        <img src="https://example.test/a.jpg"><video src="https://example.test/v.mp4"></video>
        <img src="https://example.test/detail.jpg_220x220q75.jpg_.avif">
        <video><source src="https://example.test/other.mp4"></video>
        </div></template></div>''')
    assert product.media == [
        ('image', 'https://example.test/a.jpg'), ('video', 'https://example.test/v.mp4'),
        ('image', 'https://example.test/detail.jpg_220x220q75.jpg_.avif'),
        ('video', 'https://example.test/other.mp4')]


def test_empty_html_and_refusal_to_overwrite(tmp_path, curl):
    source = tmp_path / 'input.html'
    source.write_text('')
    output = tmp_path / 'product'
    output.mkdir()
    assert scraper.scrape(source, output) == 0
    assert (output / 'info.md').read_text() == ''
    (output / 'info.md').write_text('keep')
    with pytest.raises(ValueError):
        scraper.scrape(source, output)
    assert (output / 'info.md').read_text() == 'keep'


def test_symlink_media_is_not_followed(tmp_path, curl):
    source = tmp_path / 'input.html'
    source.write_text('')
    output = tmp_path / 'product'
    output.mkdir()
    elsewhere = tmp_path / 'elsewhere'
    elsewhere.mkdir()
    (elsewhere / 'keep').write_text('keep')
    (output / 'media').symlink_to(elsewhere, target_is_directory=True)
    with pytest.raises(ValueError):
        scraper.scrape(source, output, replace=True)
    assert (elsewhere / 'keep').read_text() == 'keep'


@pytest.mark.parametrize(('size', 'expected'), [
    ((320, 240), (320, 240)),
    ((768, 768), (768, 768)),
    ((768, 300), (768, 300)),
    ((1536, 384), (768, 192)),
    ((384, 1536), (192, 768)),
    ((1536, 1024), (768, 512)),
    ((1024, 1536), (512, 768)),
    ((1536, 1536), (768, 768)),
    ((1001, 501), (768, 384)),
])
def test_png_dimensions_and_folder_prefix(tmp_path, monkeypatch, size, expected):
    source = tmp_path / 'input.html'
    # The real format must be decoded, rather than inferred from the URL.
    source.write_text('<div id="product-description"><img src="https://example.test/image.bin"></div>')
    output = tmp_path / 'aimimo-design-tsuyosa'
    output.mkdir()

    def run(command, check):
        target = Path(command[command.index('--output') + 1])
        Image.new('RGB', size, 'red').save(target, format='JPEG')

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    assert scraper.scrape(source, output) == 0
    assert (output / 'info.md').read_text() == '## Mídias\n\n- aimimo-design-tsuyosa-1.png\n'
    media = list((output / 'media').iterdir())
    assert [p.name for p in media] == ['aimimo-design-tsuyosa-1.png']
    with Image.open(media[0]) as image:
        assert image.format == 'PNG'
        assert image.size == expected
        assert max(image.size) <= 768
        assert image.getpixel((0, 0))[0] > 240
        assert abs(image.width - size[0] * image.height / size[1]) <= 1


@pytest.mark.parametrize('mode', ['RGBA', 'P', 'CMYK', 'EXIF'])
def test_conversion_preserves_transparency_and_orientation(tmp_path, monkeypatch, mode):
    def run(command, check):
        path = Path(command[command.index('--output') + 1])
        if mode == 'RGBA':
            Image.new('RGBA', (40, 20), (10, 20, 30, 64)).save(path, format='PNG')
        elif mode == 'P':
            image = Image.new('P', (40, 20), 0)
            image.save(path, format='PNG', transparency=0)
        elif mode == 'CMYK':
            Image.new('CMYK', (40, 20)).save(path, format='JPEG')
        else:
            exif = Image.Exif()
            exif[274] = 6
            Image.new('RGB', (1536, 384)).save(path, format='JPEG', exif=exif)

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    target = tmp_path / 'image.png'
    assert scraper.download_image('https://example.test/image', target)
    assert not target.with_suffix('.download').exists()
    with Image.open(target) as image:
        assert image.format == 'PNG'
        if mode in {'RGBA', 'P'}:
            assert image.mode == 'RGBA'
            assert image.getpixel((0, 0))[3] == (64 if mode == 'RGBA' else 0)
        elif mode == 'EXIF':
            assert image.size == (192, 768)
            assert image.getexif().get(274, 1) == 1
        else:
            assert image.mode == 'RGB'


def test_invalid_image_records_failure_and_continues(tmp_path, curl, monkeypatch):
    run = scraper.subprocess.run

    def corrupt_first(command, check, **kwargs):
        if command[-1].endswith('broken.jpg'):
            Path(command[command.index('--output') + 1]).write_bytes(b'not an image')
        else:
            return run(command, check, **kwargs)

    monkeypatch.setattr(scraper.subprocess, 'run', corrupt_first)
    source = tmp_path / 'input.html'
    source.write_text('''<div id="product-description">
        <img src="https://example.test/broken.jpg">
        <img src="https://example.test/valid.jpg">
        <video src="https://example.test/valid.mp4"></video></div>''')
    output = tmp_path / 'watch'
    output.mkdir()
    assert scraper.scrape(source, output) == 1
    assert (output / 'info.md').read_text() == (
        '## Mídias\n\n- FALHA https://example.test/broken.jpg\n'
        '- watch-2.png\n- watch-video-1.mp4\n')
    assert sorted(p.name for p in (output / 'media').iterdir()) == ['watch-2.png', 'watch-video-1.mp4']


def test_partial_conversion_is_removed(tmp_path, curl, monkeypatch):
    save = Image.Image.save

    def fail_png(image, target, format=None, **kwargs):
        if format == 'PNG':
            Path(target).write_bytes(b'partial png')
            raise OSError('No space left')
        return save(image, target, format=format, **kwargs)

    monkeypatch.setattr(Image.Image, 'save', fail_png)
    assert not scraper.download_image('https://example.test/image.jpg', tmp_path / 'watch-1.png')
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize('failure', ['download', 'conversion'])
@pytest.mark.parametrize('failures', [2, 3])
def test_image_retries_complete_cycles(tmp_path, monkeypatch, failure, failures):
    calls = []

    def run(command, check):
        assert command[:4] == ['curl', '-fsSL', '--max-time', '60']
        target = Path(command[command.index('--output') + 1])
        # Failed previous downloads/conversions must have been cleaned up.
        assert not target.exists()
        assert not (tmp_path / 'photo.png').exists()
        calls.append(command)
        if len(calls) <= failures:
            target.write_bytes(b'partial or corrupt')
            if failure == 'download':
                raise subprocess.CalledProcessError(22, command)
        else:
            Image.new('RGB', (24, 16)).save(target, format='JPEG')

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    assert scraper.download_image('https://example.test/photo', tmp_path / 'photo.png') == (failures < 3)
    assert len(calls) == 3
    assert sorted(p.name for p in tmp_path.iterdir()) == (['photo.png'] if failures < 3 else [])


@pytest.mark.parametrize('audio', [False, True])
@pytest.mark.parametrize('failures', [0, 2, 3])
def test_video_download_retries_and_conversion_flags(tmp_path, monkeypatch, audio, failures):
    calls = []
    downloads = 0

    def run(command, check, **kwargs):
        nonlocal downloads
        assert check is True
        calls.append(command)
        if command[0] == 'curl':
            downloads += 1
            assert command[:4] == ['curl', '-fsSL', '--max-time', '60']
            target = Path(command[command.index('--output') + 1])
            assert target.name == 'watch-video-1-source.webm'
            assert not target.exists()
            target.write_bytes(b'source')
            if downloads <= failures:
                raise subprocess.CalledProcessError(22, command)
        elif command[0] == 'ffprobe':
            assert command[command.index('-select_streams') + 1] == 'a'
            return subprocess.CompletedProcess(command, 0, stdout='0\n' if audio else '')
        else:
            assert command[0] == 'ffmpeg'
            assert command[command.index('-vf') + 1] == 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30'
            for flag, value in [('-c:v', 'libx264'), ('-preset', 'fast'), ('-crf', '23'),
                                ('-pix_fmt', 'yuv420p'), ('-movflags', '+faststart')]:
                assert command[command.index(flag) + 1] == value
            if audio:
                for flag, value in [('-c:a', 'aac'), ('-b:a', '128k'), ('-ac', '2')]:
                    assert command[command.index(flag) + 1] == value
            else:
                assert all(flag not in command for flag in ['-c:a', '-b:a', '-ac'])
            Path(command[-1]).write_bytes(b'mp4')

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    target = tmp_path / 'watch-video-1.mp4'
    assert scraper.download_video('https://example.test/watch.webm?query=1', target) == (failures < 3)
    assert downloads == min(failures + 1, 3)
    assert sum(c[0] == 'ffmpeg' for c in calls) == (1 if failures < 3 else 0)
    assert sorted(p.name for p in tmp_path.iterdir()) == (['watch-video-1.mp4'] if failures < 3 else [])


def test_video_conversion_failure_is_not_retried_and_batch_continues(tmp_path, curl, monkeypatch):
    original_run = scraper.subprocess.run
    calls = []

    def run(command, check, **kwargs):
        calls.append(command)
        if command[0] == 'ffmpeg':
            Path(command[-1]).write_bytes(b'partial mp4')
            raise subprocess.CalledProcessError(1, command)
        return original_run(command, check, **kwargs)

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    source = tmp_path / 'input.html'
    source.write_text('<div id="product-description"><video src="https://example.test/video.mp4"></video>'
                      '<img src="https://example.test/valid.jpg"></div>')
    output = tmp_path / 'watch'
    output.mkdir()
    assert scraper.scrape(source, output) == 1
    assert sum(c[0] == 'ffmpeg' for c in calls) == 1
    assert sum(c[0] == 'curl' and c[-1].endswith('video.mp4') for c in calls) == 1
    assert (output / 'info.md').read_text() == (
        '## Mídias\n\n- FALHA https://example.test/video.mp4\n- watch-1.png\n')
    assert [p.name for p in (output / 'media').iterdir()] == ['watch-1.png']


def test_video_download_exhaustion_records_failure_and_continues(tmp_path, curl, monkeypatch):
    original_run = scraper.subprocess.run
    downloads = []

    def run(command, check, **kwargs):
        if command[0] == 'curl' and command[-1].endswith('missing.mp4'):
            downloads.append(command)
            Path(command[command.index('--output') + 1]).write_bytes(b'partial')
            raise subprocess.CalledProcessError(22, command)
        assert command[0] not in {'ffprobe', 'ffmpeg'}
        return original_run(command, check, **kwargs)

    monkeypatch.setattr(scraper.subprocess, 'run', run)
    source = tmp_path / 'input.html'
    source.write_text('<div id="product-description"><video src="https://example.test/missing.mp4"></video>'
                      '<img src="https://example.test/valid.jpg"></div>')
    output = tmp_path / 'watch'
    output.mkdir()
    assert scraper.scrape(source, output) == 1
    assert len(downloads) == 3
    assert (output / 'info.md').read_text() == (
        '## Mídias\n\n- FALHA https://example.test/missing.mp4\n- watch-1.png\n')
    assert [p.name for p in (output / 'media').iterdir()] == ['watch-1.png']
