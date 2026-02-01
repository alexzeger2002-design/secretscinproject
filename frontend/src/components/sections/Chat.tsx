import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Zap, Send } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useLanding } from '../../contexts/LandingContext';
import contentData from '../../data/content.json';
import videoChat from '../../pages/б16.mp4';

interface Message {
  id: number;
  type: string;
  sender: string;
  content?: string;
  src?: string;
  poster?: string;
  delay: number;
}

export function Chat() {
  const { chat, global } = contentData;
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  
  let landingContext;
  try {
    landingContext = useLanding();
  } catch {
    landingContext = null;
  }

  const handleClick = () => {
    if (landingContext?.onTelegramClick) {
      landingContext.onTelegramClick();
    }
  };

  const finalHref = landingContext?.redirectUrl || global.botUrl;

  useEffect(() => {
    const messages = chat.messages as Message[];
    
    // Очищаем предыдущие сообщения только при первом рендере
    setVisibleMessages([]);
    
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    messages.forEach((message) => {
      const timeout = setTimeout(() => {
        setVisibleMessages((prev) => {
          // Проверяем, нет ли уже этого сообщения
          if (prev.find(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }, message.delay * 1000);
      
      timeouts.push(timeout);
    });
    
    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Убрал зависимость от chat.messages, чтобы эффект запускался только один раз

  return (
    <section className="relative z-10 -mt-4 pb-6 md:py-20 px-4">
      <div className="max-w-md mx-auto">
        <GlassCard className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF007A] to-[#7B2CBF] flex items-center justify-center font-bold text-white">
              Б
            </div>
            <div>
              <div className="font-bold text-white text-sm md:text-base">{chat.botName}</div>
              <div className="text-xs text-[#00F0FF]">{chat.status}</div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 text-sm md:text-base">
            <AnimatePresence>
              {visibleMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'text' && (
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-[85%] ${
                        message.sender === 'user'
                          ? 'bg-slate-700/50 text-slate-200 rounded-tr-none'
                          : 'bg-purple-900/40 text-white border border-purple-500/20 rounded-tl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                  )}

                  {message.type === 'video' && (
                    <div className="relative overflow-hidden rounded-xl border border-purple-500/30 w-full max-w-[200px] bg-black group">
                      <video
                        src={videoChat}
                        className="w-full h-full object-contain"
                        loop
                        muted
                        playsInline
                        autoPlay
                        style={{ maxHeight: '400px', display: 'block' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3 pointer-events-none">
                        <span className="text-xs font-mono text-[#00F0FF] flex items-center gap-1">
                          <Zap size={12} /> PROCESSED
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center pl-1">
                          <Play size={16} fill="white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {message.type === 'button' && (
                    <div className="w-full">
                      <div className="mb-4 px-4 py-2.5 bg-purple-900/40 text-white border border-purple-500/20 rounded-2xl rounded-tl-none text-sm">
                        {message.content}
                      </div>
                      <motion.a
                        href={finalHref}
                        onClick={handleClick}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255, 0, 122, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] text-white font-bold text-base md:text-lg rounded-2xl overflow-hidden transition-all duration-300 shadow-lg shadow-[#FF007A]/30"
                      >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
                        <div className="relative z-10 flex items-center gap-3">
                          <Send className="w-5 h-5 rotate-45 flex-shrink-0" />
                          <span className="whitespace-nowrap">{global.ctaText}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </motion.a>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
