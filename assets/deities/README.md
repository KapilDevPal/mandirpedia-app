# Deity artwork

This folder holds the bundled deity images used on Home (hero and "Browse by deity" cards) and at the top of each deity page. It is empty on purpose. Add only artwork you have **permission to use in the app**, such as images you commissioned or photographed, or images under a licence that allows redistribution in a mobile app.

Until an image is added, the app shows a black-and-white placeholder with the deity's name, so every card still works.

## Preparing an image

- Portrait orientation, about **1200 × 1600 px**, JPEG at about 80% quality (aim for under 300 KB each).
- Convert to **grayscale before adding it**. The app also applies a grayscale filter, but iOS does not support that filter on all versions, so pre-converted files keep both platforms consistent:
  `magick input.jpg -colorspace Gray -resize 1200x1600^ -gravity center -extent 1200x1600 -quality 80 shiva.jpg`
- Keep the face in the upper third. Cards crop to 3:4 and the hero crops to a wide, short frame. Set `focusY` in the registry if a crop needs adjusting.
- Use respectful, reverent imagery. Avoid busy text or watermarks; the app adds a dark overlay for name legibility.

## Registering an image

Name the file after the deity id (for example `shiva.jpg`), then add it to `src/content/deityImages.ts`:

```ts
shiva: {
  source: require('../../assets/deities/shiva.jpg'),
  credit: 'Photograph © Example Studio, used with permission',
  licence: 'Written permission for in-app use, 2026',
  focusY: 0.3,
},
```

Deity ids: `ganesha`, `hanuman`, `shiva`, `shani`, `durga`, `lakshmi`, `vishnu`, `saraswati`, `gayatri_savitr`, `kubera`.
