import React, { useEffect, useRef, useState } from 'react';

const namesOfAllah = [
    'اللَّهُ', 'الرَّحْمَنُ', 'الرَّحِيمُ', 'الْمَلِكُ', 'الْقُدُّوسُ', 'السَّلَامُ', 'الْمُؤْمِنُ', 'الْمُهَيْمِنُ', 'الْعَزِيزُ', 'الْجَبَّارُ', 
    'الْمُتَكَبِّرُ', 'الْخَالِقُ', 'الْبَارِئُ', 'الْمُصَوِّرُ', 'الْغَفَّارُ', 'الْقَهَّارُ', 'الْوَهَّابُ', 'الرَّزَّاقُ', 'الْفَتَّاحُ', 'الْعَلِيمُ'
];

const constellations = [
    { name: 'سيريوس (Sirius)', fact: 'الشعرى اليمانية: ألمع نجوم السماء بـ 25 ضعف لمعان شمسنا.' },
    { name: 'منكب الجوزاء (Betelgeuse)', fact: 'عملاق أحمر مشع يقترب من نهاية حياته، يبعد 640 سنة ضوئية.' },
    { name: 'النسر الواقع (Vega)', fact: 'خامس ألمع نجم في السماء، أهم نجوم الصيف وأكثرها دراسة.' },
    { name: 'النجم القطبي (Polaris)', fact: 'لا يغير مكانه ويشير دائماً إلى الشمال، دليل المسافرين الدائم.' },
    { name: 'رجل الجبار (Rigel)', fact: 'عملاق أزرق هائل اللمعان، يرى بوضوح في فصل الشتاء.' }
];

