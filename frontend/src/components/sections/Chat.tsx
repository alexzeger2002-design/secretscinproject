import { useEffect, useState, useRef } from 'react';
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

// Компонент для видео с программным автозапуском (работает на мобильных)
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Функция для запуска видео
    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        // Если автозапуск заблокирован, показываем кнопку play
        setIsPlaying(false);
      }
    };

    // Пытаемся запустить видео сразу
    playVideo();

    // Используем Intersection Observer для запуска при появлении в viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPlaying) {
            playVideo();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(video);

    // Запускаем видео после первого взаимодействия пользователя (скролл, клик, тач)
    const userInteractionEvents = ['scroll', 'touchstart', 'click', 'mousedown'];
    const handleUserInteraction = () => {
      if (!isPlaying) {
        playVideo();
        // Удаляем обработчики после первого взаимодействия
        userInteractionEvents.forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      }
    };

    userInteractionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true, passive: true });
    });

    // Обработчик клика на само видео
    const handleVideoClick = () => {
      if (!isPlaying) {
        playVideo();
      }
    };

    video.addEventListener('click', handleVideoClick);

    return () => {
      observer.disconnect();
      video.removeEventListener('click', handleVideoClick);
      userInteractionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        loop
        muted
        playsInline
        style={{ maxHeight: '400px', display: 'block' }}
      />
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-20"
          onClick={() => videoRef.current?.play()}
        >
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center pl-1">
            <Play size={20} fill="white" />
          </div>
        </div>
      )}
    </div>
  );
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
                      <VideoPlayer src={videoChat} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3 pointer-events-none z-10">
                        <span className="text-xs font-mono text-[#00F0FF] flex items-center gap-1">
                          <Zap size={12} /> PROCESSED
                        </span>
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
