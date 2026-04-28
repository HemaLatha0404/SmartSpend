import api from './api'

export const getBudget = (month, year) =>
  api.get('/budget/', { params: { month, year } }).then(res => res.data)

export const setBudget = (data) =>
  api.post('/budget/', data).then(res => res.data)

export const getBudgetStatus = () =>
  api.get('/budget/status').then(res => res.data)