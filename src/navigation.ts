import { WORLD_CATALOG, type MapId } from './world/catalog';

function arrival(mapId: MapId, entry?: string): string {
  if (!Object.hasOwn(WORLD_CATALOG, mapId)) throw new Error(`Unknown map: ${mapId}`);
  const map = WORLD_CATALOG[mapId];
  const destinationEntry = entry ?? map.defaultEntry;
  if (!(map.entries as readonly string[]).includes(destinationEntry)) {
    throw new Error(`Unknown entry ${destinationEntry} for ${mapId}`);
  }
  return destinationEntry;
}

/** Keep every production destination in the current map-storage world. */
export function roomDestination(currentRoomId: string, mapId: MapId, entry?: string): string {
  const url = new URL(currentRoomId);
  if (!/^https?:$/.test(url.protocol) || !/^\/(?:~|@)\/[^/]+\/.+\.wam$/.test(url.pathname)) {
    throw new Error('Production navigation requires a hosted world WAM room URL');
  }
  return sibling(url, mapId, 'wam', arrival(mapId, entry));
}

/** TMJ asset URLs are for preview; they do not establish world-scoped persistence. */
export function previewDestination(currentMapUrl: string, mapId: MapId, entry?: string): string {
  const url = new URL(currentMapUrl);
  if (!/^https?:$/.test(url.protocol) || !url.pathname.endsWith('.tmj')) {
    throw new Error('Preview navigation requires an HTTP TMJ asset URL');
  }
  return sibling(url, mapId, 'tmj', arrival(mapId, entry));
}

function sibling(url: URL, mapId: MapId, extension: 'wam' | 'tmj', entry: string): string {
  url.pathname = `${url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1)}${mapId}.${extension}`;
  url.search = '';
  url.hash = entry;
  return url.href;
}

/** A playable preview room retains its instance and asset-host wrapper. */
export function previewRoomDestination(currentRoomId: string, mapId: MapId, entry?: string): string {
  const url = new URL(currentRoomId);
  if (!/^https?:$/.test(url.protocol) || !/^\/_\/[^/]+\/[^/]+\/.+\.tmj$/.test(url.pathname)) {
    throw new Error('Preview navigation requires a /_/ instance TMJ room URL');
  }
  return sibling(url, mapId, 'tmj', arrival(mapId, entry));
}
export function venueDestination(currentRoomId: string, mapId: MapId, entry?: string): string {
  return new URL(currentRoomId).pathname.startsWith('/_/')
    ? previewRoomDestination(currentRoomId, mapId, entry) : roomDestination(currentRoomId, mapId, entry);
}
