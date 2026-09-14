/**
 * High-Fidelity Procedural Audio Synthesizer for "The Shadow" (الظل)
 * Generates custom 16-bit 44100Hz Mono PCM WAV tracks representing various genres.
 * Implements section-based structures, delay/echo effects, lush pads, and an Auto-Tuned vocal vocoder.
 * Specifically optimized for authentic Egyptian Mahraganat (Essam Sasa & Ahmed Moza style)
 * with professional-grade auto-tune effects and realistic darbuka/tabla procedural synthesis.
 */

function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 302473474, h3 = 3362453611, h4 = 502492259;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function sfc32(a: number, b: number, c: number, d: number) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    }
}

function resamplePCM16(
    inputBuffer: Buffer,
    fromRate: number,
    toRate: number
): Buffer {
    const numInputSamples = inputBuffer.length / 2;
    const ratio = toRate / fromRate;
    const numOutputSamples = Math.floor(numInputSamples * ratio);
    const outputBuffer = Buffer.alloc(numOutputSamples * 2);

    for (let i = 0; i < numOutputSamples; i++) {
        const inputIndex = i / ratio;
        const indexFloor = Math.floor(inputIndex);
        const indexCeil = Math.min(numInputSamples - 1, indexFloor + 1);
        const weight = inputIndex - indexFloor;

        if (indexFloor * 2 + 1 >= inputBuffer.length) break;

        const sampleFloor = inputBuffer.readInt16LE(indexFloor * 2);
        const sampleCeil = inputBuffer.readInt16LE(indexCeil * 2);

        // Linear interpolation
        const interpolatedSample = sampleFloor + (sampleCeil - sampleFloor) * weight;
        
        outputBuffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.floor(interpolatedSample))), i * 2);
    }

    return outputBuffer;
}

// Autocorrelation pitch detection for voice pitch tracking
function detectPitch(buffer: Buffer, startIdx: number, sampleRate: number): number {
    const windowSize = 512;
    if (startIdx < 0 || startIdx + windowSize * 2 >= buffer.length) return 0;
    
    const samples = new Float32Array(windowSize);
    let isSilent = true;
    for (let i = 0; i < windowSize; i++) {
        const val = buffer.readInt16LE(startIdx + i * 2) / 32768;
        samples[i] = val;
        if (Math.abs(val) > 0.01) { // lowered threshold to catch soft vowels
            isSilent = false;
        }
    }
    
    if (isSilent) return 0;
    
    let bestLag = -1;
    let bestR = -Infinity;
    
    const minLag = Math.floor(sampleRate / 600); // Max pitch ~600Hz
    const maxLag = Math.floor(sampleRate / 80);  // Min pitch ~80Hz
    
    for (let lag = minLag; lag <= maxLag; lag++) {
        let r = 0;
        for (let i = 0; i < windowSize - lag; i++) {
            r += samples[i] * samples[i + lag];
        }
        if (r > bestR) {
            bestR = r;
            bestLag = lag;
        }
    }
    
    if (bestLag > 0) {
        return sampleRate / bestLag;
    }
    return 0;
}

function getClosestScaleNote(detectedFreq: number, scale: number[]): number {
    if (detectedFreq <= 0) return scale[0];
    let closest = scale[0];
    let minDiff = Math.abs(detectedFreq - scale[0]);
    
    // Check multiple octaves for standard singing pitches
    const octaves = [0.25, 0.5, 1.0, 2.0, 4.0];
    for (const oct of octaves) {
        for (const freq of scale) {
            const targetFreq = freq * oct;
            const diff = Math.abs(detectedFreq - targetFreq);
            if (diff < minDiff) {
                minDiff = diff;
                closest = targetFreq;
            }
        }
    }
    return closest;
}

