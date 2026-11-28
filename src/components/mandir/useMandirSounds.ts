import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';

const BELL = require('../../../assets/sounds/bell.wav');
const SHANKH = require('../../../assets/sounds/shankh.mp3');
const AARTI = require('../../../assets/sounds/aarti.wav');

function restart(p: AudioPlayer) {
  try {
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // the player may already be released while unmounting
  }
}

/**
 * Temple sound effects. Two bell players alternate so the left and right bells
 * can ring over each other. Players are released automatically on unmount.
 */
export function useMandirSounds(muted: boolean) {
  const bellA = useAudioPlayer(BELL);
  const bellB = useAudioPlayer(BELL);
  const shankh = useAudioPlayer(SHANKH);
  const aarti = useAudioPlayer(AARTI);
  const flip = useRef(false);

  useEffect(() => {
    // Play with the iOS silent switch on, without stopping the user's music.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!muted) return;
    for (const p of [bellA, bellB, shankh, aarti]) {
      try {
        p.pause();
      } catch {}
    }
  }, [muted, bellA, bellB, shankh, aarti]);

  return useMemo(
    () => ({
      bell: () => {
        if (muted) return;
        flip.current = !flip.current;
        restart(flip.current ? bellA : bellB);
      },
      shankh: () => {
        if (!muted) restart(shankh);
      },
      aarti: () => {
        if (!muted) restart(aarti);
      },
      stopAarti: () => {
        try {
          aarti.pause();
          aarti.seekTo(0).catch(() => {});
        } catch {}
      },
    }),
    [muted, bellA, bellB, shankh, aarti],
  );
}
