import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { chartColors, chartDefaults } from './index'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          ${payload[0]?.value?.toFixed(2) || '0.00'}
        </p>
      </div>
    )
  }
  return null
}

export default function LineChartComponent({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No spending data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={chartDefaults.margin}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={chartColors.primary} />
            <stop offset="100%" stopColor={chartColors.secondary} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        
        <XAxis 
          dataKey="name" 
          className="text-xs text-gray-600 dark:text-gray-400"
          tick={{ fill: 'currentColor' }}
        />
        
        <YAxis 
          className="text-xs text-gray-600 dark:text-gray-400"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `$${value}`}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend 
          wrapperStyle={{ 
            paddingTop: '20px',
            color: 'var(--text-color)'
          }} 
        />
        
        <Line
          type="monotone"
          dataKey="amount"
          name="Spending"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={{ 
            fill: chartColors.primary, 
            strokeWidth: 2, 
            r: 4,
            stroke: '#fff'
          }}
          activeDot={{ 
            r: 8, 
            fill: chartColors.secondary,
            stroke: '#fff',
            strokeWidth: 2
          }}
          animationDuration={chartDefaults.animationDuration}
          animationEasing={chartDefaults.animationEasing}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}