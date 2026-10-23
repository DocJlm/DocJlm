"""Validate light artwork, preserve complete statistics, derive a mobile layout."""
import argparse
import copy
import re
from pathlib import Path
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
PALETTE = ['#007e99', '#e05a24', '#6d54aa', '#3a78b8', '#b15a80', '#596873']


def tag(name):
    return f'{{{SVG}}}{name}'


def text_at(parent, text, x, y, size=22, **attrs):
    node = ET.SubElement(parent, tag('text'), {'x': str(x), 'y': str(y),
        'font-size': str(size), 'fill': '#12161b', **attrs})
    node.text = str(text)
    return node


def load_svg(path, allow_preview=False):
    data = path.read_bytes()
    root = ET.fromstring(data)
    if root.tag != tag('svg') or len(data) < 100:
        raise ValueError(f'Invalid SVG: {path}')
    if root.get('data-preview-unavailable') and not allow_preview:
        raise ValueError('Preview-only data must never be published')
    for element in root.iter():
        if element.tag.split('}')[-1] in ('script', 'foreignObject'):
            raise ValueError(f'Unsupported active content: {path}')
        if any(a.lower().startswith('on') for a in element.attrib):
            raise ValueError(f'Event handler in SVG: {path}')
        if any(re.search(r'(?<![A-Za-z])(NaN|Infinity)(?![A-Za-z])', value)
               for value in element.attrib.values()):
            raise ValueError(f'Non-finite geometry: {path}')
    return root


def panels(root):
    groups = root.findall(tag('g'))
    calendar = [g for g in groups if any(
        any(c.startswith('cont-top-') for c in e.get('class', '').split())
        for e in g.iter())]
    radar = [g for g in groups if any(e.get('class') == 'axis' for e in g.iter())]
    summary = [g for g in groups if any(e.text == 'contributions' for e in g.findall(tag('text'))) ]
    if len(calendar) != 1 or len(radar) != 1 or len(summary) != 1:
        raise ValueError('Expected calendar, radar and summary panels; upstream format may have changed')
    others = [g for g in groups if g not in calendar + radar + summary]
    if len(others) > 1:
        raise ValueError('Unexpected extra upstream panel')
    if others:
        language = others[0]
    else:
        # Upstream omits this group entirely for zero total contributions.
        language = ET.SubElement(root, tag('g'), {'transform': 'translate(40, 520)'})
    return calendar[0], radar[0], language, summary[0]


def decorate_city(root):
    calendar, radar, language, summary = panels(root)
    for name, group in zip(('calendar', 'radar', 'language', 'summary'),
                           (calendar, radar, language, summary)):
        group.set('data-panel', name)
    axes = [e for e in radar.iter() if e.get('class') == 'axis']
    labels = [e.text for a in axes for e in a.findall(tag('text'))]
    if labels != ['Commit', 'Issue', 'PullReq', 'Review', 'Repo']:
        raise ValueError('Unexpected radar labels')
    values = summary.findall(tag('text'))
    if len(values) < 5 or not re.fullmatch(r'\d{4}-\d{2}-\d{2} / \d{4}-\d{2}-\d{2}', values[4].text or ''):
        raise ValueError('Missing summary or date range')
    for index, metric in ((0, 'contributions'), (2, 'stars'), (3, 'forks'), (4, 'period')):
        values[index].set('data-metric', metric)
    paths = language.findall('.//' + tag('path'))
    markers = language.findall('.//' + tag('rect'))
    for i, path in enumerate(paths):
        color = PALETTE[i % len(PALETTE)]
        style = path.get('style', '')
        style = re.sub(r'(^|;)\s*fill\s*:[^;]*', '', style).strip('; ')
        if style:
            path.set('style', style)
        else:
            path.attrib.pop('style', None)
        path.set('fill', color)
        if i < len(markers):
            markers[i].set('fill', color)
    if not paths and not root.get('data-preview-unavailable'):
        text_at(language, 'No language contributions', 20, 130, 24)
    root.set('role', 'img')
    root.set('aria-label', "DocJlm's contribution city, language distribution, radar and summary")
    ET.SubElement(root, tag('title')).text = 'A City Built Over Time — DocJlm'
    return root


