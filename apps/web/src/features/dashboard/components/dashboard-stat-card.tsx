"use client";

import { motion } from 'framer-motion';

export function DashboardStatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  theme,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border transition-colors duration-300 ${theme === 'dark'
        ? 'bg-gray-900/50 border-gray-800'
        : 'bg-white border-gray-200 shadow-lg'
        }`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'
          }`}>
          <Icon size={24} />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up'
            ? 'bg-green-500/10 text-green-500'
            : trend === 'down'
              ? 'bg-red-500/10 text-red-500'
              : 'bg-gray-500/10 text-gray-500'
            }`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>{title}</h3>
        <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{value}</p>
      </div>
    </motion.div>
  );
}
