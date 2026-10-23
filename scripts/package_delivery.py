"""Package the local repository and inspected deliverables; never publishes."""
import argparse
import json
import shutil
import zipfile
from pathlib import Path


def package(destination):
    root = Path(__file__).resolve().parents[1]
    output = Path(destination).resolve()
    output.mkdir(parents=True, exist_ok=True)
    for name in ('babel-harness-desktop.gif', 'babel-harness-desktop.png',
                 'babel-harness-mobile.gif', 'babel-harness-mobile.png'):
        shutil.copy2(root / 'assets/harness' / name, output / name)
    for name in ('VALIDATION.md', 'design-qa.md'):
        shutil.copy2(root / name, output / name)
    shutil.copy2(root / 'preview.html', output / 'profile-preview.html')
    archive = output / 'DocJlm-profile.zip'
    temporary = output / 'DocJlm-profile.zip.tmp'
    excluded = {'.git', 'node_modules', '.preview', '__pycache__', '.DS_Store'}
    count = 0
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for file in sorted(root.rglob('*')):
            relative = file.relative_to(root)
            if not file.is_file() or any(part in excluded for part in relative.parts):
                continue
            if file.name.startswith('.env') or file.suffix == '.pyc':
                continue
            bundle.write(file, 'DocJlm-profile/' + relative.as_posix())
            count += 1
    with zipfile.ZipFile(temporary) as bundle:
        if bundle.testzip() is not None:
            raise ValueError('Archive integrity check failed')
    temporary.replace(archive)
    result = {'files': count, 'bytes': archive.stat().st_size, 'archive': str(archive)}
    (output / 'package-info.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination')
    package(parser.parse_args().destination)
