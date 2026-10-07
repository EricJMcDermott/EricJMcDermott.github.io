# A connected personal universe

The homepage sculpture is a portal, not a mode switch. Hovering or focusing a world link previews its shape, color, title, and description. Clicking that link navigates immediately. The sculpture itself is also a clearly labeled link to the previewed world. Native links keep touch, keyboard, open-in-new-tab, and no-JavaScript navigation intact.

The four worlds use the same typography, navigation, spacing, and motion controls. Their accent colors carry through into project and collection pages: green for Business, blue for Science, amber for Adventure, and lavender for Art. Each hub leads with relevant work. Galleries, paper search, writing search, and click-to-load videos provide useful interactions beneath that shared identity.

## Working on the site

This remains a static site. No runtime framework or package install is needed.

- `index.htm`, `home.css`, and `home.js`: homepage and interactive sculpture.
- `site.css` and `site.js`: shared navigation, subpage design, search, video loading, and accessible image viewer.
- `content/collections.json`: existing collection items, papers, and films.
- `scripts/build-pages.py`: generates the 17 subpages, synchronizes homepage navigation, and versions shared assets. Change page copy and layouts here, then run `python3 scripts/build-pages.py`.
- `scripts/check-site.py`: checks all page headings, case-sensitive local destinations, anchors, and image alternatives. Run `python3 scripts/check-site.py`.
- `scripts/preview.py`: starts a local preview at `http://127.0.0.1:8766/` with browser caching disabled.
- `scripts/prepare-thumbnails.py`: optional thumbnail generation using Pillow. Original media is preserved. Regenerate pages after creating thumbnails.
- `game-player.js`: loads the existing Unity builds only after Launch is selected. The builds themselves are unchanged.

Reduced-motion preferences are respected; an explicit pause choice follows the visitor between pages for the current browser session. Content and navigation remain usable without JavaScript; interactive viewers fall back to original media links.

References considered: [Lusion's project index](https://lusion.co/projects/) for making work central to exploration, [Bruno Simon](https://bruno-simon.com/) for interactive navigation, and [Awwwards' navigation collection](https://www.awwwards.com/websites/navigation/) for navigation patterns. The visual assets and implementation here are original or from Eric's existing site.