const SpaceCanvas: React.FC<{ interactive?: boolean; showEarth?: boolean }> = ({ interactive = true, showEarth = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [issData, setIssData] = useState({ lat: 0, lon: 0, alt: 420, vel: 27500 });
    const issDataRef = useRef({ lat: 0, lon: 0, alt: 420, vel: 27500 });

    useEffect(() => {
        const fetchISS = () => {
            fetch('https://api.wheretheiss.at/v1/satellites/25544')
                .then(r => r.json())
                .then(d => {
                    const newData = { lat: d.latitude, lon: d.longitude, alt: d.altitude, vel: d.velocity };
                    setIssData(newData);
                    issDataRef.current = newData;
                })
                .catch(() => {});
        };
        fetchISS();
        const int = setInterval(fetchISS, 10000);
        return () => clearInterval(int);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const entities: {x: number, y: number, z: number, o: number, size: number, color: string, text?: string, fact?: string, type: 'star' | 'warp_star' | 'allah' | 'constellation'}[] = [];
        const numStars = 600;
        
        const colors = ['#ffffff', '#e0f7fa', '#f3e5f5', '#fff9c4', '#e8eaf6'];
        
        // Background Stars (Static)
        for (let i = 0; i < numStars; i++) {
            entities.push({
                x: (Math.random() - 0.5) * width * 3,
                y: (Math.random() - 0.5) * height * 3,
                z: Math.random() * width,
                o: Math.random() * 0.8 + 0.2,
                size: Math.random() * 1.5 + 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                type: 'star'
            });
        }

        // Warp Stars (Moving fast)
        for (let i = 0; i < 200; i++) {
            entities.push({
                x: (Math.random() - 0.5) * width * 3,
                y: (Math.random() - 0.5) * height * 3,
                z: Math.random() * width,
                o: Math.random() * 0.8 + 0.2,
                size: Math.random() * 2 + 1,
                color: '#ffffff',
                type: 'warp_star'
            });
        }

        // Names of Allah
        namesOfAllah.forEach((name, i) => {
            entities.push({
                x: (Math.random() - 0.5) * width * 4,
                y: (Math.random() - 0.5) * height * 4,
                z: Math.random() * width,
                o: 0.8,
                size: 32, // font size base
                color: '#2dd4bf', // Teal glowing text
                text: name,
                type: 'allah'
            });
        });

        // Constellations
        constellations.forEach(c => {
            entities.push({
                x: (Math.random() - 0.5) * width * 4,
                y: (Math.random() - 0.5) * height * 4,
                z: Math.random() * (width / 2),
                o: 1,
                size: 3, // slightly bigger star dot
                color: '#fbbf24', // Amber star
                text: c.name,
                fact: c.fact,
                type: 'constellation'
            });
        });

        // Load Earth & Moon Images safely
        const earthImg = new Image();
        earthImg.crossOrigin = 'anonymous'; 
        earthImg.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
        
        const moonImg = new Image();
        moonImg.crossOrigin = 'anonymous';
        moonImg.src = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';

        let animationFrameId: number;
        let targetSpeed = 3.0; // Faster base swimming speed
        let currentSpeed = 3.0;
        let issRef = issData; // Capture latest inside loop

        // Camera Pan/Zoom variables
        let bgPanX = 0;
        let bgPanY = 0;
        let bgZoom = 1;
        
        let targetPanX = 0;
        let targetPanY = 0;
        let targetZoom = 1;

        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        
        const activePointers = new Map<number, {x: number, y: number}>();
        let initialPinchDist: number | null = null;
        let initialPinchZoom = 1;

        const handlePointerDown = (e: PointerEvent) => {
            if (!interactive) return;
            const target = e.target as HTMLElement;
            if (target.closest('.no-canvas-pan')) return;
            
            activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            
            if (activePointers.size === 1) {
                isDragging = true;
                lastX = e.clientX;
                lastY = e.clientY;
            } else if (activePointers.size === 2) {
                isDragging = false;
                const pts = Array.from(activePointers.values());
                initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                initialPinchZoom = targetZoom;
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (!interactive) return;
            if (activePointers.has(e.pointerId)) {
                activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            }

            if (activePointers.size === 1 && isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                targetPanX += dx;
                targetPanY += dy;
                lastX = e.clientX;
                lastY = e.clientY;
            } else if (activePointers.size === 2 && initialPinchDist !== null) {
                const pts = Array.from(activePointers.values());
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                const scale = dist / initialPinchDist;
                targetZoom = Math.min(Math.max(initialPinchZoom * scale, 0.2), 10);
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (!interactive) return;
            activePointers.delete(e.pointerId);
            if (activePointers.size < 2) initialPinchDist = null;
            if (activePointers.size === 1) {
                const p = Array.from(activePointers.values())[0];
                lastX = p.x;
                lastY = p.y;
                isDragging = true;
            } else if (activePointers.size === 0) {
                isDragging = false;
            }
        };

        const handleDoubleClick = (e: MouseEvent) => {
            if (!interactive) return;
            targetZoom *= 1.5;
            if (targetZoom > 5) {
                targetZoom = 1;
                targetPanX = 0;
                targetPanY = 0;
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (!interactive) return;
            if (e.ctrlKey) {
                e.preventDefault();
                targetZoom -= e.deltaY * 0.01;
                targetZoom = Math.max(0.2, Math.min(targetZoom, 10));
            } else {
                targetSpeed = e.deltaY < 0 ? Math.min(targetSpeed + 3, 20) : Math.max(targetSpeed - 3, -10);
                setTimeout(() => { targetSpeed = 1.0; }, 300);
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        window.addEventListener('dblclick', handleDoubleClick);
        window.addEventListener('wheel', handleWheel, { passive: false });

        const drawImageSafe = (img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
            if (img.complete && img.naturalWidth !== 0 && !img.src.endsWith('undefined')) {
                try {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x + w/2, y + h/2, w/2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, x, y, w, h);
                    ctx.restore();
                } catch(e) {}
            } else {
                ctx.beginPath();
                ctx.arc(x + w/2, y + h/2, w/2, 0, 2*Math.PI);
                ctx.fillStyle = img === earthImg ? 'rgba(0, 50, 150, 1)' : 'rgba(150, 150, 150, 1)';
                ctx.fill();
            }
        };

        const drawRotatingImageSafe = (img: HTMLImageElement, x: number, y: number, size: number, time: number, speed: number) => {
            if (img.complete && img.naturalWidth !== 0 && !img.src.endsWith('undefined')) {
                try {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                    ctx.clip();
                    const wid = size * 2; 
                    const offset = (time * speed) % wid;
                    ctx.drawImage(img, x - offset, y, wid, size);
                    ctx.drawImage(img, x - offset + wid, y, wid, size);
                    ctx.restore();
                } catch(e) { }
            } else {
                drawImageSafe(img, x, y, size, size);
            }
        };

        const render = () => {
            currentSpeed += (targetSpeed - currentSpeed) * 0.1;
            bgPanX += (targetPanX - bgPanX) * 0.1;
            bgPanY += (targetPanY - bgPanY) * 0.1;
            bgZoom += (targetZoom - bgZoom) * 0.1;

            ctx.fillStyle = '#020008';
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            const cx = width / 2;
            const cy = height / 2;
            
            ctx.translate(cx, cy);
            ctx.scale(bgZoom, bgZoom);
            ctx.translate(-cx + bgPanX, -cy + bgPanY);

            // Render Entities (Stars, Names, Constellations)
            for (let i = 0; i < entities.length; i++) {
                const s = entities[i];
                
                // Movement logic based on type
                if (s.type === 'warp_star') {
                    s.z -= currentSpeed * 5.0; // Warp speed
                } else if (s.type === 'allah') {
                    s.z -= currentSpeed * 0.5; // Very slow and readable
                } else {
                    // Static stars and constellations don't move forward in space, they just pan/zoom with camera
                    // They stay fixed in their z position
                }
                
                if (s.z <= 0) {
                    s.z = width;
                    s.x = (Math.random() - 0.5) * width * 4;
                    s.y = (Math.random() - 0.5) * height * 4;
                } else if (s.z >= width) {
                    s.z = 0;
                    s.x = (Math.random() - 0.5) * width * 4;
                    s.y = (Math.random() - 0.5) * height * 4;
                }

                const px = cx + (s.x / s.z) * cx;
                const py = cy + (s.y / s.z) * cy;

                // Frustum culling margin
                if (px >= -cx*2 && px <= width+cx*2 && py >= -cy*2 && py <= height+cy*2) {
                    const depth = Math.max(0, 1 - s.z / width);
                    
                    if (s.type === 'star' || s.type === 'warp_star') {
                        const size = Math.max(0.5, s.size * depth * ((s.type === 'warp_star' && currentSpeed > 2) ? 2.5 : 1)); 
                        const twinkle = Math.sin(Date.now() * 0.001 + s.x) * 0.5 + 0.5;
                        const opacity = Math.max(0, Math.min(1, s.o * depth * (0.8 + 0.2 * twinkle)));
                        
                        if (s.type === 'warp_star') {
                            ctx.fillStyle = s.color;
                            ctx.globalAlpha = opacity;
                            // draw stretched line for warp effect
                            ctx.fillRect(px, py, size * 0.5, size * (currentSpeed * 0.5));
                        } else {
                            ctx.fillStyle = s.color;
                            ctx.globalAlpha = opacity;
                            ctx.fillRect(px, py, size, size);
                        }
                    } else if (s.type === 'allah') {
                        const fontSize = Math.max(16, s.size * depth * 1.5);
                        ctx.font = "normal " + fontSize + "px 'Amiri', 'Cairo', serif";
                        const glowOpacity = Math.max(0.4, Math.min(1, depth * s.o * 2.5));
                        ctx.globalAlpha = glowOpacity;
                        ctx.fillStyle = s.color;
                        ctx.textAlign = 'center';
                        ctx.fillText(s.text!, px, py);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(s.text!, px, py);
                    } else if (s.type === 'constellation') {
                        ctx.globalAlpha = Math.max(0, Math.min(1, depth * s.o));
                        const radGrad = ctx.createRadialGradient(px, py, 0, px, py, s.size * depth * 2);
                        radGrad.addColorStop(0, s.color);
                        radGrad.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = radGrad;
                        ctx.beginPath();
                        ctx.arc(px, py, s.size * depth * 2, 0, Math.PI*2);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(px, py, s.size * depth * 0.5, 0, Math.PI*2);
                        ctx.fill();
                        
                        // Label and Fact
                        ctx.textAlign = 'center';
                        const fBig = Math.max(10, 14 * depth);
                        ctx.font = "bold " + fBig + "px Cairo, sans-serif";
                        ctx.fillText(s.text!, px, py - 12);
                        
                        ctx.fillStyle = 'rgba(255,255,255,0.6)';
                        const fSmall = Math.max(8, 10 * depth);
                        ctx.font = "lighter " + fSmall + "px Cairo, sans-serif";
                        ctx.fillText(s.fact!, px, py + 15);
                    }
                }
            }

            ctx.globalAlpha = 1.0;

            if (showEarth) {
                const earthSize = 220;
                const earthX = cx - earthSize / 2;
                const earthY = cy - earthSize / 2;
                const time = Date.now() * 0.0005;

                // Solar System Planets (Static scattered layout for user to pan/explore)
                // Coordinates relative to Earth
                const drawPlanet = (name: string, pX: number, pY: number, pSize: number, color1: string, color2: string, rings?: boolean) => {
                    const gP = ctx.createRadialGradient(pX - pSize*0.3, pY - pSize*0.3, pSize*0.1, pX, pY, pSize);
                    gP.addColorStop(0, color1);
                    gP.addColorStop(0.6, color2);
                    gP.addColorStop(1, '#000000');

                    ctx.beginPath();
                    ctx.arc(pX, pY, pSize, 0, Math.PI*2);
                    ctx.fillStyle = gP;
                    ctx.fill();

                    // Inner shadow crescent to make it 3D spherical
                    const innerShadow = ctx.createRadialGradient(pX + pSize*0.2, pY + pSize*0.2, pSize*0.4, pX, pY, pSize);
                    innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
                    innerShadow.addColorStop(0.7, 'rgba(0,0,0,0.5)');
                    innerShadow.addColorStop(1, 'rgba(0,0,0,0.9)');
                    ctx.beginPath();
                    ctx.arc(pX, pY, pSize, 0, Math.PI*2);
                    ctx.fillStyle = innerShadow;
                    ctx.fill();

                    if (rings) {
                        ctx.beginPath();
                        ctx.ellipse(pX, pY, pSize*2.2, pSize*0.4, Math.PI/8, 0, Math.PI*2);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                        ctx.lineWidth = pSize * 0.3;
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.ellipse(pX, pY, pSize*1.8, pSize*0.3, Math.PI/8, 0, Math.PI*2);
                        ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
                        ctx.lineWidth = pSize * 0.1;
                        ctx.stroke();
                    }

                    // Label
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = 'bold 12px Cairo, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(name, pX, pY - pSize - 15);
                };

                // Sun
                drawPlanet('الشمس (Sun)', earthX - 4000, earthY + 500, 1000, 'rgba(255,255,200,1)', 'rgba(255,150,0,0.8)');
                // Mercury
                drawPlanet('عطارد (Mercury)', earthX - 2200, earthY + 100, 40, '#d4d4d8', '#71717a');
                // Venus
                drawPlanet('الزهرة (Venus)', earthX - 1200, earthY - 200, 80, '#fef08a', '#ca8a04');
                // Mars
                drawPlanet('المريخ (Mars)', earthX + 1500, earthY + 300, 60, '#fca5a5', '#b91c1c');
                // Jupiter
                drawPlanet('المشتري (Jupiter)', earthX + 3500, earthY - 800, 400, '#fcd34d', '#92400e');
                // Saturn
                drawPlanet('زحل (Saturn)', earthX + 6500, earthY + 1000, 300, '#fef3c7', '#b45309', true);


                // Moon - orbiting Earth
                const orbitRadX = 180;
                const orbitRadY = 60;
                const moonSize = 40;
                const moonX = earthX + earthSize/2 + Math.cos(time) * orbitRadX - moonSize/2;
                const moonY = earthY + earthSize/2 + Math.sin(time) * orbitRadY - moonSize/2;

                // ISS - Real Time positioning (simulated orbit mapped to data)
                // Use ISS Longitude for position in orbit
                issRef = issDataRef.current; // update ref inside render frame
                const issAngle = (issRef.lon * Math.PI) / 180 + time * 0.1; // Add subtle movement
                const issOrbitRad = (earthSize / 2) + 60; // 60px above earth surface
                const iX = earthX + earthSize/2 + Math.cos(issAngle) * (issOrbitRad * 1.5);
                const iY = earthY + earthSize/2 + Math.sin(issAngle) * (issOrbitRad * 0.5);
                
                const drawISS = (isFront: boolean) => {
                    const inFront = Math.sin(issAngle) > 0;
                    if (isFront !== inFront) return;

                    const radGrad = ctx.createRadialGradient(iX, iY, 0, iX, iY, 8);
                    radGrad.addColorStop(0, '#06b6d4');
                    radGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = radGrad;
                    ctx.beginPath();
                    ctx.arc(iX, iY, 8, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(iX, iY, 2, 0, Math.PI*2);
                    ctx.fill();

                    // Panels
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(iX - 12, iY - 3, 8, 6);
                    ctx.fillRect(iX + 4, iY - 3, 8, 6);

                    // ISS Labels
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.font = 'bold 10px Cairo, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('محطة الفضاء الدولية (ISS)', iX, iY - 15);
                    ctx.fillStyle = 'rgba(6,182,212,0.8)';
                    ctx.font = '9px Cairo, sans-serif';
                    ctx.fillText("Alt: " + Math.floor(issRef.alt) + "km | Vel: " + Math.floor(issRef.vel) + "km/h", iX, iY + 15);
                }

                // Draw Agents Orbits
                const orbit1Dist = 1.6;
                const orbit2Dist = 2.2;
                
                ctx.beginPath();
                ctx.ellipse(earthX + earthSize/2, earthY + earthSize/2, earthSize * orbit1Dist * 0.8, earthSize * orbit1Dist * 0.3, 0, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.beginPath();
                ctx.ellipse(earthX + earthSize/2, earthY + earthSize/2, earthSize * orbit2Dist * 0.8, earthSize * orbit2Dist * 0.3, 0, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.stroke();

                const agents = [
                    { name: 'Maestro',  color: '#8b5cf6', offset: (Math.PI * 2) * (0/5),   speed: 0.8,  distance: orbit1Dist, size: 8 },
                    { name: 'Architect',color: '#3b82f6', offset: (Math.PI * 2) * (1/5),   speed: 0.8,  distance: orbit1Dist, size: 6 },
                    { name: 'Detective',color: '#10b981', offset: (Math.PI * 2) * (2/5),   speed: 0.8,  distance: orbit1Dist, size: 7 },
                    { name: 'Accountant',color: '#f59e0b',offset: (Math.PI * 2) * (3/5),   speed: 0.8,  distance: orbit1Dist, size: 6 },
                    { name: 'Executor', color: '#ef4444', offset: (Math.PI * 2) * (4/5),   speed: 0.8,  distance: orbit1Dist, size: 7 },
                    { name: 'Nexus',    color: '#06b6d4', offset: (Math.PI * 2) * (0/6),   speed: -0.6, distance: orbit2Dist, size: 8 },
                    { name: 'Lawyer',   color: '#64748b', offset: (Math.PI * 2) * (1/6),   speed: -0.6, distance: orbit2Dist, size: 6 },
                    { name: 'Analyst',  color: '#d946ef', offset: (Math.PI * 2) * (2/6),   speed: -0.6, distance: orbit2Dist, size: 7 },
                    { name: 'Healer',   color: '#14b8a6', offset: (Math.PI * 2) * (3/6),   speed: -0.6, distance: orbit2Dist, size: 5 },
                    { name: 'Marketer', color: '#ec4899', offset: (Math.PI * 2) * (4/6),   speed: -0.6, distance: orbit2Dist, size: 6 },
                    { name: 'Trader',   color: '#eab308', offset: (Math.PI * 2) * (5/6),   speed: -0.6, distance: orbit2Dist, size: 8 }
                ];

                const drawAgent = (agent: typeof agents[0], front: boolean) => {
                    const agentAngle = time * agent.speed + agent.offset;
                    const isFront = Math.sin(agentAngle) > 0;
                    if (isFront !== front) return;
                    const ax = earthX + earthSize/2 + Math.cos(agentAngle) * (earthSize * agent.distance * 0.8);
                    const ay = earthY + earthSize/2 + Math.sin(agentAngle) * (earthSize * agent.distance * 0.3);
                    ctx.beginPath(); ctx.arc(ax, ay, agent.size, 0, Math.PI * 2);
                    const radGrad = ctx.createRadialGradient(ax, ay, 0, ax, ay, agent.size * 2);
                    radGrad.addColorStop(0, agent.color);
                    radGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = radGrad;
                    ctx.beginPath(); ctx.arc(ax, ay, agent.size * 2, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ax, ay, agent.size * 0.6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '10px Cairo, sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(agent.name, ax, ay - 12);
                };

                // Elements behind Earth
                agents.forEach(a => drawAgent(a, false));
                drawISS(false);
                if (Math.sin(time) <= 0) {
                     drawRotatingImageSafe(moonImg, moonX, moonY, moonSize, time, 50);
                     const gMoon = ctx.createRadialGradient(moonX + moonSize*0.3, moonY + moonSize*0.3, 0, moonX + moonSize/2, moonY + moonSize/2, moonSize);
                     gMoon.addColorStop(0, 'rgba(255,255,255,0.2)'); gMoon.addColorStop(0.4, 'rgba(0,0,0,0)');
                     gMoon.addColorStop(0.8, 'rgba(0,0,0,0.8)'); gMoon.addColorStop(1, 'rgba(0,0,0,1)');
                     ctx.beginPath(); ctx.arc(moonX + moonSize/2, moonY + moonSize/2, moonSize/2, 0, 2*Math.PI);
                     ctx.fillStyle = gMoon; ctx.fill();
                }

                // Earth Base Glow
                const earthGlow = ctx.createRadialGradient(earthX + earthSize/2, earthY + earthSize/2, earthSize/2 * 0.8, earthX + earthSize/2, earthY + earthSize/2, earthSize/2 * 1.5);
                earthGlow.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
                earthGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(earthX + earthSize/2, earthY + earthSize/2, earthSize/2 * 1.5, 0, 2*Math.PI);
                ctx.fillStyle = earthGlow;
                ctx.fill();
                
                // Earth (rotate slowly)
                drawRotatingImageSafe(earthImg, earthX, earthY, earthSize, time, 20);
                
                // Earth shadow overlay
                const gEarth = ctx.createRadialGradient(earthX + earthSize*0.3, earthY + earthSize*0.3, 0, earthX + earthSize/2, earthY + earthSize/2, earthSize);
                gEarth.addColorStop(0, 'rgba(255,255,255,0.1)');
                gEarth.addColorStop(0.4, 'rgba(0,0,0,0)');
                gEarth.addColorStop(0.8, 'rgba(0,0,0,0.7)');
                gEarth.addColorStop(1, 'rgba(0,0,0,1)');
                ctx.beginPath();
                ctx.arc(earthX + earthSize/2, earthY + earthSize/2, earthSize/2, 0, 2*Math.PI);
                ctx.fillStyle = gEarth;
                ctx.fill();

                // Elements in front of Earth
                if (Math.sin(time) > 0) {
                     drawRotatingImageSafe(moonImg, moonX, moonY, moonSize, time, 50);
                     const gMoon = ctx.createRadialGradient(moonX + moonSize*0.3, moonY + moonSize*0.3, 0, moonX + moonSize/2, moonY + moonSize/2, moonSize);
                     gMoon.addColorStop(0, 'rgba(255,255,255,0.2)'); gMoon.addColorStop(0.4, 'rgba(0,0,0,0)');
                     gMoon.addColorStop(0.8, 'rgba(0,0,0,0.8)'); gMoon.addColorStop(1, 'rgba(0,0,0,1)');
                     ctx.beginPath(); ctx.arc(moonX + moonSize/2, moonY + moonSize/2, moonSize/2, 0, 2*Math.PI);
                     ctx.fillStyle = gMoon; ctx.fill();
                }
                drawISS(true);
                agents.forEach(a => drawAgent(a, true));
            }

            ctx.restore();
            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
            window.removeEventListener('dblclick', handleDoubleClick);
            window.removeEventListener('wheel', handleWheel);
            cancelAnimationFrame(animationFrameId);
        };
    }, [interactive]);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
            style={{ background: '#020008' }}
        />
    );
};

export default React.memo(SpaceCanvas);

