import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { chartColors, chartDefaults } from './index'

const RADIAN = Math.PI / 180

// Custom label with better positioning
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
  // Don't show label if percentage is too small
  if (percent < 0.05) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.7; // Position labels further out
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      className="text-[10px] md:text-xs font-bold drop-shadow-lg"
      style={{ 
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-xs md:text-sm font-medium" style={{ color: data.color }}>
          {data.name}
        </p>
        <p className="text-sm md:text-base font-bold" style={{ color: data.color }}>
          ${data.value.toFixed(2)}
        </p>
        <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-1">
          {((data.value / data.total) * 100).toFixed(1)}% of total
        </p>
      </div>
    )
  }
  return null
}

export default function PieChartComponent({ data = [] }) {
  // If no data or empty array, show placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] md:h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No category data available</p>
      </div>
    )
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Add total to each data item for tooltip
  const dataWithTotal = data.map(item => ({
    ...item,
    total
  }));

  // Sort data by value (largest first) for better legend display
  const sortedData = [...dataWithTotal].sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          {sortedData.map((entry, index) => (
            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={entry.color || chartColors.primary} stopOpacity={0.9} />
              <stop offset="100%" stopColor={entry.color || chartColors.primary} stopOpacity={0.6} />
            </linearGradient>
          ))}
        </defs>
        
        <Pie
          data={sortedData}
          cx="45%"  // Adjusted to give more space for legend
          cy="45%"  // Moved up slightly
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={75}  // Reduced from 90
          innerRadius={30}  // Keep donut effect
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          animationDuration={chartDefaults.animationDuration}
          animationEasing={chartDefaults.animationEasing}
          paddingAngle={2}
        >
          {sortedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`url(#gradient-${index})`}
              stroke={entry.color || chartColors.primary}
              strokeWidth={1}
            />
          ))}
        </Pie>
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend 
          layout="vertical" 
          align="right"
          verticalAlign="middle"
          wrapperStyle={{
            paddingLeft: '5px',
            fontSize: '10px',
            lineHeight: '1.4',
            maxHeight: '200px',
            overflowY: 'auto',
            width: '40%',
            right: 0,
          }}
          formatter={(value, entry) => {
            const item = entry.payload;
            if (!item) return value;
            
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <span className="text-[10px] md:text-xs text-gray-700 dark:text-gray-300 block">
                <span className="font-medium">{value}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  ${item.value?.toFixed(0)} ({percentage}%)
                </span>
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}