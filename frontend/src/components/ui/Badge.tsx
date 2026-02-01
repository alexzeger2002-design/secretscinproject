import { motion } from 'framer-motion';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`px-4 py-1.5 rounded-full border border-[#FF007A]/30 bg-[#FF007A]/10 backdrop-blur-md ${className}`}
    >
      <span className="text-xs font-bold tracking-[0.2em] text-[#FF007A] uppercase">
        {children}
      </span>
    </motion.div>
  );
}
