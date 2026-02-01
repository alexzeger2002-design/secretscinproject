import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { StatsResponse } from '../services/statsService';

interface StatsChartProps {
  stats: StatsResponse;
}

export function StatsChart({ stats }: StatsChartProps) {
  if (!stats) {
    return null;
  }

  // Создаем Map для быстрого поиска кликов по дате
  const clicksMap = new Map<string, number>();
  if (stats.clicksByDate && stats.clicksByDate.length > 0) {
    stats.clicksByDate.forEach((click) => {
      clicksMap.set(click.date, click.count);
    });
  }

  // Объединяем данные по датам
  let chartData = (stats.visitsByDate || []).map((visit) => {
    const clickCount = clicksMap.get(visit.date) || 0;
    return {
      date: format(new Date(visit.date), 'dd.MM'),
      visits: visit.count || 0,
      clicks: clickCount,
    };
  });

  // Если нет данных, создаем пустой график за последние 30 дней
  if (chartData.length === 0) {
    chartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      chartData.push({
        date: format(date, 'dd.MM'),
        visits: 0,
        clicks: 0,
      });
    }
  }

  return (
    <div className="bg-[#0F0F1A] border border-white/10 shadow-lg rounded-lg p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4">График визитов и кликов</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0F0F1A', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend wrapperStyle={{ color: '#94A3B8' }} />
          <Line 
            type="monotone" 
            dataKey="visits" 
            stroke="#FF007A" 
            name="Визиты" 
            strokeWidth={2}
            dot={{ fill: '#FF007A', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="clicks" 
            stroke="#00F0FF" 
            name="Клики" 
            strokeWidth={2}
            dot={{ fill: '#00F0FF', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
