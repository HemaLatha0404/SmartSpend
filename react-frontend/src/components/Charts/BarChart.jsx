import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { chartDefaults } from './index'

export default function BarChartComponent({ 
  data = [], 
  xKey = 'name', 
  yKey = 'amount', 
  color = '#3b82f6' 
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No data available</p>
      </div>
    )
  }

  const determineYKey = () => {
    if (data.length > 0) {
      const firstItem = data[0];
      if (firstItem.amount !== undefined) return 'amount';
      if (firstItem.value !== undefined) return 'value';
      if (firstItem.total !== undefined) return 'total';
    }
    return yKey;
  }

  const actualYKey = determineYKey();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={chartDefaults.margin}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis 
          dataKey={xKey} 
          className="text-xs text-gray-600 dark:text-gray-400"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs text-gray-600 dark:text-gray-400"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          formatter={(value) => [`$${value?.toFixed(2) || '0.00'}`, 'Amount']}
          labelFormatter={(label) => `Date: ${label}`}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '0.5rem'
          }}
        />
        <Legend />
        <Bar 
          dataKey={actualYKey} 
          name="Spending"
          fill={color}
          radius={[4, 4, 0, 0]}
          animationDuration={chartDefaults.animationDuration}
          animationEasing={chartDefaults.animationEasing}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}