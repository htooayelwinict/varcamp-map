export type MapId = `speaker-${SignId}` | 'air-district' | 'campus-exploration' | 'comet-maze' | 'constellation-shore' | 'earth-district' | 'fa-ship' | 'fa-ship-interior' | 'fire-district' | 'hidden-observatory' | 'lunar-hall' | 'moon-cafe' | 'moon-grotto' | 'nebula-arcade' | 'orbit-maze' | 'orbit-playground' | 'overworld' | 'shipyard-beach' | 'solar-hall' | 'star-garden' | 'stargazer-terrace' | 'water-district' | 'zodiac-festival-park';
export type SignId = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
export type ElementId = 'fire' | 'earth' | 'air' | 'water';
export interface MapDefinition {
  readonly width: number;
  readonly height: number;
  readonly defaultEntry: string;
  readonly entries: readonly string[];
}

export const WORLD_CATALOG = {
  "fa-ship-interior": {"width":40,"height":26,"defaultEntry":"from-upper-deck","entries":["from-upper-deck"]},
  "air-district": {
    "width": 36,
    "height": 34,
    "defaultEntry": "air-entry",
    "entries": [
      "air-entry"
    ]
  },
  "campus-exploration": {
    "width": 48,
    "height": 48,
    "defaultEntry": "plaza-arrival",
    "entries": [
      "from-fire",
      "from-air",
      "from-earth",
      "from-water",
      "from-star-garden",
      "from-moon-cafe",
      "from-moon-grotto",
      "from-stargazer-terrace",
      "plaza-arrival",
      "from-solar",
      "from-lunar",
      "from-maze",
      "from-observatory",
      "from-arcade",
      "from-festival",
      "from-wheel",
      "start"
    ]
  },
  "comet-maze": {
    "width": 48,
    "height": 48,
    "defaultEntry": "comet-entry",
    "entries": [
      "comet-entry"
    ]
  },
  "constellation-shore": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arrival",
    "entries": [
      "arrival"
    ]
  },
  "earth-district": {
    "width": 36,
    "height": 34,
    "defaultEntry": "earth-entry",
    "entries": [
      "earth-entry"
    ]
  },
  "fa-ship": {
    "width": 48,
    "height": 56,
    "defaultEntry": "arrival",
    "entries": [
      "from-lower-deck",
      "arrival"
    ]
  },
  "fire-district": {
    "width": 36,
    "height": 34,
    "defaultEntry": "fire-entry",
    "entries": [
      "fire-entry"
    ]
  },
  "hidden-observatory": {
    "width": 40,
    "height": 36,
    "defaultEntry": "observatory-entry",
    "entries": [
      "observatory-entry"
    ]
  },
  "lunar-hall": {
    "width": 64,
    "height": 56,
    "defaultEntry": "lunar-entry",
    "entries": [
      "lunar-entry"
    ]
  },
  "moon-cafe": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arrival",
    "entries": [
      "arrival"
    ]
  },
  "moon-grotto": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arrival",
    "entries": [
      "arrival"
    ]
  },
  "nebula-arcade": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arcade-entry",
    "entries": [
      "arcade-entry"
    ]
  },
  "orbit-maze": {
    "width": 80,
    "height": 80,
    "defaultEntry": "maze-entry",
    "entries": [
      "maze-entry",
      "from-comet"
    ]
  },
  "orbit-playground": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arrival",
    "entries": [
      "arrival"
    ]
  },
  "overworld": {
    "width": 128,
    "height": 128,
    "defaultEntry": "welcome",
    "entries": [
      "welcome",
      "from-speaker-aries",
      "from-speaker-taurus",
      "from-speaker-gemini",
      "from-speaker-cancer",
      "from-speaker-leo",
      "from-speaker-virgo",
      "from-speaker-libra",
      "from-speaker-scorpio",
      "from-speaker-sagittarius",
      "from-speaker-capricorn",
      "from-speaker-aquarius",
      "from-speaker-pisces",
      "from-solar",
      "from-lunar",
      "from-maze",
      "from-festival",
      "from-shipyard",
      "from-campus",
      "from-fire",
      "from-earth",
      "from-air",
      "from-water",
      "from-observatory",
      "from-arcade"
    ]
  },
  "shipyard-beach": {
    "width": 48,
    "height": 48,
    "defaultEntry": "shipyard-entry",
    "entries": [
      "shipyard-entry",
      "from-fa-ship",
      "from-constellation-shore"
    ]
  },
  "solar-hall": {
    "width": 64,
    "height": 56,
    "defaultEntry": "solar-entry",
    "entries": [
      "solar-entry"
    ]
  },
  "speaker-aquarius": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-aries": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-cancer": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-capricorn": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-gemini": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-leo": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-libra": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-pisces": {
    "width": 36,
    "height": 48,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-sagittarius": {
    "width": 40,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-scorpio": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-taurus": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "speaker-virgo": {
    "width": 36,
    "height": 46,
    "defaultEntry": "speaker-entry",
    "entries": [
      "speaker-entry"
    ]
  },
  "star-garden": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arrival",
    "entries": [
      "arrival"
    ]
  },
  "stargazer-terrace": {
    "width": 40,
    "height": 40,
    "defaultEntry": "arrival",
    "entries": [
      "arrival"
    ]
  },
  "water-district": {
    "width": 36,
    "height": 34,
    "defaultEntry": "water-entry",
    "entries": [
      "water-entry"
    ]
  },
  "zodiac-festival-park": {
    "width": 48,
    "height": 48,
    "defaultEntry": "festival-entry",
    "entries": [
      "festival-entry",
      "from-arcade",
      "from-playground"
    ]
  }
} as const satisfies Record<MapId, MapDefinition>;

export const SIGN_IDS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'] as const satisfies readonly SignId[];
export const ELEMENT_IDS = ['fire', 'earth', 'air', 'water'] as const satisfies readonly ElementId[];
