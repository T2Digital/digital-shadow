import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export const TradingViewChart = ({ card }: { card: any }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Clear previous children just in case
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (typeof (window as any).TradingView !== 'undefined') {
                new (window as any).TradingView.widget({
                    autosize: true,
                    symbol: card.symbol || "BINANCE:BTCUSDT",
                    interval: card.interval || "D",
                    timezone: "Etc/UTC",
                    theme: "dark",
                    style: "1",
                    locale: "en",
                    enable_publishing: false,
                    backgroundColor: "rgba(0, 0, 0, 1)",
                    gridColor: "rgba(255, 255, 255, 0.05)",
                    hide_top_toolbar: true,
                    hide_legend: false,
                    save_image: false,
                    container_id: containerRef.current?.id,
                });
            }
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [card.symbol, card.interval]);

    const containerId = `tv_chart_${Math.random().toString(36).substring(7)}`;

    return (
        <div className="mt-4 rounded-[22px] p-1 w-full md:w-[600px] h-[400px] bg-[#000000]/95 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] overflow-hidden relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 z-10"></div>
            
            <div className="flex items-center gap-3 p-3 bg-black/50 z-10">
                <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400">
                    <Activity className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="font-bold text-[13px] text-white">Live Market Data</h3>
                    <p className="text-[10px] text-white/50">{card.symbol}</p>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <div id={containerId} ref={containerRef} className="w-full h-full absolute inset-0" />
            </div>

            {card.analysis && (
                <div className="p-3 bg-blue-950/30 border-t border-blue-500/20 z-10 overflow-y-auto max-h-[100px]">
                    <p className="text-xs leading-relaxed text-blue-100/90">{card.analysis}</p>
                </div>
            )}
        </div>
    );
};
