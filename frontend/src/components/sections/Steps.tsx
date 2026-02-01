import { motion } from 'framer-motion';
import contentData from '../../data/content.json';

export function Steps() {
  const { steps } = contentData;

  return (
    <section className="relative z-10 pt-4 pb-8 md:pt-6 md:pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative" style={{ height: '280px' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative" style={{ height: '100%' }}>
            {steps.map((step, index) => {
              // Градиенты для кружков, соответствующие позиции на линии
              const gradients = [
                'bg-gradient-to-br from-[#FF007A] to-[#7B2CBF]', // Первый - розовый к фиолетовому
                'bg-gradient-to-br from-[#7B2CBF] to-[#7B2CBF]', // Второй - фиолетовый
                'bg-gradient-to-br from-[#7B2CBF] to-[#00F0FF]'  // Третий - фиолетовый к голубому
              ];
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative flex flex-col items-center"
                  style={{ height: '100%' }}
                >
                  {/* Spacer для выравнивания кружка на линии */}
                  <div style={{ flex: '1 1 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Step Number - точно на линии */}
                    <div 
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${gradients[index]} flex items-center justify-center text-white font-bold text-lg md:text-2xl shadow-lg shadow-[#FF007A]/30 relative z-10`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Step Text - просто под кружком */}
                  <div className="flex-1 flex items-start justify-center pt-2 md:pt-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-bold text-white text-center">
                      {step}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
