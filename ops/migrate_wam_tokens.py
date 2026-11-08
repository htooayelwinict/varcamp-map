"""Re-pin live WAMs; optionally apply the reviewed auditorium geometry successor.

Downloads the live target through the same storage/transport as release_upload.py,
by default rewrites only the 64-hex ``?v=`` token inside the root ``"mapUrl"`` string, and
writes the migrated WAMs into a reviewed ZIP that ``release_upload.py prepare
--reviewed-wams`` accepts. Credentials come from the environment file and are
never printed. ``--auditorium-spacing`` additionally moves the three owned
areas in each zodiac room, keeping all controls and independent editor data.
"""
import argparse
import hashlib
import json
import pathlib
import re
import sys

from release_upload import Storage, read_zip, wam_reference, zip_bytes
from auditorium_spacing import ROOMS, auditorium_candidate
from office_wings import office_wings_candidate
from organizer_meetings import organizer_meetings_candidate
from enchanted_exploration import MAPS as EXPLORATION_MAPS, exploration_candidate

PLACEHOLDER = b'<VERSION>'
TOKEN_LENGTH = 64


def rewrite_token(path, data, new_pin):
    """Return ``data`` with only its mapUrl version token replaced by ``new_pin``.

    Pure function. Rejects a WAM without a single literal root mapUrl token
    (missing, duplicate or malformed) and proves the output keeps every byte
    outside the token and the exact input length.
    """
    if not isinstance(new_pin, str) or not re.fullmatch('[0-9a-f]{64}', new_pin):
        raise ValueError(f'{path}: replacement pin must be 64 lowercase hex')
    old_pin, protected = wam_reference(path, data)
    # The reference scanner replaced exactly the token with PLACEHOLDER; the first
    # differing byte is therefore the token start (hex never begins with '<').
    start = next((i for i, (a, b) in enumerate(zip(data, protected)) if a != b), None)
    if start is None or protected[start:start + len(PLACEHOLDER)] != PLACEHOLDER:
        raise ValueError(f'{path}: cannot isolate a single mapUrl version token')
    end = start + TOKEN_LENGTH
    if data[start:end] != old_pin.encode('utf-8') or data[:start] != protected[:start] or data[end:] != protected[start + len(PLACEHOLDER):]:
        raise ValueError(f'{path}: mapUrl token location does not match the validated reference')
    output = data[:start] + new_pin.encode('utf-8') + data[end:]
    assert len(output) == len(data), f'{path}: migrated WAM length changed'
    assert output[:start] == data[:start] and output[end:] == data[end:], f'{path}: bytes outside the token changed'
    migrated_pin, migrated_protected = wam_reference(path, output)
    if migrated_pin != new_pin or migrated_protected != protected:
        raise ValueError(f'{path}: migrated WAM failed re-validation')
    return output


def migrate(live, dist, *, auditorium_spacing=False, office_wings=False, organizer_meetings=False, enchanted_exploration=False):
    """Plan paired references and, only when requested, the closed area migration."""
    dist = pathlib.Path(dist)
    reviewed = {}
    summary = {'migrated': [], 'unchanged': [], 'missing': []}
    for path in sorted(p for p in live if p.endswith('.wam')):
        tmj = dist / (path[:-4] + '.tmj')
        if not tmj.is_file():
            summary['missing'].append(path)
            continue
        expected_pin = hashlib.sha256(tmj.read_bytes()).hexdigest()
        current_pin, _ = wam_reference(path, live[path])
        body = live[path]
        if auditorium_spacing and path in {'maps/' + room + '.wam' for room in ROOMS}:
            parsed = json.loads(body)
            updated = auditorium_candidate(path, parsed)
            if updated is not None:
                body = (json.dumps(updated, indent=2, ensure_ascii=False) + '\n').encode('utf-8')
            elif auditorium_candidate(path, parsed, already_current=True) is None:
                raise ValueError(f'{path}: owned saved areas differ from the reviewed auditorium predecessor/current geometry or controls')
        if office_wings and path in {'maps/' + room + '.wam' for room in ROOMS}:
            parsed = json.loads(body)
            updated = office_wings_candidate(path, parsed)
            if updated is None:
                raise ValueError(f'{path}: office append conflicts with the reviewed areas or saved editor data')
            if updated != parsed:
                body = (json.dumps(updated, indent=2, ensure_ascii=False) + '\n').encode('utf-8')
        if organizer_meetings and path in {'maps/' + room + '.wam' for room in ROOMS}:
            parsed = json.loads(body)
            updated = organizer_meetings_candidate(path, parsed)
            if updated is None:
                raise ValueError(f'{path}: organizer meeting conflicts with the reviewed office or saved editor data')
            if updated != parsed:
                body = (json.dumps(updated, indent=2, ensure_ascii=False) + '\n').encode('utf-8')
        if enchanted_exploration and path in {'maps/' + room + '.wam' for room in EXPLORATION_MAPS}:
            parsed = json.loads(body)
            updated = exploration_candidate(path, parsed)
            if updated is None:
                raise ValueError(f'{path}: exploration migration conflicts with owned saved areas; live editor data retained')
            if updated != parsed:
                body = (json.dumps(updated, indent=2, ensure_ascii=False) + '\n').encode('utf-8')
        if current_pin == expected_pin and body == live[path]:
            summary['unchanged'].append(path)
            continue
        reviewed[path] = rewrite_token(path, body, expected_pin)
        summary['migrated'].append(path)
    return reviewed, summary


def main(argv=None):
    parser = argparse.ArgumentParser(description='Re-pin live WAMs to final dist TMJ digests; optional reviewed auditorium geometry migration')
    parser.add_argument('--target', default='varcamp-demo')
    parser.add_argument('--environment', type=pathlib.Path, default=pathlib.Path(__file__).parent / 'private/environment')
    parser.add_argument('--dist', type=pathlib.Path, default=pathlib.Path('dist'))
    parser.add_argument('--out', required=True, type=pathlib.Path, help='reviewed WAM ZIP for release_upload.py prepare --reviewed-wams')
    parser.add_argument('--auditorium-spacing', action='store_true', help='Apply the reviewed twelve-room area geometry migration, preserving saved controls and editor data')
    parser.add_argument('--office-wings', action='store_true', help='Append four reviewed side-wing areas in each zodiac room, preserving existing editor content')
    parser.add_argument('--organizer-meetings', action='store_true', help='Enable a shared native meeting in each existing organizer office; retain all other editor data')
    parser.add_argument('--enchanted-exploration', action='store_true', help='Replace the reviewed five exploration area sets; preserve independent live editor data')
    args = parser.parse_args(argv)
    if not args.dist.is_dir():
        parser.error('Build the release first; dist/ is missing')
    live = read_zip(Storage(args.environment).download(args.target))
    reviewed, summary = migrate(live, args.dist, auditorium_spacing=args.auditorium_spacing, office_wings=args.office_wings, organizer_meetings=args.organizer_meetings, enchanted_exploration=args.enchanted_exploration)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(zip_bytes(reviewed))
    print(json.dumps({'target': args.target, 'out': str(args.out), 'liveWams': sum(p.endswith('.wam') for p in live),
                      'counts': {key: len(value) for key, value in summary.items()}, **summary}, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
