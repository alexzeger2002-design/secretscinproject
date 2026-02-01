interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-lg shadow-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#94A3B8]">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#94A3B8] mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-[#FF007A] text-2xl">{icon}</div>}
      </div>
    </div>
  );
}
