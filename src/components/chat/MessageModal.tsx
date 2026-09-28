import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Message } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Send, Shield, AlertTriangle, Clock } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextType: 'request' | 'application';
  contextId: string;
  receiverId: string;
  onReport?: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  contextType,
  contextId,
  receiverId,
  onReport,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contextId) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, contextId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.getMessages(contextType, contextId);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await api.sendMessage({
        context_type: contextType,
        context_id: contextId,
        receiver_id: receiverId,
        content: content.trim(),
      });
      setContent('');
      await loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="In-App Direct Discussion"
      subtitle="Secure connection channel between educator and family / institute"
      maxWidth="lg"
    >
      <div className="flex flex-col h-[460px] text-xs">
        {/* Safety Header Banner */}
        <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl mb-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-blue-900 text-[11px]">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Tealign Trust Filter Active · Keep discussions respectful and educational</span>
          </div>

          {onReport && (
            <button
              onClick={onReport}
              className="text-[10px] text-red-600 hover:underline font-semibold shrink-0"
            >
              Report
            </button>
          )}
        </div>

        {/* Message bubbles stream */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No messages yet in this discussion. Say hello to introduce yourself!
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-xs shadow-2xs'
                        : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {!isMine && (
                      <div className="font-bold text-[10px] text-blue-600 mb-0.5">
                        {m.sender_name}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="mt-3 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-blue-600 text-xs text-slate-900"
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </Modal>
  );
};
