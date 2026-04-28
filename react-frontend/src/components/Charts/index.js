export { default as PieChart } from './PieChart'
export { default as LineChart } from './LineChart'
export { default as BarChart } from './BarChart'

// Chart configurations
export const chartColors = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

export const chartGradients = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  secondary: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
}

export const chartDefaults = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  animationDuration: 1000,
  animationEasing: 'ease-out',
}