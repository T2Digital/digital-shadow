import React, { useEffect } from "react";
import { resumeAudioContext } from "../services/geminiService";

export const AudioUnlocker: React.FC = () => {
  useEffect(() => {
    const unlock = () => {
      console.log("Attempting Audio Unlock...");
      resumeAudioContext();
    };

    // Attach tightly to common interaction events
    const events = ["click", "touchstart", "keydown", "focus"];
    events.forEach(event => window.addEventListener(event, unlock, { once: true }));

    // Re-bind occasionally or check context status?
    // Modern iOS Safari requires the AudioContext.resume() specifically within the micro-task of a touch event.
    // The geminiService should maintain the single context instance.

    return () => {
      events.forEach(event => window.removeEventListener(event, unlock));
    };
  }, []);

  return null;
};
