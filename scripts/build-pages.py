#!/usr/bin/env python3
"""Render the site's static pages. Run from any directory; no dependencies required."""
from pathlib import Path
from html import escape as esc
import json
import re
import hashlib
import runpy

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'content/collections.json').read_text())
WORLDS = [('business', 'Business', '01', 'Ideas into action.'), ('science', 'Science', '02', 'Follow the question.'), ('adventure', 'Adventure', '03', 'Take the long way.'), ('art', 'Art', '04', 'Make something real.')]


def version_assets(markup):
    def replace(match):
        base=match.group(1)
        filename=base.split('/')[-1].split('"')[-1]
        version=hashlib.sha256((ROOT/filename).read_bytes()).hexdigest()[:10]
        return base+'?v='+version+'"'
    markup = re.sub(r'((?:src|href)="[^"?]*(?:home|site|studio|portfolio|game-player)\.(?:css|js))(?:\?[^"]*)?"', replace, markup)
    cv_version = hashlib.sha256((ROOT/'science/EJM-CV.pdf').read_bytes()).hexdigest()[:10]
    return re.sub(r'(href="[^"?]*EJM-CV\.pdf)(?:\?[^"]*)?"', lambda match: match.group(1)+'?v='+cv_version+'"', markup)


def nav(prefix, current=''):
    links = f'<a href="{prefix}">Studio</a><a href="{prefix}#directory">Explore</a><a href="{prefix}#about">About</a><a href="{prefix}science/EJM-CV.pdf" target="_blank" rel="noopener">CV ↗</a>'
    return f'''<header class="universe-header">
  <a class="wordmark" href="{prefix}" aria-label="Eric James McDermott home">EJM<span class="brand-star" aria-hidden="true">✳</span></a>
  <span class="universe-name">ERIC JAMES<br>McDERMOTT</span>
  <nav class="universe-nav" aria-label="Main navigation">{links}</nav>
  <a class="universe-contact" href="mailto:EricJamesMcDermott@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
</header>'''


def footer(prefix, world):
    links = ''.join(f'<a href="{prefix}{slug}/"><small>{number} / NEXT WORLD</small><span>{name} ↗</span></a>' for slug, name, number, _ in WORLDS if slug != world)
    return f'''<section class="continue-exploring"><div class="eyebrow">KEEP FOLLOWING YOUR CURIOSITY</div><nav aria-label="Continue exploring">{links}</nav></section>
<footer class="universe-footer"><a href="{prefix}">← All worlds</a><span>ERIC JAMES McDERMOTT</span><a href="mailto:EricJamesMcDermott@gmail.com">Start a conversation ↗</a></footer>'''


def page(directory, world, label, title, description, content, feature='', jump='Explore the collection', gallery=False, extra_head='', extra_script='', filename='index.htm'):
    depth = len(Path(directory).parts)
    prefix = '../' * depth
    name = dict((slug, name) for slug, name, _, _ in WORLDS)[world]
    number = next(n for s, _, n, _ in WORLDS if s == world)
    breadcrumbs = f'<a href="{prefix}">Home</a><span>/</span>'
    breadcrumbs += f'<a href="{prefix}{world}/">{name}</a><span>/</span><span aria-current="page">{esc(label)}</span>' if directory != world else f'<span aria-current="page">{name}</span>'
    if directory in ['SpaceFossilsWEB', 'BoxShooter', 'Rollerball', 'SolarSystem']:
        breadcrumbs = f'<a href="{prefix}">Home</a><span>/</span><a href="{prefix}art/">Art</a><span>/</span><a href="{prefix}games/">Games</a><span>/</span><span aria-current="page">{esc(label)}</span>'
    jump_link = f'<a class="round-link" href="#collection"><span class="round-arrow" aria-hidden="true">↓</span><span>{esc(jump.upper())}</span></a>' if jump else ''
    modal = '''<dialog class="image-viewer" aria-label="Image viewer"><div class="viewer-toolbar"><p id="viewer-caption" aria-live="polite"></p><a id="viewer-original" target="_blank" rel="noopener">Open original ↗</a><button type="button" data-close-viewer aria-label="Close image viewer">Close ×</button></div><div class="viewer-stage"><button type="button" data-previous-image aria-label="Previous image">←</button><img id="viewer-image" alt=""><button type="button" data-next-image aria-label="Next image">→</button></div><p class="viewer-help">Use ← → to explore · Esc to close</p></dialog>''' if gallery else ''
    result = f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#111310"><meta name="description" content="{esc(description, quote=True)}"><title>{esc(label)} — Eric James McDermott</title><link rel="icon" href="{prefix}assets/home/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="{prefix}home.css"><link rel="stylesheet" href="{prefix}site.css">{extra_head}<script src="{prefix}site.js" defer></script></head>