def mobile_city(root):
    mobile = ET.Element(tag('svg'), {'width': '640', 'height': '1470',
        'viewBox': '0 0 640 1470', 'role': 'img',
        'aria-label': 'DocJlm contribution city and complete statistics, mobile layout'})
    if root.get('data-preview-unavailable'):
        mobile.set('data-preview-unavailable', root.get('data-preview-unavailable'))
    for e in root:
        if e.tag in (tag('style'), tag('defs')):
            mobile.append(copy.deepcopy(e))
    ET.SubElement(mobile, tag('rect'), {'width': '640', 'height': '1470', 'class': 'fill-bg'})
    calendar, radar, language, summary = panels(root)
    metrics = {e.get('data-metric'): (e.text or '') for e in summary.findall(tag('text')) if e.get('data-metric')}
    text_at(mobile, metrics['period'], 320, 32, 21, **{'text-anchor': 'middle'})
    city_wrap = ET.SubElement(mobile, tag('g'), {'transform': 'translate(0, 30) scale(.5)', 'data-panel': 'calendar'})
    city_wrap.append(copy.deepcopy(calendar))
    text_at(mobile, 'CONTRIBUTION PROFILE', 320, 470, 24, **{'text-anchor': 'middle', 'letter-spacing': '2'})
    rg = copy.deepcopy(radar)
    rg.set('transform', 'translate(320, 720) scale(1.18)')
    mobile.append(rg)
    text_at(mobile, 'LANGUAGE CONTRIBUTIONS', 320, 1030, 24, **{'text-anchor': 'middle', 'letter-spacing': '2'})
    lg = copy.deepcopy(language)
    lg.set('transform', 'translate(60, 1060)')
    mobile.append(lg)
    footer = ET.SubElement(mobile, tag('g'), {'data-panel': 'summary'})
    ET.SubElement(footer, tag('line'), {'x1': '35', 'x2': '605', 'y1': '1340', 'y2': '1340', 'stroke': '#d3dce1'})
    for x, metric, label in ((106, 'contributions', 'Contributions'), (320, 'stars', 'Stars'), (534, 'forks', 'Forks')):
        text_at(footer, metrics[metric], x, 1390, 32, **{'text-anchor': 'middle', 'font-weight': 'bold'})
        text_at(footer, label, x, 1420, 22, **{'text-anchor': 'middle'})
    if root.get('data-preview-unavailable'):
        text_at(footer, 'Stars / Forks: Awaiting first sync', 427, 1454, 19, **{'text-anchor': 'middle'})
    return mobile


def prepare(snake_dir, city_dir, output_dir, allow_preview=False):
    snake = load_svg(snake_dir / 'github-snake.svg')
    if snake.find(".//" + tag('rect') + "[@data-fixed-background='true']") is None:
        snake.insert(0, ET.Element(tag('rect'), {'width': '100%', 'height': '100%',
            'fill': '#f7f9fa', 'data-fixed-background': 'true'}))
    ET.SubElement(snake, tag('style')).text = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }'
    city = decorate_city(load_svg(city_dir / 'city-light.svg', allow_preview))
    images = {'github-snake.svg': snake, 'city-light.svg': city, 'city-mobile.svg': mobile_city(city)}
    # No output is touched until every input and derived image passes validation.
    serialized = {name: ET.tostring(root, encoding='utf-8', xml_declaration=True) for name, root in images.items()}
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, data in serialized.items():
        (output_dir / name).write_bytes(data)
    print('Validated light snake, complete city and mobile statistics layout.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ('snake-dir', 'city-dir', 'output-dir'):
        parser.add_argument('--' + option, required=True, type=Path)
    parser.add_argument('--preview', action='store_true', help='Allow explicitly marked incomplete local preview data; never use in Actions')
    args = parser.parse_args()
    prepare(args.snake_dir, args.city_dir, args.output_dir, args.preview)
