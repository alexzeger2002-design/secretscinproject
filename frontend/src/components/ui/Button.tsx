import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function Button({ 
  children, 
  href, 
  onClick, 
  className = '', 
  variant = 'primary'
}: ButtonProps) {
  const baseClasses = 'group relative px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg md:text-xl overflow-hidden transition-all duration-300';
  
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-[#FF007A] to-[#7B2CBF] text-white'
    : 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20';

  const Component = href ? motion.a : motion.button;
  const props = href 
    ? { href, target: '_blank', rel: 'noopener noreferrer', onClick }
    : { onClick, type: 'button' as const };

  return (
    <Component
      {...props}
      whileHover={{ scale: 1.05, boxShadow: '0 0 40px -5px rgba(255, 0, 122, 0.5)' }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
      <span className="relative flex items-center justify-center gap-2 md:gap-3">
        {variant === 'primary' && <Send className="w-4 h-4 md:w-5 md:h-5 -rotate-45" />}
        {children}
      </span>
    </Component>
  );
}