<body class="world-page" data-world="{world}" id="top"><a class="skip-link" href="#collection">Skip to content</a><div class="reading-progress" aria-hidden="true"></div>
{nav(prefix, world)}
<main><section class="page-hero {'has-feature' if feature else ''}"><nav class="breadcrumbs" aria-label="Breadcrumb">{breadcrumbs}</nav><div class="page-hero-grid"><div class="page-hero-copy"><p class="eyebrow">{number} / {name.upper()} <span>— {esc(label.upper()) if directory != world else 'THE WORLD'}</span></p><h1>{title}</h1><p class="page-description">{esc(description)}</p>{jump_link}</div>{feature}</div></section>
{content}
</main>{footer(prefix, world)}{modal}{extra_script}</body></html>'''
    (ROOT / directory / filename).write_text(version_assets(result) + '\n')


def heading(kicker, title, right=''):
    return f'<div class="content-heading"><div><p class="eyebrow">{kicker}</p><h2>{title}</h2></div>{right}</div>'


def section(content, title, kicker='SELECTED WORK', id='collection', light=True, right=''):
    return f'<section class="content-section {"paper-section" if light else "dark-section"}" id="{id}">{heading(kicker,title,right)}{content}</section>'


def card(href, image, title, text, tag='', contain=False):
    return f'<a class="work-card reveal" href="{href}"><div class="work-image {"contain-image" if contain else "illustration-image" if image.endswith(".svg") else ""}"><img src="{image}" alt="{esc(title)}" loading="lazy" width="720" height="540"><span class="work-enter" aria-hidden="true">↗</span></div><div class="work-meta">{tag}<span aria-hidden="true">↗</span></div><h3>{title}</h3><p>{text}</p></a>'


def video(identifier, title):
    return f'<article class="film-card reveal"><div class="video-frame"><button class="video-play" type="button" data-play-video="{identifier}" data-video-title="{esc(title,quote=True)}" aria-label="Play {esc(title,quote=True)}"><span class="video-poster-title" aria-hidden="true">{esc(title.split(" — ")[0])}</span><span class="play-disc" aria-hidden="true">▶</span><span class="video-play-label">PLAY FILM ↗</span></button></div><h3>{esc(title)}</h3><a class="quiet-link" href="https://www.youtube.com/watch?v={identifier}" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></article>'


def search(placeholder):
    return f'<div class="collection-search" data-enhance hidden><label for="collection-search">{placeholder}</label><input type="search" id="collection-search" data-search placeholder="{placeholder}" autocomplete="off"><span class="search-count" data-search-count aria-live="polite"></span></div>'


def gallery(items, directory, group, writings=False):
    cards=[]
    for i, item in enumerate(items):
        if isinstance(item, str): item={'src':item,'title':f'{group} — {i+1:02d}'}
        title=item['title']; source=item['src']
        thumb=item.get('thumb',source)
        # Optimized thumbnails are generated from the original media, never replacing it.
        asset=(directory+'-'+source).replace('/','-').rsplit('.',1)[0]+'.webp'
        if (ROOT/'assets/gallery'/asset).exists(): thumb='../assets/gallery/'+asset
        cards.append(f'<figure class="gallery-item reveal" data-search-item data-search-text="{esc(title,quote=True)}"><a href="{esc(source,quote=True)}" data-gallery="{group}" data-caption="{esc(title,quote=True)}" aria-label="Open {esc(title,quote=True)}"><img src="{esc(thumb,quote=True)}" alt="{esc(title,quote=True)}" loading="lazy" width="600" height="450"><span class="gallery-open" aria-hidden="true">{"Read" if writings else "View"} ↗</span></a><figcaption>{esc(title)}</figcaption></figure>')
    return '<div class="gallery-grid '+('writing-grid' if writings else '')+'">'+''.join(cards)+'</div><p class="search-empty" data-search-empty hidden>No matching work. Try another word.</p>'


def carousel(items, directory, group, limit=None, collection_link=None, show_titles=True):
    """A swipeable strip that can open a collection image or lead to its archive."""
    slides=[]
    for i, item in enumerate(items[:limit] if limit else items):
        if isinstance(item, str): item={'src':item,'title':f'{group} — {i+1:02d}'}
        title=item['title']; source=item['src']
        asset=(directory+'-'+source).replace('/','-').rsplit('.',1)[0]+'.webp'
        thumb='../assets/gallery/'+asset if (ROOT/'assets/gallery'/asset).exists() else source
        href=collection_link or source
        carousel_group=esc(group+' carousel',quote=True)
        attrs='' if collection_link else f' data-gallery="{carousel_group}" data-caption="{esc(title,quote=True)}"'
        if not show_titles: attrs+=' data-hide-caption'
        visible_title=f'<span class="carousel-slide-title">{esc(title)}</span>' if show_titles else ''
        slides.append(f'<a class="carousel-slide" href="{esc(href,quote=True)}"{attrs} aria-label="{esc(title,quote=True)}"><img src="{esc(thumb,quote=True)}" alt="{esc(title,quote=True)}" loading="lazy" width="800" height="600">{visible_title}</a>')
    total=len(slides)
    return f'''<div class="collection-carousel" data-carousel aria-label="{esc(group,quote=True)} carousel">
  <div class="carousel-track" data-carousel-track tabindex="0">{''.join(slides)}</div>
  <div class="carousel-controls"><span class="carousel-count" data-carousel-count aria-live="polite">01 / {total:02d}</span><div class="carousel-progress" aria-hidden="true"><span data-carousel-progress></span></div><button type="button" data-carousel-prev aria-label="Previous image">←</button><button type="button" data-carousel-next aria-label="Next image">→</button></div>
