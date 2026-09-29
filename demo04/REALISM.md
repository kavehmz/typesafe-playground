# The second visual pass

This pass replaces the simple scene with a more detailed, naturalistic countryside. It remains a live Three.js world: the scenery, cars, pedestrians, reflections and shadows are rendered in real time. There are no prerecorded driving images or substituted decisions.

## The world

- Sculpted vehicle bodies have open wheel arches, curved glass, flush pillars, clearcoat paint, split-spoke wheels, brake discs, recessed lights, number plates and a shaped rear diffuser. Steering, wheel rotation, brake lamps, indicators and small suspension movements follow actual simulated state.
- Pedestrians have articulated limbs, clothing and faces. The gait follows the real crossing state; they remain standing while waiting.
- Oak, birch and pine trees use branching trunks, bark and dense cutout leaf sprays, with wind driven by simulation time. Meadows have varied surface colour, textured grass, irregular verge plants, shrubs, flowers and distant woodland.
- Houses have chamfered plaster walls, foundations, tiled gable or hip roofs, gutters, shutters, framed windows, rooflights, porches, garden fences and hedges. Asphalt has aggregate, wear and repair variation; shoulders, road posts and lamps give the road scale.
- A procedural sky, clouds, atmospheric haze and sun provide the lighting. Clear morning, late afternoon and golden hour are visual alternatives; they do not change road friction, perception or the driving problem.
- The car paint and glass reflect the surrounding scene. Main-view contact shading, antialiasing and a restrained colour finish add depth. Own-car camera previews retain their original sensor mounts and hide the car body for a clear view.

## Files and ownership

| File | Responsibility |
| --- | --- |
| `public/scene.mjs` | Integrates the visual layers, cameras, sensor overlays, reflection capture and rendering |
| `public/vehicles.mjs` | Vehicle/pedestrian models and visual animation |
| `public/landscape.mjs` | Terrain, trees, grass, vegetation and distance detail |
| `public/roadside.mjs` | Road, markings, signs, crossings, lamps and architecture |
| `public/atmosphere.mjs` | Sky, sun, environment lighting and main-camera finish |

Geometry and texture assets are generated locally by these modules. No external art download, CDN, additional dependency or host package installation is required. The original pinned Three.js dependency is retained.

## Fidelity and performance

All model inputs, prompts, perception, world actor positions and mechanics remain in the original Fable modules. The preservation guard compares 18 protected files, plus the browser's `decide()` and `frame()` sections, against demo03. Only the server's startup label may differ.

Visual geometry is batched and instanced. Terrain, trees, architecture and actors use distance culling, and foliage has near/far detail. Shadow maps update once per frame; environment reflections update periodically rather than for every camera. Resetting a scene disposes geometry, materials, textures and instance buffers. Main-camera antialiasing resolution is capped to avoid excessive pixel work on dense screens.

The measured results and actual session trace are in [VERIFICATION.md](VERIFICATION.md). Frame-rate measurements describe the tested browser and machine; they are not a guarantee for every device. Scenery remains cosmetic, as in demo03: Jev's structured sensors do not treat the newly detailed houses, plants or weather appearance as new obstacles.
