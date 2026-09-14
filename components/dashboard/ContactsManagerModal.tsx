import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Send, Plus } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  category: string;
}

export const ContactsManagerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('عام');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Load from local storage for prototype, can be migrated to Firestore later
    const saved = localStorage.getItem('shadow_contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem('shadow_contacts', JSON.stringify(newContacts));
  };

  const handleAdd = () => {
    if (!name || !phone) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name,
      phone,
      category
    };
    saveContacts([...contacts, newContact]);
    setName('');
    setPhone('');
    setCategory('عام');
  };

  const handleDelete = (id: string) => {
    saveContacts(contacts.filter(c => c.id !== id));
  };

  const handleSend = async (targetPhone: string) => {
    if (!message) {
      setFeedback('يرجى كتابة رسالة أولاً');
      return;
    }
    setIsLoading(true);
    setFeedback('جاري الإرسال...');
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: targetPhone, message })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback('تم الإرسال بنجاح!');
        setMessage('');
      } else {
        setFeedback('خطأ في الإرسال: ' + (data.error || 'غير معروف'));
      }
    } catch (e: any) {
      setFeedback('خطأ في الشبكة.');
    }
    setIsLoading(false);
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999] rtl font-['Cairo']">
      <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white/50" />
        </button>

        <h2 className="text-2xl font-black text-emerald-400 mb-6 flex items-center gap-3">
          جهات الاتصال (كاسبو)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 col-span-1 bg-black/40 p-4 rounded-xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-2">إضافة جهة اتصال</h3>
            <input 
              type="text" 
              placeholder="الاسم" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none transition-colors"
            />
            <input 
              type="text" 
              placeholder="رقم الهاتف (مثل: 2010...)" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none transition-colors"
            />
            <input 
              type="text" 
              placeholder="التصنيف (العمل، العائلة، إلخ)" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none transition-colors"
            />
            <button 
              onClick={handleAdd}
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> إضافة
            </button>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
            {feedback && (
              <div className="bg-emerald-500/20 text-emerald-300 p-3 rounded-lg text-sm font-bold border border-emerald-500/30">
                {feedback}
              </div>
            )}
            
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
              <h3 className="text-sm font-bold text-white/50 mb-2">إرسال رسالة يدوية</h3>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالة لإرسالها لأي جهة اتصال..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none transition-colors h-20 resize-none mb-2 text-right"
                dir="rtl"
              />
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
              {contacts.length === 0 ? (
                <p className="text-white/30 text-center py-10">لا توجد جهات اتصال محفوظة.</p>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 group hover:bg-white/10 transition-colors">
                    <div>
                      <h4 className="text-white font-bold">{c.name}</h4>
                      <p className="text-white/50 text-sm font-mono">{c.phone}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-md border border-emerald-500/20">
                        {c.category}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleSend(c.phone)}
                        disabled={isLoading}
                        className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="إرسال رسالة"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/40 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
