import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import contentData from '../../data/content.json';
import video1 from '../../pages/12.mp4';
import video2 from '../../pages/14.mp4';

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
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
      />
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
          onClick={() => videoRef.current?.play()}
        >
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center pl-2">
            <Play size={24} fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}

export function Showcase() {
  const { showcase } = contentData;
  const videos = [video1, video2];

  return (
    <section className="relative z-10 py-12 md:py-20 px-4">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 text-white"
      >
        {showcase.title}
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
        {showcase.cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255, 0, 122, 0.3)' }}
            className="relative overflow-hidden rounded-2xl bg-black group cursor-pointer"
            style={{ aspectRatio: '9/16', maxWidth: '100%' }}
          >
            <VideoPlayer src={videos[index]} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
