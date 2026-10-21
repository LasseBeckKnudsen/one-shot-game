// The clearing's ground: the tiled grass multiplied by the baked light map (art-src/make_ground.py):
// R = cool shade cast by the trees and houses, G = warm sunlight that dapples through the canopy.
import { material, mix, pbr, saturate, smoothstep, texture, texture2d, uniform, uv, vec3, worldPosition } from '@gameengine/materials';

export default material('Ground', {
  blend: 'opaque',
  params: {
    grassMap: texture2d(),
    lightMap: texture2d(),
    tint: uniform.color('#a8b57e'),
    tiles: uniform.f32(110, { min: 1, max: 400 }),
    extent: uniform.f32(110, { doc: 'World metres the light map covers' }),
    shadeStrength: uniform.f32(0.42, { min: 0, max: 1 }),
    glowStrength: uniform.f32(0.32, { min: 0, max: 1 }),
  },
  surface: ({ grassMap, lightMap, tint, tiles, extent, shadeStrength, glowStrength }) => {
    const base = texture(grassMap, uv().mul(tiles)).rgb.mul(tint.rgb);
    const luv = saturate(worldPosition().swizzle('xz').div(extent).add(0.5));
    const l = texture(lightMap, luv);
    const shaded = base.mul(mix(vec3(1, 1, 1), vec3(0.50, 0.66, 0.86), l.r.mul(shadeStrength).mul(2.2)));
    const lit = shaded.add(vec3(1.0, 0.82, 0.45).mul(base).mul(l.g.mul(glowStrength).mul(2.4)));
    return pbr({ baseColor: lit, roughness: 0.95 });
  },
});
