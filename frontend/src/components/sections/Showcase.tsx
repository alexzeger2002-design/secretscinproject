import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import contentData from '../../data/content.json';
import video1 from '../../pages/12.mp4';
import video2 from '../../pages/14.mp4';

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
            <video
              src={videos[index]}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              autoPlay
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center pl-2 group-hover:scale-110 transition-transform">
                <Play size={24} fill="white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
