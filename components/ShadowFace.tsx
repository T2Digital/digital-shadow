import React, { useEffect, useState } from 'react';

interface ShadowFaceProps {
    appStatus: 'idle' | 'listening' | 'thinking' | 'speaking';
    audioLevel?: number; // 0 to 1 value representing speaking volume
    size?: 'small' | 'large';
    onClick?: () => void;
    onPressHold?: () => void;
    className?: string;
}

export const ShadowFace: React.FC<ShadowFaceProps> = ({ appStatus, audioLevel = 0, size = 'small', onClick, onPressHold, className = '' }) => {
    const [isBlinking, setIsBlinking] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [reactionCycle, setReactionCycle] = useState(0);
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
    
    // Follow mouse slightly
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1; // -1 to 1
            const y = (e.clientY / window.innerHeight) * 2 - 1; // -1 to 1
            setMousePos({ x, y });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    // Random blinking
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (Math.random() > 0.3) {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 120);
                
                // Double blink chance
                if (Math.random() > 0.8) {
                    setTimeout(() => {
                        setIsBlinking(true);
                        setTimeout(() => setIsBlinking(false), 120);
                    }, 200);
                }
            }
        }, 3500 + Math.random() * 2000);
        
        return () => clearInterval(blinkInterval);
    }, []);

    // Physics
    const eyeTrackingX = mousePos.x * 5;
    const eyeTrackingY = mousePos.y * 5;
    
    // Default neutral expressions
    let leftEyeY = 45 + eyeTrackingY;
    let rightEyeY = 45 + eyeTrackingY;
    let eyeX = eyeTrackingX;
    let eyeScaleY = isBlinking ? 0.1 : 1;
    let eyeScaleX = 1;
    
    const cx = 50;
    const cy = 65 + eyeTrackingY * 0.5;
    
    // Mouth points
    let mLeftX = cx - 12;
    let mRightX = cx + 12;
    let mUpperY = cy;
    let mLowerY = cy;

    // Brows
    const lBrowLX = 25; const lBrowRX = 45;
    const rBrowLX = 55; const rBrowRX = 75;
    let lBrowY = 32 + eyeTrackingY; let lBrowMY = 28 + eyeTrackingY;
    let rBrowY = 32 + eyeTrackingY; let rBrowMY = 28 + eyeTrackingY;

    // Idle animation cycle based on reaction cycle
    const reactions = ['neutral', 'happy', 'curious', 'bored'];
    let currentReaction = appStatus === 'idle' ? reactions[reactionCycle % reactions.length] : appStatus;

    if (currentReaction !== 'speaking') {
        switch (currentReaction) {
            case 'curious':
                lBrowY = 24 + eyeTrackingY; lBrowMY = 20 + eyeTrackingY;
                rBrowY = 36 + eyeTrackingY; rBrowMY = 32 + eyeTrackingY;
                mLeftX = cx - 6; mRightX = cx + 6;
                mUpperY = cy - 6; mLowerY = cy + 6; // little O
                break;
            case 'happy':
                mLeftX = cx - 16; mRightX = cx + 16;
                mUpperY = cy + 6; mLowerY = cy + 14; 
                lBrowY = 36 + eyeTrackingY; lBrowMY = 30 + eyeTrackingY;
                rBrowY = 36 + eyeTrackingY; rBrowMY = 30 + eyeTrackingY;
                eyeScaleY = 0.9;
                break;
            case 'bored':
                eyeScaleY = 0.8;
                lBrowY = 38 + eyeTrackingY; lBrowMY = 38 + eyeTrackingY;
                rBrowY = 38 + eyeTrackingY; rBrowMY = 38 + eyeTrackingY;
                break;
            case 'listening':
                eyeScaleY = 1.05; eyeScaleX = 1.05;
                mLeftX = cx - 12; mRightX = cx + 12;
                mUpperY = cy + 2; mLowerY = cy + 4; 
                lBrowY = 32 + eyeTrackingY; lBrowMY = 24 + eyeTrackingY;
                rBrowY = 32 + eyeTrackingY; rBrowMY = 24 + eyeTrackingY;
                break;
            case 'thinking':
                eyeScaleY = 1.0;
                leftEyeY -= 4; rightEyeY -= 4;
                eyeX += 4; 
                mLeftX = cx - 6; mRightX = cx + 6;
                mUpperY = cy - 4; mLowerY = cy - 2; 
                lBrowY = 32 + eyeTrackingY; lBrowMY = 24 + eyeTrackingY; 
                rBrowY = 32 + eyeTrackingY; rBrowMY = 24 + eyeTrackingY; 
                break;
        }
    }

    if (appStatus === 'speaking') {
        const browLift = audioLevel * 8;
        lBrowY = 36 - browLift + eyeTrackingY; lBrowMY = 32 - browLift * 1.5 + eyeTrackingY;
        rBrowY = 36 - browLift + eyeTrackingY; rBrowMY = 32 - browLift * 1.5 + eyeTrackingY;
        
        // Highly reactive and natural speaking mouth (lip-sync simulation)
        if (audioLevel < 0.03) {
            // Closed mouth (pauses, m/b/p)
            mLeftX = cx - 14; mRightX = cx + 14;
            mUpperY = cy - 1; mLowerY = cy + 2; 
        } else if (audioLevel < 0.1) {
            // Slight open ('E', 'I', 'S')
            mLeftX = cx - 13; mRightX = cx + 13;
            mUpperY = cy - 2; mLowerY = cy + Math.min(4 + audioLevel * 20, 6);
        } else if (audioLevel < 0.3) {
            // Medium open ('A', 'R')
            mLeftX = cx - 10; mRightX = cx + 10;
            mUpperY = cy - 3; mLowerY = cy + Math.min(6 + audioLevel * 15, 10);
        } else {
            // Wide open ('O', 'U') or very loud
            mLeftX = cx - 8; mRightX = cx + 8;
            mUpperY = cy - 4; mLowerY = cy + Math.min(8 + audioLevel * 10, 16);
        }
    }

    // Generate perfectly structured robust SVG paths
    const leftEyebrowPath = `M ${lBrowLX} ${lBrowY} Q ${(lBrowLX+lBrowRX)/2} ${lBrowMY} ${lBrowRX} ${lBrowY}`;
    const rightEyebrowPath = `M ${rBrowLX} ${rBrowY} Q ${(rBrowLX+rBrowRX)/2} ${rBrowMY} ${rBrowRX} ${rBrowY}`;
    const mouthPath = `M ${mLeftX} ${cy} Q ${cx} ${mUpperY} ${mRightX} ${cy} Q ${cx} ${mLowerY} ${mLeftX} ${cy} Z`;

    const containerStyle = size === 'small' 
        ? `w-12 h-12 bg-[#050505] rounded-xl cursor-pointer hover:scale-105 shadow-md flex-shrink-0 ${className}` 
        : `w-64 h-64 bg-[#050505] rounded-[3rem] cursor-pointer hover:scale-105 shadow-2xl mx-auto ${className}`;

    const handleClick = () => {
        if (size === 'large') {
            setReactionCycle((prev) => prev + 1);
        }
        if (onClick) onClick();
    };

    const handlePointerDown = () => {
        if (onPressHold) {
            const timer = setTimeout(() => {
                onPressHold();
            }, 500); 
            setPressTimer(timer);
        }
    };

    const handlePointerCancel = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    return (
        <div 
            className={`relative flex items-center justify-center overflow-hidden border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.02)] transition-all duration-300 ${containerStyle}`}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
            onContextMenu={(e) => {
                if (onPressHold) {
                    e.preventDefault(); 
                }
            }}
        >
            <div 
                className="absolute inset-0 opacity-30 blur-2xl pointer-events-none"
                style={{
                    backgroundColor: 
                        appStatus === 'speaking' ? '#06b6d4' : 
                        appStatus === 'listening' ? '#ef4444' : 
                        appStatus === 'thinking' ? '#d946ef' : 
                        'transparent',
                    transition: 'background-color 0.7s ease'
                }}
            />

            <svg viewBox="0 0 100 100" className="w-[100%] h-[100%] z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] filter p-[2px]">
                <style>
                    {`
                    .face-path {
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .react-fast {
                        transition: all 0.05s linear;
                    }
                    `}
                </style>
                <path 
                    d={leftEyebrowPath} 
                    stroke="white" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round"
                    className={`face-path ${appStatus === 'speaking' ? 'react-fast' : ''}`}
                />
                
                <path 
                    d={rightEyebrowPath} 
                    stroke="white" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round"
                    className={`face-path ${appStatus === 'speaking' ? 'react-fast' : ''}`}
                />

                <ellipse
                    cx={35 + eyeX}
                    cy={leftEyeY}
                    rx={4 * eyeScaleX}
                    ry={4 * eyeScaleY}
                    fill="white"
                    className="face-path"
                />
                
                <ellipse
                    cx={35 + eyeX + (mousePos.x > 0 ? 1 : -1)}
                    cy={leftEyeY + (mousePos.y > 0 ? 1 : -1)}
                    rx={1.5 * eyeScaleX}
                    ry={1.5 * eyeScaleY}
                    fill="black"
                    className="face-path"
                />

                <ellipse
                    cx={65 + eyeX}
                    cy={rightEyeY}
                    rx={4 * eyeScaleX}
                    ry={4 * eyeScaleY}
                    fill="white"
                    className="face-path"
                />

                <ellipse
                    cx={65 + eyeX + (mousePos.x > 0 ? 1 : -1)}
                    cy={rightEyeY + (mousePos.y > 0 ? 1 : -1)}
                    rx={1.5 * eyeScaleX}
                    ry={1.5 * eyeScaleY}
                    fill="black"
                    className="face-path"
                />

                <path 
                    d={mouthPath} 
                    fill="white"
                    className={`face-path ${appStatus === 'speaking' ? 'react-fast' : ''}`}
                />
            </svg>
        </div>
    );
};
