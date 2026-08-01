import React, { useState } from 'react';
import { X, UserPlus, Phone, Bot } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (name: string, phone: string, isAiManaged: boolean) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAiManaged, setIsAiManaged] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateChat(name, phone || '050-0000000', isAiManaged);
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#222e35] text-[#e9edef] w-full max-w-md rounded-xl shadow-2xl border border-[#2a3942] overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-[#2a3942] bg-[#111b21]">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00a884]" />
            התחל צ'אט / איש קשר חדש
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              שם איש הקשר / עסק *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: יובל - הזמנת אירוע"
              className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              מספר טלפון
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#8696a0] absolute right-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-1234567"
                className="w-full bg-[#111b21] border border-[#2a3942] rounded-lg pr-9 pl-3 py-2 text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#111b21] p-3 rounded-lg border border-[#2a3942]">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00a884]" />
              <div>
                <p className="text-xs font-semibold text-[#e9edef]">מענה אוטומטי Noa AI</p>
                <p className="text-[11px] text-[#8696a0]">נועה AI תשיב אוטומטית להודעות בצ'אט זה</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAiManaged}
              onChange={(e) => setIsAiManaged(e.target.checked)}
              className="w-4 h-4 accent-[#00a884] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-white"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#00a884] hover:bg-[#008f70] text-[#111b21] rounded-lg transition-colors"
            >
              צור צ'אט
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
