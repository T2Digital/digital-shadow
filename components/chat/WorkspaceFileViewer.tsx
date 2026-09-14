import React, { useState } from 'react';
import { FileText, Printer, X, Volume2, Edit3, Save, Trash2, Share2, Loader2, Copy } from 'lucide-react';

interface WorkspaceFileViewerProps {
    file: any;
    workspaceTab: 'l0' | 'l1' | 'l2';
    setWorkspaceTab: (tab: 'l0' | 'l1' | 'l2') => void;
    onClose: () => void;
    onPlayAudio?: (text: string) => void;
    onShareAudio?: (text: string) => Promise<void>;
    isEditable?: boolean;
    onFileChange?: (newFile: any) => void;
    onSave?: () => void;
    onDelete?: () => void;
}

export const WorkspaceFileViewer: React.FC<WorkspaceFileViewerProps> = ({ 
    file, workspaceTab, setWorkspaceTab, onClose, onPlayAudio, onShareAudio,
    isEditable, onFileChange, onSave, onDelete 
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSharingAudio, setIsSharingAudio] = useState(false);

    if (!file) return null;

    const handleShareText = async () => {
        const rawContent = workspaceTab === 'l0' ? (file.l0_summary || '') : 
                         workspaceTab === 'l1' ? (file.l1_metadata || '') : 
                         (file.l2_content || file.content || '');
        const textToShare = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
        const title = file.name || file.title || 'الملف';
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: textToShare,
                });
            } else {
                await navigator.clipboard.writeText(textToShare);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                await navigator.clipboard.writeText(textToShare);
            }
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>' + file.title + '</title>');
            printWindow.document.write('<style>body { font-family: monospace; white-space: pre-wrap; padding: 20px; color: #000; background: #fff; line-height: 1.5; font-size: 14px; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(
                (workspaceTab === 'l0' ? file.l0_summary : workspaceTab === 'l1' ? file.l1_metadata : (file.l2_content || file.content)) || 'فارغ'
            );
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in select-none">
            <div className="bg-[#151515] border border-white/10 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                            {isEditMode ? (
                                <input 
                                    type="text" 
                                    className="font-bold text-white bg-transparent border-b border-white/20 focus:border-purple-400 outline-none w-full"
                                    value={file.name || file.title || ''}
                                    onChange={(e) => onFileChange?.({ ...file, name: e.target.value, title: e.target.value })}
                                    dir="auto"
                                />
                            ) : (
                                <>
                                    <h3 className="font-bold text-white tracking-widest truncate" dir="ltr">{file.name || file.title}</h3>
                                    <p className="text-[10px] text-white/40 truncate">{file.description}</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isEditable && isEditMode && (
                            <>
                            {onDelete && (
                                <button onClick={() => { onDelete(); onClose(); }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all" title="حذف">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                            <button onClick={() => { onSave?.(); setIsEditMode(false); }} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-bold flex items-center gap-2 transition-all text-sm">
                                <Save className="w-4 h-4" /> حفظ
                            </button>
                            </>
                        )}
                        {isEditable && !isEditMode && (
                            <button onClick={() => setIsEditMode(true)} className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all" title="تعديل">
                                <Edit3 className="w-5 h-5" />
                            </button>
                        )}
                        {onPlayAudio && !isEditMode && (
                            <>
                            <button onClick={async () => {
                                if (onShareAudio) {
                                    setIsSharingAudio(true);
                                    try {
                                        const rawContent = workspaceTab === 'l0' ? (file.l0_summary || '') : 
                                                         workspaceTab === 'l1' ? (file.l1_metadata || '') : 
                                                         (file.l2_content || file.content || '');
                                        const cleanText = typeof rawContent === 'string' ? rawContent.replace(/[#_*`~\[\]]/g, '') : JSON.stringify(rawContent);
                                        await onShareAudio(cleanText);
                                    } finally {
                                        setIsSharingAudio(false);
                                    }
                                }
                            }} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50" disabled={isSharingAudio} title="مشاركة الصوت">
                                {isSharingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                            </button>
                            <button onClick={handleShareText} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-all" title="مشاركة أو نسخ النص">
                                <Copy className="w-5 h-5" />
                            </button>
                            <button onClick={() => {
                                const rawContent = workspaceTab === 'l0' ? (file.l0_summary || '') : 
                                                 workspaceTab === 'l1' ? (file.l1_metadata || '') : 
                                                 (file.l2_content || file.content || '');
                                onPlayAudio(typeof rawContent === 'string' ? rawContent.replace(/[#_*`~\[\]]/g, '') : JSON.stringify(rawContent));
                            }} className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl font-bold flex items-center gap-2 transition-all text-sm">
                                <Volume2 className="w-4 h-4" /> استماع
                            </button>
                            </>
                        )}
                        {file.itemType === 'file' && (
                            <button onClick={handlePrint} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold flex items-center gap-2 transition-all text-sm print:hidden">
                                <Printer className="w-4 h-4" /> طباعة
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-red-400 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] border-b border-white/5">
                      <button onClick={() => setWorkspaceTab('l0')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${workspaceTab === 'l0' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}`}>L0 (Summary)</button>
                      <button onClick={() => setWorkspaceTab('l1')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${workspaceTab === 'l1' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}`}>L1 (Metadata/Headers)</button>
                      <button onClick={() => setWorkspaceTab('l2')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${workspaceTab === 'l2' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'}`}>L2 (Full Content)</button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0f0f0f]" dir="ltr">
                    {isEditMode ? (
                        <div className="flex flex-col h-full gap-4">
                            {workspaceTab === 'l0' && (
                                <textarea 
                                    className="flex-1 w-full bg-black/50 border border-emerald-500/30 rounded-xl p-4 text-emerald-100 font-mono text-sm leading-relaxed outline-none focus:border-emerald-500 resize-none"
                                    value={file.l0_summary || ''}
                                    onChange={(e) => onFileChange?.({ ...file, l0_summary: e.target.value })}
                                />
                            )}
                            {workspaceTab === 'l1' && (
                                <textarea 
                                    className="flex-1 w-full bg-black/50 border border-cyan-500/30 rounded-xl p-4 text-cyan-100 font-mono text-sm leading-relaxed outline-none focus:border-cyan-500 resize-none"
                                    value={file.l1_metadata || ''}
                                    onChange={(e) => onFileChange?.({ ...file, l1_metadata: e.target.value })}
                                />
                            )}
                            {workspaceTab === 'l2' && (
                                <textarea 
                                    className="flex-1 w-full bg-black/50 border border-purple-500/30 rounded-xl p-4 text-purple-100 font-mono text-sm leading-relaxed outline-none focus:border-purple-500 resize-none"
                                    value={file.l2_content || file.content || ''}
                                    onChange={(e) => {
                                        if (file.l2_content !== undefined) {
                                            onFileChange?.({ ...file, l2_content: e.target.value });
                                        } else {
                                            onFileChange?.({ ...file, content: e.target.value });
                                        }
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="text-white/80 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                            {(() => {
                                const rawContent = workspaceTab === 'l0' ? (file.l0_summary || '// لا يوجد L0 (ملخص)') : 
                                                 workspaceTab === 'l1' ? (file.l1_metadata || '// لا يوجد L1 (هيكلة)') : 
                                                 (file.l2_content || file.content || '// لا يوجد L2 (محتوى)');
                            
                            // Simple parser to render markdown images and keep text
                            const renderContent = () => {
                                if (!rawContent) return null;

                                const isImage = file.type === 'image' || (typeof file.name === 'string' && file.name.match(/\.(png|jpe?g|gif|webp|svg)$/i));
                                const isVideo = file.type === 'video' || (typeof file.name === 'string' && file.name.match(/\.(mp4|webm|ogg|mov)$/i));
                                
                                if (isVideo && workspaceTab !== 'l0' && workspaceTab !== 'l1') {
                                    return (
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <video src={(file.l2_content || file.content) || undefined} controls autoPlay className="max-w-full max-h-[60vh] h-auto rounded-xl shadow-2xl object-contain border border-white/10" crossOrigin="anonymous" />
                                        </div>
                                    );
                                }

                                if (isImage && workspaceTab !== 'l0' && workspaceTab !== 'l1') {
                                    return (
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <img src={(file.l2_content || file.content) || undefined} alt={file.name} className="max-w-full max-h-[60vh] h-auto rounded-xl shadow-2xl object-contain border border-white/10" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                                        </div>
                                    );
                                }

                                if (file.type === 'audio') {
                                    return (
                                        <div className="flex flex-col items-center justify-center space-y-6 bg-black/40 p-8 rounded-2xl border border-white/5">
                                            <div className="w-24 h-24 rounded-full bg-violet-500/20 flex items-center justify-center animate-pulse">
                                                <Volume2 className="w-12 h-12 text-violet-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white">{file.name}</h3>
                                            <audio src={rawContent || undefined} controls className="w-full max-w-md filter drop-shadow-lg" autoPlay />
                                        </div>
                                    );
                                }

                                // Try parsing as JSON first
                                if (rawContent.trim().startsWith('{') && rawContent.trim().endsWith('}')) {
                                    try {
                                        const data = JSON.parse(rawContent);
                                        return (
                                            <div className="space-y-4 font-sans" dir="auto">
                                                {data.title && <h1 className="text-2xl font-black text-emerald-400 select-none">{data.title}</h1>}
                                                {(data.description || data.summary) && <p className="text-white/80 text-base select-text">{data.description || data.summary}</p>}
                                                
                                                {data.tasks && Array.isArray(data.tasks) && (
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-4 select-none">
                                                        <h2 className="text-lg font-bold text-white mb-3">المهام / Tasks</h2>
                                                        <ul className="space-y-2">
                                                            {data.tasks.map((t: any, i: number) => (
                                                                <li key={i} className="flex items-center gap-3">
                                                                    <div className={`w-4 h-4 rounded-md border shrink-0 ${t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : t.status === 'in_progress' ? 'bg-amber-500 border-amber-500' : 'border-white/20'}`}></div>
                                                                    <span className={t.status === 'done' ? 'line-through text-white/40' : 'text-white/90'}>{t.title || t.task || t.name}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <details className="mt-8 border-t border-white/10 pt-4 select-none">
                                                    <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 focus:outline-none">عرض الشفرة البرمجية (JSON Source)</summary>
                                                    <pre className="mt-4 text-[11px] text-white/50 bg-[#0a0a0a] p-4 rounded-lg overflow-x-auto border border-white/5 shadow-inner select-text" dir="ltr">
                                                        {JSON.stringify(data, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        );
                                    } catch (e) {
                                        // Ignore parse error
                                    }
                                }

                                // Try parsing as Hybrid Markdown (YAML/JSON frontmatter)
                                const hybridMatch = rawContent.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/);
                                if (hybridMatch) {
                                    const meta = hybridMatch[1];
                                    const body = hybridMatch[2];
                                    
                                    const chunks = body.split(/(!\[.*?\]\(.*?\))/g);
                                    const renderedBody = chunks.map((part: string, i: number) => {
                                        const match = part.match(/!\[(.*?)\]\((.*?)\)/);
                                        if (match) {
                                            return <img key={i} src={match[2] || undefined} alt={match[1]} className="max-w-full h-auto rounded-lg my-4 border border-white/10 shadow-lg object-contain bg-black/50 select-none" crossOrigin="anonymous" referrerPolicy="no-referrer" />;
                                        }
                                        return <span key={i} className="select-text">{part}</span>;
                                    });

                                    return (
                                        <div className="font-sans" dir="auto">
                                            <div className="text-white/90 whitespace-pre-wrap leading-loose text-base select-text">{renderedBody}</div>
                                            <details className="mt-8 border-t border-white/10 pt-4 select-none">
                                                <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60 focus:outline-none">عرض البيانات الوصفية (Metadata)</summary>
                                                <pre className="mt-4 text-[11px] text-white/50 bg-[#0a0a0a] p-4 rounded-lg overflow-x-auto border border-white/5 shadow-inner select-text" dir="ltr">
                                                    {meta}
                                                </pre>
                                            </details>
                                        </div>
                                    );
                                }

                                // Fallback normal markdown
                                const parts = rawContent.split(/(!\[.*?\]\(.*?\))/g);
                                return <div className="font-sans leading-loose text-white/90 text-base select-text" dir="auto">
                                    {parts.map((part: string, i: number) => {
                                        const match = part.match(/!\[(.*?)\]\((.*?)\)/);
                                        if (match) {
                                            return <img key={i} src={match[2] || undefined} alt={match[1]} className="max-w-full h-auto rounded-lg my-4 border border-white/10 shadow-lg object-contain bg-black/50 select-none" crossOrigin="anonymous" referrerPolicy="no-referrer" />;
                                        }
                                        return <span key={i} className="select-text">{part}</span>;
                                    })}
                                </div>;
                            };

                            return renderContent();
                        })()}
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};
