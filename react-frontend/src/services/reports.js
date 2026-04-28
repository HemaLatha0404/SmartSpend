import api from './api'

export const getSpendingByCategory = (year, month) =>
  api.get('/reports/spending-by-category', { params: { year, month } }).then(res => res.data)

export const getSpendingOverTime = (interval, startDate, endDate) =>
  api.get('/reports/spending-over-time', { params: { interval, start_date: startDate, end_date: endDate } }).then(res => res.data)

export const getSummary = () =>
  api.get('/reports/summary').then(res => res.data)

export const exportReport = (format, data) => {
  // This can be used if you want backend to generate reports
  return api.post('/reports/export', { format, data }, { responseType: 'blob' })
}