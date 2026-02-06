import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useLanding } from '../../contexts/LandingContext';
import contentData from '../../data/content.json';

export function Hero() {
  const { hero, global } = contentData;
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

  // Используем ссылку из контекста, если она загружена, иначе не показываем кнопку
  const finalHref = landingContext?.redirectUrl || null;

  return (
    <section className="relative z-10 flex flex-col items-center justify-center px-4 text-center py-8">
      {/* Background FX */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Badge */}
      <Badge className="mb-6">
        {hero.badge}
      </Badge>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-6xl lg:text-8xl font-extrabold tracking-tighter leading-none mb-4 md:mb-6"
      >
        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
          {global.appName}
        </span>
        <br />
        <span className="text-2xl md:text-4xl lg:text-5xl font-light text-gray-300 tracking-normal block mt-2">
          {hero.title.main} <span className="text-[#00F0FF] drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{hero.title.sub}</span>
        </span>
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-2xl text-base md:text-lg lg:text-xl text-[#94A3B8] mb-8 md:mb-10 leading-relaxed px-4"
      >
        {hero.description}
      </motion.p>

      {/* CTA Button - показываем только когда ссылка загружена */}
      {finalHref && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.a
            href={finalHref}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255, 0, 122, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="group relative w-full max-w-sm flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] text-white font-bold text-base md:text-lg rounded-2xl overflow-hidden transition-all duration-300 shadow-lg shadow-[#FF007A]/30"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
            <div className="relative z-10 flex items-center gap-3">
              <Send className="w-5 h-5 rotate-45 flex-shrink-0" />
              <span className="whitespace-nowrap">Начать прямо сейчас</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.a>
        </motion.div>
      )}

      {/* Sub CTA */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-1 mb-0 text-sm md:text-base text-[#FF007A]/60 animate-pulse"
      >
        {hero.subCta}
      </motion.p>
    </section>
  );
}
