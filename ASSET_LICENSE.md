# Cowball v45 assets and licensing

- `assets/textures/*.png`: procedural original textures generated for this Cowball project.
- Music `*.mp3` files in the game folder (`pasture.mp3`, `sunset.mp3`, `rush.mp3`, `moo-groove.mp3`, ceremony tracks): original instrumental tracks synthesized for this project; no commercial soundtrack or sampled game music was used.
- Sound-effect `*.mp3` files in the game folder: original synthesized sound effects, including stylized stadium ambience and crowd cheer.
- `cowball-showcase-concept.png`: AI-generated promotional concept art; it is illustrative artwork, not a screenshot of the actual runtime UI.
- The game uses Three.js r128 through a local `three.min.js` placed next to `index.html` (tried first by `three-loader.js`) and public CDN fallback URLs. The Three.js library is not bundled in this archive because this environment could not resolve external download hosts. When distributing a bundled copy, include the appropriate Three.js license and preserve its notice.

All in-house generated music and textures are provided for use with the Cowball project. Do not assume third-party fonts or Three.js are covered by this note; each retains its own licence.


## Аудио v49
Все `.mp3` (кроме `ui-click.mp3` и `cow-moo.mp3`) сгенерированы скриптом `tools_audio_generator.py` синтезом с нуля, без сторонних сэмплов.
