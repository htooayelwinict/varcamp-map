"""Refresh the twelve hosted entrance images without rebuilding saved maps."""
import hashlib
import json
import struct
import zlib

from map_roster import MAP_IDS
from migrate_wam_tokens import rewrite_token
from release_upload import wam_reference

ROOMS = tuple(room for room in MAP_IDS if room.startswith('speaker-'))
NAME = 'Entrance / DigiSec Lab'
OLD_HASH = 'dcd17f1e33d49192d2ef1eaae7df3bf4bc1c50b89a5e6455c4ed474fc1c89eaa'
OLD_PATH = f'assets/sponsors/sponsor-digisec-entrance.{OLD_HASH}.png'
FOOTPRINT = {'tilewidth': 32, 'tileheight': 32, 'columns': 6, 'tilecount': 12,
             'imagewidth': 192, 'imageheight': 64}


def _png(png):
    """Check the exact non-interlaced RGBA format emitted by our Sharp exporter."""
    if not isinstance(png, bytes) or not png.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Entrance artwork must be a PNG')
    position, chunks, compressed = 8, [], bytearray()
    while position < len(png):
        if position + 12 > len(png):
            raise ValueError('Truncated entrance PNG chunk')
        length = struct.unpack('>I', png[position:position + 4])[0]
        end = position + 12 + length
        if end > len(png):
            raise ValueError('Truncated entrance PNG payload')
        kind = png[position + 4:position + 8]
        body = png[position + 8:position + 8 + length]
        checksum = struct.unpack('>I', png[end - 4:end])[0]
        if zlib.crc32(kind + body) & 0xffffffff != checksum:
            raise ValueError('Invalid entrance PNG checksum')
        if not chunks and kind != b'IHDR':
            raise ValueError('Entrance PNG must start with IHDR')
        if kind == b'IHDR':
            if chunks or length != 13 or struct.unpack('>IIBBBBB', body) != (192, 64, 8, 6, 0, 0, 0):
                raise ValueError('Entrance PNG must be 192 by 64, 8-bit RGBA, non-interlaced')
        elif kind == b'IDAT':
            compressed.extend(body)
        elif kind == b'IEND':
            if length or end != len(png):
                raise ValueError('Invalid entrance PNG terminator')
        elif not kind[0] & 32:
            raise ValueError('Unsupported critical entrance PNG chunk')
        chunks.append(kind)
        position = end
    if not chunks or chunks[-1] != b'IEND' or not compressed:
        raise ValueError('Incomplete entrance PNG')
    expected_size = 64 * (192 * 4 + 1)
    try:
        decoder = zlib.decompressobj()
        pixels = decoder.decompress(compressed, expected_size + 1)
    except zlib.error as error:
        raise ValueError('Invalid entrance PNG image data') from error
    if (len(pixels) != expected_size or not decoder.eof or decoder.unused_data
            or decoder.unconsumed_tail or any(pixels[y * 769] > 4 for y in range(64))):
        raise ValueError('Invalid entrance PNG scanlines')


def _json(raw):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError('Duplicate map JSON field')
            result[key] = value
        return result

    def invalid(value):
        raise ValueError('Non-JSON numeric value: ' + value)

    return json.loads(raw, object_pairs_hook=unique, parse_constant=invalid)


def entrance_logo_refresh(live: dict[str, bytes], png: bytes) -> dict[str, bytes]:
    """Return only an added hashed PNG and exact TMJ/WAM reference changes.

    Already refreshed references are accepted only with matching existing image
    bytes and WAM pins. All twelve speaker pairs must exist. No files are removed
    and no input data is mutated; callers retain normal full-world drift guards.
    """
    _png(png)
    digest = hashlib.sha256(png).hexdigest()
    target = f'assets/sponsors/sponsor-digisec-entrance.{digest}.png'
    expected_maps = {f'maps/{room}.{extension}' for room in ROOMS for extension in ('tmj', 'wam')}
    try:
        if not isinstance(live, dict) or {p for p in live if p.startswith('maps/speaker-') and p.endswith(('.tmj', '.wam'))} != expected_maps:
            raise ValueError('Exactly twelve known speaker map/WAM pairs are required')
        if OLD_PATH in live and hashlib.sha256(live[OLD_PATH]).hexdigest() != OLD_HASH:
            raise ValueError('Approved previous entrance asset bytes changed')
        if target in live and live[target] != png:
            raise ValueError('Existing destination image does not match its hash')
        changes = {}
        for room in ROOMS:
            path, wam = f'maps/{room}.tmj', f'maps/{room}.wam'
            raw = live[path]
            data = _json(raw)
            named = [item for item in data['tilesets'] if item.get('name') == NAME]
            layers = [item for item in data['layers'] if item.get('name') == NAME]
            if len(named) != 1 or len(layers) != 1 or layers[0].get('type') != 'tilelayer':
                raise ValueError(f'{path}: one existing entrance tile atlas and layer required')
            atlas = named[0]
            if any(type(atlas.get(key)) is not int or atlas[key] != value for key, value in FOOTPRINT.items()):
                raise ValueError(f'{path}: entrance image footprint changed')
            reference = atlas.get('image')
            if reference not in ('../' + OLD_PATH, '../' + target):
                raise ValueError(f'{path}: unknown entrance logo reference')
            asset_path = reference[3:]
            if asset_path not in live or hashlib.sha256(live[asset_path]).hexdigest() not in (OLD_HASH, digest):
                raise ValueError(f'{path}: referenced entrance asset missing or changed')
            pin, _ = wam_reference(wam, live[wam])
            if pin != hashlib.sha256(raw).hexdigest():
                raise ValueError(f'{wam}: saved version does not match the live map')
            old_literal = json.dumps(reference).encode()
            if raw.count(old_literal) != 1:
                raise ValueError(f'{path}: entrance URL must occur once as a literal JSON string')
            if reference == '../' + target:
                continue
            updated = raw.replace(old_literal, json.dumps('../' + target).encode(), 1)
            # Replace the exact URL bytes, retaining all whitespace and owner fields.
            changes[path] = updated
            changes[wam] = rewrite_token(wam, live[wam], hashlib.sha256(updated).hexdigest())
        if changes and target not in live:
            changes[target] = png
        return changes
    except (KeyError, TypeError, AttributeError, UnicodeError) as error:
        raise ValueError('Malformed hosted entrance map or asset data') from error
