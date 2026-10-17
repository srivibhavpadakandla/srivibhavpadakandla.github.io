# DriveForge — landing page

The public page for [DriveForge](https://driveforge.srivibhavp.workers.dev/), an FTC BIOBUZZ driving
simulator. Served by GitHub Pages at https://srivibhavpadakandla.github.io/.

This repository holds only the landing page. DriveForge itself is a separate, private application.

## What's here

- `index.html`, `assets/site.css`: the page.
- `assets/robot-scroll.js`: the scroll animation (three.js from jsDelivr). The robot builds up from a
  wireframe as you scroll, and the camera moves to one pose per section. With "reduce motion" on, the
  idle sway is off. Without WebGL, `assets/poster.jpg` is shown instead.
- `assets/input-output.glb`: the robot model (see credit below), compressed with meshopt.

To preview locally: `python3 -m http.server 8765`, then open http://localhost:8765/.

## Credits

Robot model: [Input/Output robot](https://sketchfab.com/3d-models/ftc17438-inputoutput-robot-model-29032024-064bd2c2d386497c94e9e6ad58f7603e)
by FTC Team 17438, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Changes:
compressed for the web (deduplicated, welded, re-centred, meshopt-encoded); geometry otherwise unchanged.

DriveForge is an independent practice tool, not affiliated with or endorsed by *FIRST*®.
*FIRST*® and *FIRST*® Tech Challenge are registered trademarks of *FIRST*.
