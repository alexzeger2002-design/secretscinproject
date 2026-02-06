import { motion } from 'framer-motion';
import { useLanding } from '../../contexts/LandingContext';
import contentData from '../../data/content.json';

export function FinalCTA() {
  const { global } = contentData;
  
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
    <section className="relative z-10 -mt-4 pt-6 pb-20 md:pt-8 md:pb-32 px-4 min-h-[60vh] flex items-center justify-center">
      <div className="relative z-10 text-center max-w-2xl mx-auto w-full">
        {/* PULSE - сзади заголовка */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mb-6 md:mb-8"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full z-0">
            <div className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white/5 select-none text-center leading-none">
              PULSE
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white relative z-10">
            Хватит просто смотреть.
            <br />
            Начни управлять.
          </h2>
        </motion.div>

        {/* Кнопка - показываем только когда ссылка загружена */}
        {finalHref && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mb-6 md:mb-8 flex justify-center"
          >
            <motion.a
              href={finalHref}
              onClick={handleClick}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(255, 0, 122, 0.6)' }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center justify-center px-10 py-6 md:py-7 bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] text-white font-bold text-lg md:text-xl rounded-2xl overflow-hidden transition-all duration-300 shadow-2xl shadow-[#FF007A]/40"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
              <span className="relative z-10 text-center leading-tight">Присоединяйся к миру<br />бесконечного наслаждения</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.a>
          </motion.div>
        )}

        {/* ROOM - сзади disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full z-0">
            <div className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white/5 select-none text-center leading-none">
              ROOM
            </div>
          </div>
          <p className="text-xs md:text-sm text-[#94A3B8] relative z-10">
            {global.disclaimer}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
