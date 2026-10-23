import base64
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('artwork', ROOT / 'scripts/prepare_artwork.py')
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)


class ArtworkTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.snake, self.city, self.out = (self.base / n for n in ('snake', 'city', 'output'))
        self.snake.mkdir(); self.city.mkdir()
        shutil.copy(ROOT / 'assets/generated/github-snake.svg', self.snake)
        self.fixture('populated')

    def fixture(self, name):
        shutil.copy(ROOT / f'tests/fixtures/city-{name}.svg', self.city / 'city-light.svg')

    def run_prepare(self):
        art.prepare(self.snake, self.city, self.out)
        return ET.parse(self.out / 'city-light.svg').getroot()

    def test_complete_stats_and_mobile_keep_real_zero(self):
        root = self.run_prepare()
        calendar, radar, languages, summary = art.panels(root)
        self.assertEqual(len(calendar), 7)
        snake = ET.parse(self.out / 'github-snake.svg').getroot()
        self.assertEqual(snake.find(art.tag('rect')).get('fill'), '#f7f9fa')
        self.assertEqual(len(radar.findall(art.tag('polygon'))), 1)
        paths = languages.findall('.//' + art.tag('path'))
        self.assertEqual([p.get('fill') for p in paths], art.PALETTE[:3])
        self.assertEqual([p.find(art.tag('title')).text for p in paths], ['JavaScript 15', 'TypeScript 8', 'Rust 3'])
        texts = {e.get('data-metric'): e.text for e in summary.findall(art.tag('text')) if e.get('data-metric')}
        self.assertEqual(texts, {'contributions': '32', 'stars': '0', 'forks': '14', 'period': '2026-01-04 / 2026-01-10'})
        mobile = ET.parse(self.out / 'city-mobile.svg').getroot()
        footer = next(g for g in mobile.findall(art.tag('g')) if g.get('data-panel') == 'summary')
        self.assertEqual([e.text for e in footer.findall(art.tag('text'))], ['32', 'Contributions', '0', 'Stars', '14', 'Forks'])
        self.assertEqual({p.name for p in self.out.iterdir()}, {'github-snake.svg', 'city-light.svg', 'city-mobile.svg'})

    def test_zero_contributions_and_no_language_data(self):
        self.fixture('zero')
        root = self.run_prepare()
        _, radar, lang, summary = art.panels(root)
        self.assertIn('No language contributions', ''.join(lang.itertext()))
        self.assertNotIn('Awaiting', ''.join(root.itertext()))
        self.assertEqual(summary.find(f"{art.tag('text')}[@data-metric='contributions']").text, '0')
        self.assertEqual(len(radar.findall(art.tag('polygon'))), 1)

    def test_invalid_or_incomplete_input_preserves_all_previous_bytes(self):
        self.run_prepare()
        previous = {p.name: p.read_bytes() for p in self.out.iterdir()}
        original = (self.city / 'city-light.svg').read_bytes()
        variants = [None, b'<svg>', b'<svg xmlns="http://www.w3.org/2000/svg">' + b' '*200 + b'</svg>',
                    original.replace(b'<svg ', b'<svg onclick="bad()" ', 1),
                    original.replace(b'<svg ', b'<svg data-preview-unavailable="radar" ', 1),
                    original.replace(b'<svg ', b'<svg viewBox="0 0 NaN 850" ', 1)]
        for variant in variants:
            with self.subTest(variant=str(variant)[:60]):
                target = self.city / 'city-light.svg'
                if variant is None: target.unlink()
                else: target.write_bytes(variant)
                with self.assertRaises((ValueError, ET.ParseError, FileNotFoundError)):
                    self.run_prepare()
                self.assertEqual(previous, {p.name: p.read_bytes() for p in self.out.iterdir()})
                target.write_bytes(original)

    def test_unknown_preview_values_are_not_zero_or_example_proportions(self):
        root = art.load_svg(ROOT / 'assets/generated/city-light.svg', allow_preview=True)
        _, radar, lang, summary = art.panels(root)
        self.assertFalse(radar.findall(art.tag('polygon')))
        self.assertFalse(lang.findall('.//' + art.tag('path')))
        self.assertIn('Awaiting first sync', ''.join(radar.itertext()))
        self.assertIn('Awaiting first sync', ''.join(lang.itertext()))
        for metric in ('stars', 'forks'):
            node = summary.find(f"{art.tag('text')}[@data-metric='{metric}']")
            self.assertEqual(''.join(node.itertext()), '—')
        with self.assertRaises(ValueError):
            art.load_svg(ROOT / 'assets/generated/city-light.svg')

    def test_hero_sources_are_responsive_and_readme_keeps_native_link(self):
        readme = (ROOT / 'README.md').read_text()
        self.assertIn('srcset="assets/harness/babel-harness-mobile.png"', readme)
        self.assertIn('src="assets/harness/babel-harness-desktop.gif"', readme)
        self.assertIn('](https://www.zqcblog.com/)', readme)
        self.assertNotIn('theresa-light-animated.svg', readme)
        for name in ('babel-harness-mobile.png', 'babel-harness-desktop.png'):
            self.assertTrue((ROOT / 'assets/harness' / name).read_bytes().startswith(b'\x89PNG\r\n\x1a\n'))


if __name__ == '__main__':
    unittest.main()
