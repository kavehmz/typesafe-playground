# Third presentation pass

The previous version was committed and pushed as `c857918b6dda7f495f856b0672b0e46d16d76a82` before this work began. This pass improves the entire visible world, including people, while preserving the original driving program.

## People and motion

Six adult character designs now have different proportions, faces, hair, clothing and accessories. Trousers are a continuous skinned mesh through the hips and knees. Shoulder slopes, necklines, hands, shoes and garment clearances were reviewed in full-body and close-up studies.

Walking follows the actor's actual displacement. Inverse kinematics keeps the supporting foot planted and gives the swinging foot clearance, with restrained torso and arm motion. Waiting and completed actors keep their feet on the ground. Pausing stops the pose clock. A renderer-only surface-height query aligns feet with raised crossing pavement; it does not change actor positions or crossing schedules.

The dedicated `public/pedestrians.mjs` owns these models and animations. Standard figures have approximately 17,920 triangles and 14 meshes. Skeleton resources are disposed during world resets.

## Countryside and architecture

The fields now have cultivated parcels, crop rows, hedgerows and orchard pockets. Distant woodland uses dimensional crowns and foliage instead of crossed tree silhouettes. Mossy stones, denser verges and reed-fringed ponds add variety beyond the road. The flat corridor beside the road remains level for the existing houses and crossings.

Four building families replace the uniform house kit: dormer cottages, stone/slate cottages, brick farmhouses and taller village homes. They have actual recessed openings, varied roofs, porches, gardens, sheds, planters and furniture. Crossing furniture is attached only to existing crossings. Road, sign and crossing positions are preserved.

Touring cars, compact hatchbacks and sport coupés share the simulation's original footprint but have different rooflines, doors, glass, trim and wheels. Light now gives the clouds more depth and golden hour has a visible low sun, with restrained highlight bloom.

## Camera views

- **Cinematic view** frames the actual drive, with a lower tracking angle during ordinary progress and passing, and a crossing view when the car approaches a stop. This is camera choreography, not a new driving policy.
- **Explore view** lets you choose an actual car or person from **Subject**, drag to orbit, scroll or pinch to zoom, or select a visible subject directly. **Follow Jev** returns to the car. Distant selections cut directly to their subject rather than flying through unloaded scenery.

These are audience cameras. They can show people outside Jev's current coverage. The four sensor previews remain mounted on the ego vehicle, and Jev continues to receive the same structured observations rather than rendered images.

## Verification

The preservation guard still verifies 18 protected files and the decision-request and simulation-frame loops against demo03. Frozen-world rendering audits check that presentation modules do not mutate actor state. Actual browser tests cover the new cameras, selection, gestures, lighting, long routes, repeated resets, export and real driving.

See [VERIFICATION.md](VERIFICATION.md) for measured results and saved traces. The third-pass evidence lives under `artifacts/round3/`.
