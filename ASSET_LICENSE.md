# Cowball v45 assets and licensing

- `assets/textures/*.png`: procedural original textures generated for this Cowball project.
- `assets/audio/music/*.mp3`: original instrumental tracks synthesized for this project; no commercial soundtrack or sampled game music was used.
- `assets/audio/sfx/*.mp3`: original synthesized sound effects, including stylized stadium ambience and crowd cheer.
- `cowball-showcase-concept.png`: AI-generated promotional concept art; it is illustrative artwork, not a screenshot of the actual runtime UI.
- The game uses Three.js r128 through the existing local `lib/three.min.js` fallback path and public CDN fallback URLs. The Three.js library is not bundled in this archive because this environment could not resolve external download hosts. When distributing a bundled copy, include the appropriate Three.js license and preserve its notice.

All in-house generated music and textures are provided for use with the Cowball project. Do not assume third-party fonts or Three.js are covered by this note; each retains its own licence.
