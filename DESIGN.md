# The studio

An original, real-time 3D room connects Eric's professional work and personal collections. It is built from code with Three.js, using his actual photograph, stained glass, and inlay as textures. No reference site's models or code were copied.

The screen opens Business; the instrument opens Science; the window opens Adventure; the glass opens Art; the sample bench opens Woodworking; the notebook opens Writings. Objects and their native HTML hotspot links lead to the same destinations. Pointer movement changes the viewpoint subtly. Choosing an object moves toward it before opening the collection. A motion pause and reduced-motion support disable that travel. A lighting switch changes the scene's illumination.

The directory below the room provides ordinary links to every collection, including when WebGL or JavaScript is unavailable. Hotspots have explicit accessible names. On phones their labels are visible. Rendering skips off-screen and hidden-document frames, caps pixel density, and uses locally vendored dependencies.

## Files and workflow

- `index.htm`, `studio.css`, `studio.js`: studio, interactive scene, directory, and personal introduction.
- `assets/vendor/`: pinned Three.js 0.180.0 ES modules and MIT license. No runtime CDN dependency.
- `assets/home/`: existing optimized artwork, photographs, and font.
- `site.css`, `site.js`, `home.css`: shared subpage identity, ordered carousels, image viewer, and base styles.
- `scripts/build-pages.py`: collection-page generator and asset versioning. It invokes `scripts/build-case-studies.py` for the professional briefs.
- `content/collections.json`: original content and collection ordering.

Run:

```sh
python3 scripts/build-pages.py
python3 scripts/check-site.py
node --check studio.js
node --check site.js
python3 scripts/preview.py
```

The preview is http://127.0.0.1:8766/. Existing writings and Unity builds retain their original implementation. Photograph 76 remains the cover, not the first archive image. The finished framed Ducks in Flight is the cover; the build sequence stays intact. Woodworking uses Inlay Detail. String art remains in numerical order.

## Design references

The direction follows the user's references: [ULTRAGRID](https://ultragrid.studio/) for a navigable personal space; [Goodgrowth](https://goodgrowth.com/) for a coherent playful environment; and [HAOQI](https://haoqi.design/) for attention to materials and light. The room itself is an original combination of laboratory, workshop, and mountain outlook.

The earlier editorial “working atlas” direction was rejected. Its project research and briefs remain available deeper in the site, but its homepage layout is no longer used.