</div>'''


def cover(image, target, label, detail):
    return f'<a class="hero-feature photo-feature" href="{target}" aria-label="{esc(label,quote=True)}"><img src="{image}" alt="{esc(label,quote=True)}" width="1200" height="900"><div class="feature-caption"><span>{esc(detail)}</span><span class="feature-arrow" aria-hidden="true">↗</span></div></a>'


# The four hubs: one visual system, with content and actions specific to each world.
meucci_feature='''<a class="hero-feature meucci-feature" href="../work/meuccitech/" aria-label="Explore Meuccitech"><div class="feature-topline eyebrow">FEATURED PROJECT <span>VOICE AI / AUDIOBOOKS</span></div><img src="../assets/work/audio-pipeline.svg" alt="Meuccitech audio production waveform" width="900" height="600"><div class="feature-caption"><span>Meuccitech<small>From voice AI to finished audio.</small></span><span class="feature-arrow" aria-hidden="true">↗</span></div></a>'''
business_cards = '<div class="work-grid">'+card('../work/applied-ai/','../assets/work/knowledge-map.svg','Applied AI at diconium','AI products, hands-on engineering, and cross-functional team leadership.','AI / PRODUCT / LEADERSHIP')+card('../work/meuccitech/','../assets/work/audio-pipeline.svg','Meuccitech','From voice AI to a commercial audiobook production business.','FOUNDER / HEAD OF PRODUCT')+card('https://babybabyapp.com/','../business/baby-app-images/BabyBabyApp_page1.png','BabyBaby','A parents’ companion, from concept through launch.','PRODUCT / APP',True)+card('../work/rehality/','../assets/work/rehality-loop.svg','Rehality','Connecting neuroscience, XR, and a four-partner research consortium.','RESEARCH / LEADERSHIP')+'</div>'
business = section(business_cards,'From idea to everyday.','01 / VENTURES & PRODUCTS')
business += section('<div class="film-grid">'+video('UgrSs2XZVqs','Rehality — MedTech Startup School · Second place')+video('_RgH6a_CNj0','Prometheus Science — MedTech Startup School · First place')+'</div>','Make the case.','02 / PITCHES & PRESENTATIONS',id='presentations',light=False)
business += section('<div class="resource-list"><a class="resource" href="../science/EJM-CV.pdf" target="_blank" rel="noopener"><span>01</span><h3>Curriculum vitae</h3><small>PDF ↗</small></a><a class="resource" href="https://www.linkedin.com/in/ejmcdermott/" target="_blank" rel="noopener noreferrer"><span>02</span><h3>Let’s connect on LinkedIn</h3><small>LINKEDIN ↗</small></a></div>','Keep the conversation going.','03 / CONNECT',id='connect')
page('business','business','Business','Ideas into<br><em>action.</em>','Ventures, products, and experiments that turn a good question into something useful.',business,meucci_feature,'Explore ventures')

science_feature='''<a class="hero-feature signal-feature" href="#collection"><div class="feature-topline eyebrow">THE LAB <span>BRAIN / BODY / INTERFACE</span></div><div class="signal-orb" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></div><div class="feature-caption"><span>Follow the signal.<small>Papers, research, and presentations.</small></span><span class="feature-arrow" aria-hidden="true">↓</span></div></a>'''
papers='<div class="resource-list">'+''.join(f'<a class="resource reveal" data-search-item data-search-text="{esc(p["title"],quote=True)}" href="{esc(p["href"],quote=True)}" target="_blank" rel="noopener noreferrer"><span>{i+1:02d}</span><h3>{esc(p["title"])}</h3><small>{"PDF" if ".pdf" in p["href"] else "PAPER"} ↗</small></a>' for i,p in enumerate(DATA['papers']))+'</div><p class="search-empty" data-search-empty hidden>No matching papers. Try another word.</p>'
science=section('<a class="large-link" href="../work/rehality/"><span>Neuroscience, XR, and research translation.</span><strong>Explore Rehality ↗</strong></a>','Research into practice.','01 / RESEARCH CONTEXT',id='research-context')
science+=section(search('Find a paper or topic')+papers,'Questions worth following.','01 / PAPERS & READING')
science+=section('<div class="film-grid">'+''.join(video(i,t) for i,t in [('8Jv4oByOR0g','Virtual Reality Based Neurorehabilitation — DGKN 2021'),('BLg1opVH028','Vision Restoration with Optogenetics'),('IdS0Tsxkxwc','Mapping out the Baseball Swing')])+'</div>','From the lab, out loud.','02 / PRESENTATIONS',id='presentations',light=False)
science+=section('<a class="large-link" href="EJM-CV.pdf" target="_blank" rel="noopener"><span>The background. The experience.</span><strong>Read my CV ↗</strong></a>','A little more context.','03 / CURRICULUM VITAE',id='cv')
page('science','science','Science','Follow the<br><em>question.</em>','Neuroscience, movement, and human–computer interaction. Exploring the connections between brains, bodies, and technology.',science,science_feature,'Explore the research')

photo76=next(x for x in DATA['portfolio'] if x['title']=='Photograph 76')
adventure_feature=cover('../assets/home/photograph-76-1200.webp','../portfolio/','Photograph 76','Explore photography.')
adventure=section('<div class="work-grid">'+card('../portfolio/','../assets/home/photograph-76-1200.webp','Through my lens.','Landscapes, small details, and moments from the road.','01 / PHOTOGRAPHY')+card('../video/','../portfolio/src/images/newThumb-20.jpg','Stories in motion.','Films from the mountains, trails, and places between.','02 / FILMS')+card('../worldmap/','worldmap.png','Where I’ve been.','Follow the journey on the world map.','03 / PLACES')+'</div>','A world worth noticing.','01 / FIELD NOTES')
adventure+=section('<a class="large-link" href="https://ejm.photography" target="_blank" rel="noopener noreferrer"><span>More photographs. A dedicated home.</span><strong>Visit ejm.photography ↗</strong></a>','Keep looking.','02 / PHOTOGRAPHY',id='photography-site',light=False)
page('adventure','adventure','Adventure','Take the<br><em>long way.</em>','Go somewhere unfamiliar. Pay attention. Bring back a story. Photographs, films, and places along the way.',adventure,adventure_feature,'Explore the journey')

ducks_items=DATA['stainedglass'][0]
art_feature=cover('../assets/home/ducks-in-flight-final-1200.webp','../stainedglass/','Ducks in Flight — finished piece','Explore stained glass.')
art_cards=[('../stainedglass/','../assets/home/ducks-in-flight-final-1200.webp','Ducks in Flight','Light, color, and a different way of seeing.'),('../woodworking/','../assets/home/inlay-detail-1200.webp','Woodworking','From raw grain to something you can hold.'),('../stringart/','stringArt.jpg','String art','Geometry, patience, and a single thread.'),('../writings/','writing.jpg','Writings','Poems, prose, and thoughts along the way.'),('../portfolio/','../assets/home/photograph-76-1200.webp','Photography','Finding a frame for the things worth noticing.'),('../video/','../portfolio/src/images/newThumb-20.jpg','Films & video','Places and ideas, set in motion.'),('../games/','games.jpg','Games & experiments','Small worlds built to be explored.')]
art=section('<div class="work-grid">'+''.join(card(u,im,t,d,f'{i+1:02d} / COLLECTION') for i,(u,im,t,d) in enumerate(art_cards))+'</div>','Thinking with my hands.','01 / THE COLLECTIONS')
page('art','art','Art','Make something<br><em>real.</em>','Sometimes an idea needs wood. Sometimes glass, a camera, a page, or a line of code. This is where curiosity takes shape.',art,art_feature,'Explore the collections')

# Collections retain their original media and gain a shared, keyboard-accessible viewer.
wood_titles={'Inlay1':'Inlay — detail','Inlay2':'Inlay — finished work','Camper1':'Camper — in progress','Camper2':'Camper — finished work','Box':'Wooden box','Incense':'Incense holder','LetterOpener':'Letter opener','Pen':'Hand-turned pen','bowl0':'Bowl — in progress','bowl':'Turned bowl','BottleOpenerSTart':'Bottle opener — in progress','bottleopenFinished':'Bottle opener — finished','BigCupWood':'A cup, before the lathe','BigCup0':'Large cup — in progress','BigCup':'Large cup','CandleStick':'Candlestick','CandleStick0':'Candlestick — detail','Cup0':'Cup — in progress','Cup':'Turned cup','lidTop':'Lid — detail','pizza0':'Pizza cutter — in progress','PIzzaHandle':'Pizza cutter handle','Pizza':'Pizza cutter','rollingpin':'Rolling pin — in progress','RollingPinDone':'Rolling pin','Frame':'Picture frame','Mnts':'Mountain inlay'}
wood_items=[{'src':s,'title':wood_titles.get(Path(s).stem,Path(s).stem)} for s in DATA['woodworking'][0]]
wood_content=section(carousel(wood_items,'woodworking','Workshop'),'From the workshop.','OBJECTS & PROCESS')
page('woodworking','art','Woodworking','Follow the<br><em>grain.</em>','Objects, experiments, and the process of making them. A collection from the workshop.',wood_content,cover('../assets/home/inlay-detail-1200.webp','#collection','Inlay — detail','From the workshop.'),'View the work',True)
stained=''
for i,(group,items) in enumerate(zip(['Ducks in Flight','The Vineyard','The Sun and the Moon','Kaleidoscope'],[ducks_items]+DATA['stainedglass'][1:])):
    group_content=carousel(items,'stainedglass',group)
    stained+=section(group_content,group,f'{i+1:02d} / STAINED GLASS',id='collection' if i==0 else f'glass-{i}',light=i%2==0)
page('stainedglass','art','Stained glass','Let the<br><em>light in.</em>','Four projects, from the first pieces to the finished work. Open any image to explore the details.',stained,'','Explore the glass',True)
string_items=[{'src':s,'title':f'String art — {Path(s).stem.split("-")[-1]}'} for s in sorted(DATA['stringart'][0],key=lambda s:int(Path(s).stem.split("-")[-1]))]
string=section(carousel(string_items,'stringart','String art'),'Time.','THE STRING ART SERIES')+section(video('68juZjc0PI','The Black Sun'),'The Black Sun.','02 / IN MOTION',id='black-sun',light=False)
page('stringart','art','String art','One thread.<br><em>Many possibilities.</em>','Finding form through repetition. A collection of string art and the process behind it.',string,'','Follow the thread',True)
portfolio=section(carousel(DATA['portfolio'],'portfolio','Photography',show_titles=False),'Look a little closer.','THE PHOTOGRAPHY ARCHIVE')
page('portfolio','adventure','Photography','A different<br><em>point of view.</em>','Landscapes, people, wildlife, and the small details along the way. Photographs by Eric James McDermott.',portfolio,cover('../assets/home/photograph-76-1200.webp','#collection','Photograph 76','Explore the photographs.'),'Explore photographs',True)

# Writings keeps its original, user-preferred gallery page and Lightbox experience.
video_names={'jub':'Jub','havasupai':'Havasupai','high tatras':'High Tatras','montblanc':'Mont Blanc','Kayak':'Kayaking','100-400 cine':'Through the long lens','how to grill a wurst!':'How to grill a wurst','slovenia excursion':'Slovenia excursion','trier bikeride':'Trier by bicycle','bastei bridge':'Bastei Bridge','schwarzwald':'Schwarzwald','wurmlinger kapelle':'Wurmlinger Kapelle'}
films=DATA['videos']
if not any(v['id']=='RC_SF_gteUo' for v in films):films=[{'title':'jub','id':'RC_SF_gteUo'}]+films
page('video','adventure','Films & video','Life,<br><em>in motion.</em>','Small films from trails, travels, and everyday experiments. Press play and take a look around.',section('<div class="film-grid">'+''.join(video(v['id'],video_names.get(v['title'],v['title'].capitalize())) for v in films)+'</div>','A few stories from out there.','FILMS & VIDEO'),'','Explore the films')
map_url='https://www.zeemaps.com/pub?group=2518949&x=-7.081375&y=40.198281&z=16'
page('worldmap','adventure','World map','A few places.<br><em>A lot of stories.</em>','A map of places I’ve been. Explore the map, then follow the photographs and films behind the journey.',section(f'<div class="map-frame"><button class="map-preview" type="button" data-load-map="{esc(map_url,quote=True)}"><img src="../adventure/worldmap.png" alt="Map of places Eric has visited"><span>Explore the interactive map ↗</span></button></div><a class="quiet-link" href="{esc(map_url,quote=True)}" target="_blank" rel="noopener noreferrer">Open the full map ↗</a>','Where I’ve been.','THE TRAVEL MAP'),'','Explore the map')
games=[('SpaceFossilsWEB','spaceFossils.jpeg','Space Fossils'),('BoxShooter','BoxShooter.jpeg','Box Shooter'),('Rollerball','Rollerball.jpeg','Roller Madness'),('SolarSystem','SolarSystem.jpeg','Solar System Demo')]
page('games','art','Games & experiments','Small worlds.<br><em>Big curiosity.</em>','Playable experiments built in Unity. Pick a world and jump in.',section('<div class="work-grid">'+''.join(card('../'+d+'/',im,t,'Open the interactive experience.','UNITY / PLAY') for d,im,t in games)+'</div>','Pick your playground.','GAMES & INTERACTIVE EXPERIMENTS'),'','Choose a game')

baby_content=section('<div class="app-screens"><article class="app-screen reveal"><a href="https://babybabyapp.com/" aria-label="Visit BabyBaby website"><img src="../baby-app-images/BabyBabyApp_page1.png" alt="BabyBaby daily care tracker screenshot" loading="lazy" width="996" height="1796"></a><p class="eyebrow">LIVE PRODUCT</p><h3>BabyBaby ↗</h3><p>Explore the app and its current features on the BabyBaby website.</p></article></div>','Meet BabyBaby.','PRODUCT / BABYBABY')
page('business/babybaby','business','BabyBaby','Little moments.<br><em>All together.</em>','BabyBaby is a companion for new parents, bringing daily care tracking, questions, memories, and patterns together.',baby_content,'','Explore the app')

# Keep each shipped Unity build intact; redesign the surrounding page and navigation.
for directory,_,title in games:
    build = {'SpaceFossilsWEB':'SpaceFossilsWEB','BoxShooter':'BoxShooter','Rollerball':'Rollerball','SolarSystem':'SolarSystem'}[directory]
    player=f'''<div class="game-player" data-game-build="Build/{build}.json"><div class="game-start"><p class="eyebrow">UNITY WEBGL EXPERIENCE</p><h3>{title}</h3><p>Best explored on a desktop with a keyboard and mouse.</p><button class="solid-button" type="button" data-start-game>Launch {title} ↗</button><p class="game-status" role="status"></p></div><div class="game-scroll" hidden><div class="webgl-content"><div id="unityContainer" style="width:960px;height:600px"></div><button class="solid-button" type="button" data-game-fullscreen>Fullscreen ↗</button></div></div></div>'''
    extra='<script src="../game-player.js" defer></script>'
    page(directory,'art',title,esc(title)+'<em>.</em>','A playable experiment from the games collection.',section(player,'Ready to explore?','GAMES / INTERACTIVE EXPERIENCE'),'','Go to the player',extra_script=extra,filename='index.html')

# Use the same navigation on the homepage, too.
home=ROOT/'index.htm';markup=home.read_text()
markup=re.sub(r'<header class="(?:masthead|universe-header)">.*?</header>',nav('./'),markup,count=1,flags=re.S)
home.write_text(version_assets(markup))
runpy.run_path(str(ROOT/'scripts/build-case-studies.py'), init_globals={'ROOT':ROOT,'nav':nav,'version_assets':version_assets})
print('Rendered collection pages and 4 project briefs; synchronized homepage navigation.')
