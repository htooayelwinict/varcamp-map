// Only active plaza exteriors: unused historical aliases retain their contracts.
const frontages=new Set([
 'aries-citadel','grounded-zodiac-physical-taurus','grounded-zodiac-physical-gemini',
 'cancer-citadel','leo-citadel','grounded-zodiac-physical-virgo',
 'grounded-zodiac-physical-libra','grounded-zodiac-physical-scorpio',
 'grounded-zodiac-physical-sagittarius','capricorn-citadel',
 'grounded-zodiac-physical-aquarius','grounded-zodiac-physical-pisces',
 'grounded-hall-building-solar','grounded-hall-building-lunar',
]);

/** Expected current descriptor for historical guards. Keep the front row
 * behind approaching Wokas without moving walls or lowering the roof. */
export function currentBuildingFrontSprite<T extends object>(id:string,sprite:T):T{
 return frontages.has(id)
  ?{...sprite,upperCells:Array.from({length:132},(_,i)=>[i%12,Math.floor(i/12)])}
  :sprite;
}