export function synthesizeTrack(
    genre: 'shaabi' | 'cyberpunk' | 'pop' | 'hiphop' | 'rock' | 'ambient', 
    durationSeconds: number = 60,
    seedText: string = "",
    vocalPcmBuffer?: Buffer,
    options?: { mood?: string; tempo?: string }
): Buffer {
    const sampleRate = 44100;
    const numSamples = sampleRate * durationSeconds;
    const audioBuffer = Buffer.alloc(numSamples * 2);

    // Initialize pseudo-random generator seeded by seedText or random value
    const seed = cyrb128(seedText || Math.random().toString());
    const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

    // Scales definitions
    // Hijaz (Maqam Hijaz, quintessential Egyptian Shaabi/Mahraganat sound: D, Eb, F#, G, A, Bb, C)
    const hijazScale = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25];
    // Modern minor/Aeolian scale for Hiphop & Pop
    const minorScale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00];
    const popScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    const technoScale = [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00];
    const rockScale = [146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
    const ambientScale = [220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88];
    
    // Traditional authentic Arabic scales for rich emotional variety
    const sabaScale = [293.66, 305.00, 349.23, 369.99, 440.00, 466.16, 523.25]; // Maqam Saba (extremely sad and mournful)
    const kurdScale = [293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25]; // Maqam Kurd (deeply emotional, touching)

    let scale = popScale;
    let baseBpm = 120;
    
    const requestMood = options?.mood || 'neutral';
    const requestTempo = options?.tempo || 'medium';

    if (genre === 'shaabi') {
        if (requestMood === 'sad') {
            scale = sabaScale;
            baseBpm = 112; // slow mournful Mahraganat
        } else if (requestMood === 'chill') {
            scale = kurdScale;
            baseBpm = 120; // smooth Mahraganat
        } else {
            scale = hijazScale;
            baseBpm = rand() > 0.5 ? 132 : 126; // upbeat street Mahraganat
        }
    } else if (genre === 'cyberpunk') {
        scale = technoScale;
        baseBpm = 135;
    } else if (genre === 'hiphop') {
        scale = minorScale;
        baseBpm = requestMood === 'sad' || requestMood === 'chill' ? 84 : 95;
    } else if (genre === 'pop') {
        if (requestMood === 'sad') {
            scale = minorScale;
            baseBpm = 75; // slow emotional pop ballad
        } else if (requestMood === 'happy' || requestMood === 'energetic') {
            scale = popScale;
            baseBpm = 124; // dance-pop
        } else {
            scale = popScale;
            baseBpm = 100;
        }
    } else if (genre === 'rock') {
        scale = rockScale;
        baseBpm = 120;
    } else if (genre === 'ambient') {
        scale = ambientScale;
        baseBpm = 72;
    }

    // Apply manual tempo adjustments
    if (requestTempo === 'fast') {
        baseBpm = Math.floor(baseBpm * 1.15);
    } else if (requestTempo === 'slow') {
        baseBpm = Math.floor(baseBpm * 0.85);
    }

    // Add randomized variation based on seed to ensure uniqueness (+/- 6 BPM)
    const bpm = baseBpm + Math.floor(rand() * 12) - 6;

    const beatsPerSecond = bpm / 60;
    const samplesPerBeat = Math.floor(sampleRate / beatsPerSecond);
    const samplesPerStep = Math.floor(samplesPerBeat / 4); // 16th note steps

    // Reverb / Echo Delay parameters
    const delaySamples = Math.floor(sampleRate * (genre === 'shaabi' ? 0.33 : 0.28 + rand() * 0.15)); // Triplet delay for Mahraganat
    const delayBuffer = new Float32Array(delaySamples);
    let delayIndex = 0;
    const delayFeedback = genre === 'shaabi' ? 0.48 : 0.35 + rand() * 0.15;
    const delayWet = genre === 'shaabi' ? 0.40 : 0.25 + rand() * 0.15;

    // Generate unique melody structures based on seed
    const leadMelodySeq: number[] = [];
    const vocalMelodySeq: number[] = [];
    for (let steps = 0; steps < 16; steps++) {
        leadMelodySeq.push(Math.floor(rand() * scale.length));
        vocalMelodySeq.push(Math.floor(rand() * (scale.length - 2)) + 1);
    }

    // Dynamic Seed-Based Instrumental & Rhythmic Presets (Highly diverse Egyptian pop patterns)
    const shaabiRhythmType = Math.floor(rand() * 4); // 0 = Maqsoom, 1 = Saidi, 2 = Malfouf, 3 = Mahraganat standard
    const leadSynthWaveType = Math.floor(rand() * 4); // 0 = Mizmar/Zurna (Saw-Nasal), 1 = Lead Korg Org (Detuned Square), 2 = Nay Flute (Sine + Breath), 3 = Acid/Hard Synth
    const melodyGatePattern = Array.from({ length: 16 }, () => rand() > 0.22 ? 1 : 0); // Dynamic gating for complex rhythms instead of rigid continuous notes

    // Diverse chord progressions
    const chordProgressions = [
        [0, 3, 5, 4], // I - IV - VI - V
        [0, 4, 5, 3], // I - V - VI - IV
        [5, 3, 0, 4], // VI - IV - I - V (sad/emotional, great for Ahmed Moza)
        [0, 1, 3, 4]  // Hijaz progression: I - II - IV - V (super Egyptian)
    ];
    const bassRoots = chordProgressions[Math.floor(rand() * chordProgressions.length)];

    // Seed-based vocal parameters (Vibrato and modern fast pitch snap)
    const vibratoFreq = 5.8 + rand() * 1.5;
    const vibratoDepth = genre === 'shaabi' ? 0.005 : 0.015; // Mahraganat uses less organic vibrato, more robotic lock
    const autoTuneSpeed = genre === 'shaabi' ? 1.0 : 0.85; // 1.0 = instant robotic snap (Essam Sasa signature)

    // Pre-resample vocal buffer
    let resampledVocals: Buffer | null = null;
    if (vocalPcmBuffer && vocalPcmBuffer.length > 0) {
        try {
            resampledVocals = resamplePCM16(vocalPcmBuffer, 24000, 44100);
            console.log(`[SYNTHESIZER] Pre-resampling successful. Resampled vocal size: ${resampledVocals.length} bytes.`);
        } catch (err: any) {
            console.error("[SYNTHESIZER] Failed to resample vocal buffer:", err);
        }
    }

    let vocalEnvFollower = 0;
    let prevVoiceSample = 0;
    let vocalPlayhead = 0;
    let smoothedShiftRatio = 1.0;
    let detectedPitchVal = 0;
    let pitchCheckCounter = 0;
    
    // Vocal starts after intro (10% of total duration)
    const startOffsetSamples = Math.floor(durationSeconds * 0.1 * sampleRate);

    // Main synthesis loop
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const currentBeat = Math.floor(i / samplesPerBeat);
        const currentStep = Math.floor(i / samplesPerStep);
        const stepInMeasure = currentStep % 16;
        const sampleInStep = i % samplesPerStep;

        // Song Sections arrangement (scaled dynamically to durationSeconds)
        const isIntro = t < durationSeconds * 0.1;
        const isVerse1 = t >= durationSeconds * 0.1 && t < durationSeconds * 0.35;
        const isChorus = t >= durationSeconds * 0.35 && t < durationSeconds * 0.65; // main drop!
        const isVerse2 = t >= durationSeconds * 0.65 && t < durationSeconds * 0.82; // breakdown
        const isOutro = t >= durationSeconds * 0.82;

        let val = 0;

        // --- 1. PHYSICAL MODELING DRUMS & DARBUKA (TABLAH) ---
        let drumSample = 0;
        if (!isIntro && !isOutro) {
            // Kick Drum / Bass Drum
            let isKick = false;
            if (genre === 'shaabi') {
                // Determine Kick placement based on chosen Egyptian Popular Rhythm Style
                if (shaabiRhythmType === 0) { // Maqsoom (Dum-Tak-Tak-Dum-Tak)
                    isKick = (stepInMeasure === 0 || stepInMeasure === 8 || stepInMeasure === 11);
                } else if (shaabiRhythmType === 1) { // Saidi (traditional folklore heavy bounce)
                    isKick = (stepInMeasure === 0 || stepInMeasure === 4 || stepInMeasure === 8 || stepInMeasure === 11);
                } else if (shaabiRhythmType === 2) { // Malfouf (rapid syncopated triplet vibe)
                    isKick = (stepInMeasure === 0 || stepInMeasure === 6 || stepInMeasure === 12);
                } else { // Standard heavy street electronic Mahraganat
                    isKick = (stepInMeasure === 0 || stepInMeasure === 2 || stepInMeasure === 8 || stepInMeasure === 10);
                }

                if (isChorus && stepInMeasure === 15 && sampleInStep < samplesPerStep / 2) {
                    isKick = true; // double kick energy in drop!
                }
            } else if (genre === 'hiphop') {
                isKick = (stepInMeasure === 0 || stepInMeasure === 9 || stepInMeasure === 11);
            } else {
                isKick = (stepInMeasure % 4 === 0);
            }

            // Breakdown has fewer kicks
            if (isVerse2 && stepInMeasure % 8 !== 0) {
                isKick = false;
            }

            if (isKick) {
                const kickT = sampleInStep / sampleRate;
                // Deeper, punchier kick sweep
                const kickSweep = (genre === 'shaabi' ? 200 : 130) * Math.exp(-85 * kickT);
                if (kickSweep > 20) {
                    drumSample += Math.sin(2 * Math.PI * kickSweep * kickT) * Math.exp(-22 * kickT) * 0.65;
                }
            }

            // Snare / Clap / Darbuka High "Tak"
            let isSnare = false;
            if (genre === 'shaabi') {
                // Determine high-energy snare/Tak hits based on rhythm type
                if (shaabiRhythmType === 0) { // Maqsoom
                    isSnare = (stepInMeasure === 4 || stepInMeasure === 12 || stepInMeasure === 14);
                } else if (shaabiRhythmType === 1) { // Saidi
                    isSnare = (stepInMeasure === 12 || stepInMeasure === 14);
                } else if (shaabiRhythmType === 2) { // Malfouf
                    isSnare = (stepInMeasure === 4 || stepInMeasure === 10 || stepInMeasure === 14);
                } else { // Mahraganat
                    isSnare = (stepInMeasure === 4 || stepInMeasure === 6 || stepInMeasure === 12 || stepInMeasure === 14);
                }
            } else {
                isSnare = (stepInMeasure === 4 || stepInMeasure === 12);
            }

            if (isSnare && !isVerse2) {
                const snareT = sampleInStep / sampleRate;
                const noise = (Math.sin(i * 19.8765) % 1);
                if (genre === 'shaabi') {
                    // Crisp sharp Darbuka rim "Tak" sound with a bright slap
                    const body = Math.sin(2 * Math.PI * 450 * snareT) * Math.exp(-55 * snareT);
                    const metalSizzle = Math.sin(2 * Math.PI * 1500 * snareT) * Math.exp(-90 * snareT) * 0.15;
                    const crack = noise * Math.exp(-85 * snareT) * 0.28;
                    drumSample += (body * 0.45 + metalSizzle + crack) * 1.1;
                } else {
                    const body = Math.sin(2 * Math.PI * 340 * snareT) * Math.exp(-45 * snareT);
                    const crack = noise * Math.exp(-65 * snareT) * 0.22;
                    drumSample += (body * 0.25 + crack) * 0.90;
                }
            }

            // Darbuka / Tabla Rolls & Glissandos (Essential for Essam Sasa style)
            if (genre === 'shaabi' && !isVerse2) {
                // Rapid tabla rim shots and rolls on step transitions (steps 3, 7, 11, 15)
                const isRollStep = (stepInMeasure === 3 || stepInMeasure === 7 || stepInMeasure === 11 || stepInMeasure === 15);
                if (isRollStep) {
                    // Triplets or quadruplets roll
                    const numRolls = isChorus ? 4 : 3;
                    const rollSubStep = Math.floor((i % samplesPerStep) / (samplesPerStep / numRolls));
                    const rollT = (i % (samplesPerStep / numRolls)) / sampleRate;
                    
                    const tablaFreq = 420 + Math.sin(rollSubStep * 1.5) * 50; // modulating pitch
                    const rimShot = Math.sin(2 * Math.PI * tablaFreq * rollT) * Math.exp(-95 * rollT) * 0.20;
                    const slapNoise = (Math.sin(i * 95.4321) % 1) * Math.exp(-130 * rollT) * 0.08;
                    
                    drumSample += (rimShot + slapNoise) * (isChorus ? 0.75 : 0.55);
                }
            }

            // Hi-Hats / Shakers
            const isHat = (stepInMeasure % 2 === 1);
            if (isHat && !isVerse2) {
                const hatT = sampleInStep / sampleRate;
                const noise = (Math.sin(i * 156.789) % 1);
                drumSample += noise * Math.exp(-120 * hatT) * 0.045;
            }
        }

        // --- 2. LUSH BACKGROUND HARMONIES (CHORDS/PADS) ---
        const chordIndex = Math.floor(currentBeat / 4) % 4;
        const rootNoteIdx = bassRoots[chordIndex] % scale.length;
        
        const rootFreq = scale[rootNoteIdx];
        const thirdFreq = scale[(rootNoteIdx + 2) % scale.length];
        const fifthFreq = scale[(rootNoteIdx + 4) % scale.length];

        let chordSample = 0;
        if (genre !== 'ambient') {
            // Sawtooth & Triangle blended pads for premium analog feel
            const phase1 = (t * (rootFreq / 2)) % 1;
            const phase2 = (t * (thirdFreq / 2)) % 1;
            const phase3 = (t * (fifthFreq / 2)) % 1;

            const saw1 = 2 * phase1 - 1;
            const saw2 = 2 * phase2 - 1;
            const saw3 = 2 * phase3 - 1;

            chordSample = (saw1 + saw2 + saw3) / 3 * 0.08;
            
            // Filter envelope simulation to make it swell
            const chordSwell = Math.sin(2 * Math.PI * (1 / 8) * t) * 0.5 + 0.5;
            chordSample *= chordSwell;

            if (isIntro) chordSample *= (t / (durationSeconds * 0.1));
            if (isOutro) chordSample *= (1 - (t - durationSeconds * 0.82) / (durationSeconds * 0.18));
        } else {
            // Ultra-lush atmospheric pads for Ambient genre
            const pad1 = Math.sin(2 * Math.PI * (rootFreq / 2) * t);
            const pad2 = Math.sin(2 * Math.PI * (thirdFreq / 2) * t);
            const pad3 = Math.sin(2 * Math.PI * (fifthFreq / 2) * t);
            chordSample = (pad1 + pad2 + pad3) / 3 * 0.15;
        }

        // --- 3. SUB-BASS 808 GLIDE (Essential for modern Mahraganat) ---
        let bassSample = 0;
        if (!isIntro) {
            const bassFreq = scale[rootNoteIdx] / 4; // Sub octave
            const bassEnv = Math.exp(-(genre === 'shaabi' ? 2.5 : 4) * (sampleInStep / samplesPerStep));
            
            // Portamento sliding to next step
            const nextRootIdx = bassRoots[(chordIndex + 1) % 4] % scale.length;
            const nextBassFreq = scale[nextRootIdx] / 4;
            const stepRatio = sampleInStep / samplesPerStep;

            const slideFreq = stepRatio > 0.8
                ? bassFreq + (nextBassFreq - bassFreq) * ((stepRatio - 0.8) / 0.2)
                : bassFreq;

            // Rounded saturation drive for 808 feel
            const phase = (t * slideFreq) % 1;
            const tri = phase < 0.5 ? (4 * phase - 1) : (3 - 4 * phase);
            const drivenBass = Math.tanh(tri * 2.5); // fat distortion
            bassSample = drivenBass * bassEnv * (genre === 'shaabi' ? 0.30 : 0.20);

            if (isOutro) bassSample *= (1 - (t - durationSeconds * 0.82) / (durationSeconds * 0.18));
        }

        // --- 4. HIGH-ENERGY LEADS (ZURNA / SHAABI SYNTH) ---
        let leadSample = 0;
        if (!isVerse2 && !isIntro && !isOutro) {
            const stepGate = melodyGatePattern[stepInMeasure % 16];
            if (stepGate === 1) { // Only play notes when the rhythm gate is open (highly musical!)
                const noteIdx = leadMelodySeq[stepInMeasure % leadMelodySeq.length];
                const noteFreq = scale[(rootNoteIdx + noteIdx) % scale.length];
                const leadEnv = Math.exp(-4 * (sampleInStep / samplesPerStep));

                if (genre === 'shaabi') {
                    // Traditional Pitch glide from previous note for oriental microtonal feel
                    const prevNoteIdx = leadMelodySeq[(stepInMeasure - 1 + 16) % 16];
                    const prevFreq = scale[(rootNoteIdx + prevNoteIdx) % scale.length];
                    const stepRatio = sampleInStep / samplesPerStep;
                    let currentFreq = noteFreq;
                    if (stepRatio < 0.25) {
                        currentFreq = prevFreq + (noteFreq - prevFreq) * (stepRatio / 0.25);
                    }

                    const pitchVibrato = 1 + 0.04 * Math.sin(2 * Math.PI * (8.5 + rand() * 2) * t);

                    if (leadSynthWaveType === 0) { // Mizmar / Zurna (Nasal Reed)
                        const phase1 = (t * currentFreq * pitchVibrato) % 1;
                        const phase2 = (t * currentFreq * 1.5 * pitchVibrato) % 1; // 1.5x harmonic for nasal mizmar feel
                        const sawLead = (2 * phase1 - 1) * 0.55 + (2 * phase2 - 1) * 0.45;
                        const filterRes = Math.sin(2 * Math.PI * 1900 * t) * 0.35 + 0.65;
                        leadSample = sawLead * filterRes * leadEnv * 0.16;
                    } else if (leadSynthWaveType === 1) { // Lead Org (iconic Egyptian electric keyboard organ)
                        const phase1 = (t * currentFreq * pitchVibrato) % 1;
                        const phase2 = (t * (currentFreq * 1.006) * pitchVibrato) % 1; // detuned organ double wave
                        const sq1 = phase1 < 0.5 ? 1 : -1;
                        const sq2 = phase2 < 0.5 ? 1 : -1;
                        leadSample = (sq1 + sq2) * 0.5 * leadEnv * 0.13;
                    } else if (leadSynthWaveType === 2) { // Oriental Flute / Nay
                        const phase1 = (t * currentFreq * pitchVibrato) % 1;
                        const sine = Math.sin(2 * Math.PI * currentFreq * pitchVibrato * t);
                        const breathNoise = (Math.sin(i * 123.456) % 1) * 0.08 * leadEnv; // subtle breath
                        leadSample = (sine * 0.85 + breathNoise) * leadEnv * 0.18;
                    } else { // Acid / Hard Street Synth
                        const phase = (t * currentFreq * pitchVibrato) % 1;
                        const saw = 2 * phase - 1;
                        leadSample = Math.tanh(saw * 3.5) * leadEnv * 0.07;
                    }
                } else if (genre === 'cyberpunk') {
                    const phase = (t * noteFreq) % 1;
                    const saw = 2 * phase - 1;
                    leadSample = Math.tanh(saw * 3.0) * leadEnv * 0.06;
                } else {
                    const phase = (t * noteFreq) % 1;
                    const sq = phase < 0.5 ? 1 : -1;
                    leadSample = sq * leadEnv * 0.04;
                }

                if (isChorus) leadSample *= 1.45; // boost chorus energy!
            }
        }

        // --- 5. PROFESSIONAL-GRADE AUTO-TUNE VOCALS ENGINE ---
        let vocalSample = 0;
        if (resampledVocals && i >= startOffsetSamples) {
            const currentVocalNoteIdx = vocalMelodySeq[stepInMeasure % 16];
            const prevVocalNoteIdx = vocalMelodySeq[(stepInMeasure - 1 + 16) % 16];

            const currentVocalFreq = scale[(rootNoteIdx + currentVocalNoteIdx) % scale.length];
            const prevVocalFreq = scale[(rootNoteIdx + prevVocalNoteIdx) % scale.length];

            const stepRatio = sampleInStep / samplesPerStep;
            let vocalFreq = currentVocalFreq;

            // Modern rapid portamento pitch slides (Essam Sasa signature glide)
            if (stepRatio < 0.20) {
                const t_slide = stepRatio / 0.20;
                vocalFreq = prevVocalFreq + (currentVocalFreq - prevVocalFreq) * t_slide;
            }

            const vocalVibrato = 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoFreq * t);
            const targetFreq = vocalFreq * vocalVibrato;

            // Real-time Auto-Tune pitch processing
            pitchCheckCounter++;
            if (pitchCheckCounter >= 256) {
                pitchCheckCounter = 0;
                const byteIdx = Math.floor(vocalPlayhead) * 2;
                detectedPitchVal = detectPitch(resampledVocals, byteIdx, sampleRate);
            }

            let correctPitchFreq = targetFreq;
            if (detectedPitchVal > 0) {
                correctPitchFreq = getClosestScaleNote(detectedPitchVal, scale);
            }

            // Calculate instantaneous shift ratio
            const rawShiftRatio = (detectedPitchVal > 0 && correctPitchFreq > 0)
                ? correctPitchFreq / detectedPitchVal
                : 1.0;

            // Apply autoTuneSpeed: 1.0 = instant hard snap (T-Pain/Sasa robot effect), smaller = gradual correction
            const snapFactor = autoTuneSpeed * 0.15;
            smoothedShiftRatio = smoothedShiftRatio * (1 - snapFactor) + rawShiftRatio * snapFactor;
            smoothedShiftRatio = Math.max(0.4, Math.min(2.5, smoothedShiftRatio));

            // Read resampled vocal sample
            const readIdx = Math.floor(vocalPlayhead);
            const frac = vocalPlayhead - readIdx;
            let voiceSampleVal = 0;

            if (readIdx * 2 + 1 < resampledVocals.length) {
                const s1 = resampledVocals.readInt16LE(readIdx * 2) / 32767;
                const s2 = (readIdx * 2 + 3 < resampledVocals.length)
                    ? resampledVocals.readInt16LE(readIdx * 2 + 2) / 32767
                    : s1;
                voiceSampleVal = s1 + (s2 - s1) * frac;
            }

            // Envelope follower for tracking vocal volume
            vocalEnvFollower = vocalEnvFollower * 0.998 + Math.abs(voiceSampleVal) * 0.002;

            // Advance playhead
            vocalPlayhead += smoothedShiftRatio;

            // Prevent buffer drift
            const targetPlayhead = i - startOffsetSamples;
            const drift = vocalPlayhead - targetPlayhead;
            if (Math.abs(drift) > 1000) {
                vocalPlayhead = vocalPlayhead * 0.92 + targetPlayhead * 0.08;
            }

            // Modern studio effects (Treble presence + Tube Saturation + Compression)
            const treblePresence = (voiceSampleVal - prevVoiceSample) * 0.22;
            prevVoiceSample = voiceSampleVal;

            // Fat warm saturation
            const processedVocal = Math.tanh(voiceSampleVal * 2.8) * 0.85 + treblePresence;

            // Formant vocoder sheen modulation
            const carrierPhase = (t * targetFreq) % 1;
            const carrierSq = carrierPhase < 0.5 ? 1 : -1;
            const sheen = carrierSq * vocalEnvFollower * 0.12;

            vocalSample = (processedVocal + sheen) * 1.65;

            // Section harmonies (Fifth harmony during Chorus drops)
            if (isChorus) {
                const harmonyFreq = targetFreq * 1.5; // perfect fifth
                const harmonyPhase = (t * harmonyFreq) % 1;
                const harmony = Math.sin(2 * Math.PI * harmonyFreq * t) * vocalEnvFollower * 0.15;
                vocalSample += harmony;
            }

            if (isVerse2) vocalSample *= 0.85; // soft vocal break
            if (isOutro) vocalSample *= (1 - (t - durationSeconds * 0.82) / (durationSeconds * 0.18));
        } else {
            // Falback: Synthesize beautiful background chants when vocal is missing
            const vocalEnv = Math.exp(-3.5 * (sampleInStep / samplesPerStep));
            const chantPhase = (t * scale[(rootNoteIdx + 2) % scale.length] * 2) % 1;
            const chantSine = Math.sin(2 * Math.PI * scale[(rootNoteIdx + 2) % scale.length] * 2 * t);
            vocalSample = chantSine * vocalEnv * 0.08;
        }

        // --- 6. DELAY / REVERB PIPELINE ---
        const drySignals = leadSample * 0.30 + vocalSample * 0.45;
        const echoSample = delayBuffer[delayIndex];

        // Echo feedback
        delayBuffer[delayIndex] = drySignals + echoSample * delayFeedback;
        delayIndex = (delayIndex + 1) % delaySamples;

        const wetMix = drySignals + echoSample * delayWet;

        // --- 7. MASTER MIX & CLIPPING GUARD ---
        let masterSample = drumSample + chordSample + bassSample + wetMix;

        // Brickwall soft clipper
        masterSample = Math.max(-0.95, Math.min(0.95, masterSample));

        // Write to signed 16-bit PCM WAV
        const pcmValue = Math.floor(masterSample * 32767);
        audioBuffer.writeInt16LE(pcmValue, i * 2);
    }

    // Standard 44-byte WAV Header
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + audioBuffer.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // Uncompressed PCM format
    header.writeUInt16LE(1, 22); // Mono channel
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32); // BlockAlign (1 channel * 2 bytes per sample)
    header.writeUInt16LE(16, 34); // 16-bit depth
    header.write("data", 36);
    header.writeUInt32LE(audioBuffer.length, 40);

    return Buffer.concat([header, audioBuffer]);
}
