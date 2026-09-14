import React from 'react';
import WorkspaceExplorer from '../WorkspaceExplorer';
import { X, FolderOpen } from 'lucide-react';
import { UserProfile } from '../../services/dbService';

export const WorkspaceModal: React.FC<{ user: UserProfile, onClose: () => void }> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" dir="rtl">
            <div className="bg-[#111] border border-purple-500/20 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden font-['Cairo']">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                            <FolderOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-lg font-black text-white">وورك سبيس الظل</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden relative">
                    <WorkspaceExplorer 
                        userId={user.email || 'GUEST'} 
                        onItemSelect={() => {}} // We just let them view it here
                    />
                </div>
            </div>
        </div>
    );
};
