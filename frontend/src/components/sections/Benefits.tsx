import { motion } from 'framer-motion';
import { Zap, Shield, Eye, MessageCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import contentData from '../../data/content.json';

const icons = [Zap, Eye, Shield, MessageCircle];

export function Benefits() {
  const { benefits } = contentData;

  return (
    <section className="relative z-10 py-12 md:py-20 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {benefits.map((benefit, index) => {
          const Icon = icons[index];
          return (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6 md:p-8 hover:border-[#FF007A]/30 transition-colors">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FF007A] to-[#7B2CBF] flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm md:text-base text-[#94A3B8]">
                    {benefit.desc}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
