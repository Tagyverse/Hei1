'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

type Message = {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
};

interface WhatsAppChatModalProps {
  onClose: () => void;
}

export default function WhatsAppChatModal({ onClose }: WhatsAppChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [awaitingName, setAwaitingName] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      addBotMessage("Hi there! 👋 Welcome to our store. What's your name?");
    }, 500);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addBotMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        sender: 'bot',
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const message = inputValue.trim();
    addUserMessage(message);
    setInputValue('');

    if (awaitingName) {
      setUserName(message);
      setAwaitingName(false);
      setTimeout(() => {
        addBotMessage(`Nice to meet you, ${message}! 😊 How can I help you today?`);
      }, 800);
    } else {
      setTimeout(() => {
        addBotMessage("Thanks for your message! Click the button below to continue our conversation on WhatsApp.");
      }, 1200);
    }
  };

  const handleWhatsAppRedirect = () => {
    const lastUserMessage = messages.filter(m => m.sender === 'user').pop()?.text || '';
    const whatsappMessage = userName
      ? `Hi, I'm ${userName}. ${lastUserMessage}`
      : lastUserMessage;
    const whatsappNumber = '919345259073';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl flex flex-col w-full max-w-sm h-[600px] sm:h-[650px] max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
          {/* Header */}
          <div className="bg-[#075E54] p-4 flex items-center justify-between flex-shrink-0 border-b-2 border-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 border-2 border-white">
                <img
                  src="https://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png"
                  alt="Store"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">Customer Support</h3>
                <p className="text-emerald-100 text-xs">Online - Ready to help</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-[#064842] p-2 rounded-full transition-colors active:scale-95"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-[#ECE5DD] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSIjZjBmMGYwIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0iI2Y1ZjVmNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mr-2 border border-gray-200 p-1">
                    <img
                      src="https://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png"
                      alt="Store"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 border ${
                    msg.sender === 'user'
                      ? 'bg-[#DCF8C6] text-gray-800 rounded-tr-none border-emerald-200'
                      : 'bg-white text-gray-900 rounded-tl-none border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-gray-500">
                    <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                    {msg.sender === 'user' && (
                      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                        <path d="M11.071.653a.5.5 0 0 0-.707 0L6.5 4.517 5.207 3.224a.5.5 0 0 0-.707.707l1.647 1.646a.5.5 0 0 0 .707 0l4.217-4.217a.5.5 0 0 0 0-.707z" fill="currentColor" opacity="0.6"/>
                        <path d="M15.071.653a.5.5 0 0 0-.707 0L10.5 4.517 9.207 3.224a.5.5 0 0 0-.707.707l1.647 1.646a.5.5 0 0 0 .707 0l4.217-4.217a.5.5 0 0 0 0-.707z" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 mr-2 border border-gray-200 p-1">
                  <img
                    src="https://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png"
                    alt="Store"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-[#F0F0F0] border-t-2 border-gray-300 flex-shrink-0">
            {!awaitingName && messages.filter(m => m.sender === 'user').length > 1 && (
              <div className="px-4 pt-2.5 pb-1.5">
                <button
                  onClick={handleWhatsAppRedirect}
                  className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 text-sm border border-[#20BA5A]"
                >
                  <Send className="w-4 h-4" />
                  Continue on WhatsApp
                </button>
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-full focus:border-[#075E54] focus:outline-none transition-all text-gray-900 placeholder-gray-500 bg-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="p-2.5 bg-[#25D366] hover:bg-[#20BA5A] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-all flex-shrink-0 border border-[#20BA5A] disabled:border-gray-300"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }

        @keyframes typing-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .animate-typing-dot {
          animation: typing-dot 1.4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
