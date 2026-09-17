# Driving simulation — user brief

Build a small, visually appealing 3D driving demo to test whether **TypeSafe Jev can make the driving decisions in increasingly complex traffic situations**. This brief consolidates my requests, with later corrections taking precedence. The appearance may differ from the previous demo; preserve my intent rather than copying its implementation.

## Setup

- Create the app in a `demo03` directory.
- Run it in Docker or Docker Compose. Avoid installing random packages directly on my MacBook.
- The API secret is in `.env`.
- Read the entire TypeSafe skill at <https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md>. Use it only for this session; **do not install the skill**. Be honest if you cannot read it completely.
- The demo must actually call our TypeSafe API and use Jev to decide how our car drives. It must not merely look like an AI-controlled demo while using mocked decisions.

## Road, traffic and run length

- Make a small 3D road with **two lanes total**. Our car drives on the **right**; the **left is for traffic coming toward us**. It is not a second lane travelling in our direction.
- Put our car in this world and give its driving decisions to Jev.
- Include moving traffic with varied starting positions and speeds. Use fewer cars rather than creating an unbroken wall of traffic.
- Cars travelling ahead of us should be substantially slower than ours, roughly **10–20 km/h**, and should not all travel at the same speed. There should be gaps and meaningful opportunities to overtake.
- Randomize the **cars' positions along the road, spacing and speeds** enough to create different driving situations. Randomizing scenery alone is not what I care about.
- My original idea included fixed obstacles. Replace that emphasis with **moving cars and pedestrians crossing the road at zebra crossings**. Avoid a scenario where the other cars quickly pile up at obstacles and the rest of the run is just obstacle avoidance.
- Choose the number of cars, crossings and pedestrians sensibly. I did not prescribe exact counts; the road should be interesting without feeling overcrowded or empty.
- Make the run length selectable: **90, 120 or 180 seconds**, up to three minutes. This supersedes my earlier shorter-duration requests. Make the road long enough for the selected run.
- Restart for another run when the car reaches the finish, so the demo can be watched repeatedly.

## What Jev should be able to sense

- Simulate camera views and other sensor inputs, and give Jev enough information to make driving decisions.
- Provide useful surrounding coverage. I suggested **front, left and right views**, with a **rear view** if feasible. I later left the choice of more cameras, more sensors, or a mixture to you; the important thing is that Jev can assess the surrounding traffic and blind spots.
- Front sensing must let Jev assess the road ahead, approaching traffic and whether there is enough time and space to overtake and return.
- Include **distances to cars, pedestrians and the crossing/stop line**, together with relevant speed and motion information. A visible object far away should not be treated the same as an immediate obstruction.
- Let decisions account for our speed, relative motion, available gaps, road conditions and API response delay. A few hundred milliseconds of latency should be considered rather than used as a reason to stop excessively far away.
- Make sensing visible in the page/3D scene: I want the audience to see what the sensors detect and then see what Jev decides. If there is a blind-spot sensor, its presence and detections should be apparent.

## Driving behaviour to aim for

- **Keep right normally.** Overtake slower traffic using the opposing lane only when road conditions, visibility, oncoming traffic, available time and speed limits permit it.
- Try to make progress and overtake when conditions allow, rather than indefinitely sitting behind slow cars.
- Reassess the situation during the manoeuvre. Jev should decide how to resolve changing or complex situations using all available views and sensor information.
- **Return to the right lane after overtaking.** Do not remain cruising in the opposing lane.
- Before returning, account for the car being passed and other nearby cars. Do not cut back too early and hit a car on the right.
- If following a moving car, **match its speed naturally** rather than repeatedly stopping, waiting for it to move away, and starting again.
- Seeing a distant car should not by itself cause an abrupt stop or premature steering manoeuvre.
- For a pedestrian crossing, approach in a controlled way and, when necessary, stop reasonably close to the zebra/stop line. Do not stop far up the road simply because a crossing pedestrian is visible. As the car slows, Jev should be able to decide to continue approaching while enough room remains.
- Lane changes must look like **driving through a turn**, with appropriate vehicle orientation, rather than sliding the car sideways or shifting it abruptly across the road.
- These improvements must come from giving Jev useful inputs and suitable control choices. **Do not fake success by secretly replacing its driving decisions with scripted following, overtaking, merging or pedestrian handling.** The purpose is to see how well Jev handles the complexity.

## Speed signs and memory

- Include **30 and 50 km/h** speed-limit signs: 30 represents a slower section and 50 normal progress.
- Jev must consider speed limits in its decisions.
- Remember the applicable sign after it leaves view, and retain relevant observations of upcoming signs. Supply that information to Jev so each decision has the necessary context.
- Add a clear, attractive indicator showing the audience the sign situation: what has been seen and what limit the car is currently considering.

## Presentation and handoff

- Present the driving, sensing and Jev's decisions clearly in an attractive 3D page. I liked the whole-page presentation; an exact visual match is unnecessary.
- Tell me when the demo is ready. If something is not feasible, say so plainly.
- As a follow-on, I also asked for a video clip suitable for posting on **X**, showing the demo/page. QuickTime is an acceptable recording option if available. If you cannot capture it, tell me and I can record it myself. I paused that request while we improved the driving behaviour.

The rendering technology, interface layout, exact vehicle counts, sensor implementation and other engineering choices are left to the implementer. They are not prescribed by this brief.
