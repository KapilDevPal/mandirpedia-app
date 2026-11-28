export const TEMPLE_BG = require('../../../assets/mandir/temple_bg.jpg');

/** Landmarks measured on assets/mandir/temple_bg.jpg (841 × 1870 px). */
const BG = {
  w: 841,
  h: 1870,
  platformY: 1392, // top edge of the garbhagriha platform the chitra stands on
  bells: [
    { x: 125, y: 410, w: 105, h: 125 },
    { x: 610, y: 410, w: 105, h: 125 },
  ],
};

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Fit the temple image to the stage (cover) and return stage coordinates of its
 * landmarks. The crop keeps the platform about 80% down the stage, so the chitra
 * stands on the steps on any screen height.
 */
export function templeLayout(W: number, H: number) {
  const scale = Math.max(W / BG.w, H / BG.h);
  const visH = H / scale;
  const y0 = Math.max(0, Math.min(BG.h - visH, BG.platformY - 0.8 * visH));
  const offX = (W - BG.w * scale) / 2;
  const toRect = (r: Rect): Rect => ({ x: offX + r.x * scale, y: (r.y - y0) * scale, w: r.w * scale, h: r.h * scale });

  const platformY = (BG.platformY - y0) * scale;
  const bells = BG.bells.map(toRect) as [Rect, Rect];
  const bellsBottom = bells[0].y + bells[0].h;

  // Box the chitra is fitted into, standing on the platform.
  const boxH = Math.min(H * 0.6, platformY - Math.max(bellsBottom - bells[0].h * 0.4, H * 0.08));
  const boxW = W * 0.62;
  const box: Rect = { x: (W - boxW) / 2, y: platformY + 6 - boxH, w: boxW, h: boxH };

  return {
    bg: { left: offX, top: -y0 * scale, width: BG.w * scale, height: BG.h * scale },
    platformY,
    bells,
    box,
  };
}

/** Width : height of the framed picture (the artwork is cropped to it). */
const FRAME_ASPECT = 0.78;
/** Height of the little gold stand under the frame. */
export const STAND_H = 12;

/** The framed chitra inside the box: centred and standing on its stand at the bottom edge (relative to the box). */
export function chitraRect(box: Rect): Rect {
  let h = Math.min(box.h - STAND_H, ((box.w * 0.92) / FRAME_ASPECT));
  let w = h * FRAME_ASPECT;
  if (w > box.w) {
    w = box.w;
    h = w / FRAME_ASPECT;
  }
  return { x: (box.w - w) / 2, y: box.h - STAND_H - h, w, h };
}
