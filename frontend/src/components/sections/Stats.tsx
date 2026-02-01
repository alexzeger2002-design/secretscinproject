import { motion } from 'framer-motion';
import contentData from '../../data/content.json';

export function Stats() {
  const { stats } = contentData;

  return (
    <section className="relative z-10 pt-12 pb-4 md:pt-20 md:pb-6 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <div className="text-5xl md:text-7xl lg:text-8xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#FF007A] to-[#00F0FF] mb-2">
            {stats.mainCount}
          </div>
          <div className="text-lg md:text-xl lg:text-2xl text-[#94A3B8] mb-6">
            {stats.mainLabel}
          </div>
          <div className="text-sm md:text-base text-[#00F0FF] font-bold tracking-wider uppercase">
            {stats.subStat}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
