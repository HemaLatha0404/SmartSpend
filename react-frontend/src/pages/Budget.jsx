import { useState, useEffect } from 'react'
import { getBudget, setBudget, getBudgetStatus } from '../services/budget'
import { getExpenses } from '../services/expenses'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '../components/LoadingSpinner'
import BudgetCard from '../components/BudgetCard'
import { 
  HiOutlineCash, 
  HiOutlineCalendar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineExclamationCircle,
  HiOutlineChartBar,
  HiOutlineSave,
  HiOutlineRefresh,
  HiOutlineBell,
  HiOutlineCurrencyDollar,
  HiOutlineChartPie,
  HiOutlineSparkles
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { LineChart, BarChart, PieChart } from '../components/Charts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export default function BudgetPage() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [budgetData, setBudgetData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [showAlert, setShowAlert] = useState(false)
  const [predictedSpending, setPredictedSpending] = useState(null)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchBudgetData()
  }, [month, year])

  const fetchBudgetData = async () => {
    setLoading(true)
    try {
      console.log('Fetching budget data for:', { month, year })
      
      const [budget, status, expensesResponse] = await Promise.all([
        getBudget(month, year).catch(err => {
          console.error('Error fetching budget:', err)
          return { amount: 0 }
        }),
        getBudgetStatus().catch(err => {
          console.error('Error fetching budget status:', err)
          return null
        }),
        getExpenses({ 
          start_date: `${year}-${month.toString().padStart(2,'0')}-01`,
          end_date: `${year}-${month.toString().padStart(2,'0')}-${new Date(year, month, 0).getDate()}`,
          per_page: 1000
        }).catch(err => {
          console.error('Error fetching expenses:', err)
          return { items: [] }
        })
      ])

      console.log('Budget data received:', { budget, status })
      console.log('Expenses received:', expensesResponse.items?.length)

      setBudgetData(status)
      reset({ amount: budget.amount || '' })
      
      const expenses = expensesResponse.items || []
      
      // Process daily expenses
      const daily = processDailyExpenses(expenses, year, month)
      setDailyExpenses(daily)
      
      // Process category breakdown
      const categories = processCategoryBreakdown(expenses)
      setCategoryBreakdown(categories)
      
      // Calculate predicted spending
      if (expenses.length > 0) {
        const prediction = calculatePredictedSpending(expenses, status)
        setPredictedSpending(prediction)
      }
      
      // Check if we should show alert
      if (status?.has_budget && status?.percentage >= 80) {
        setShowAlert(true)
      } else {
        setShowAlert(false)
      }
      
    } catch (error) {
      console.error('Failed to load budget data:', error)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const processDailyExpenses = (expenses, year, month) => {
    // Get all days in the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate })
    
    // Create a map of expense amounts by day
    const dailyMap = {}
    expenses.forEach(exp => {
      const expDate = new Date(exp.date)
      const day = expDate.getDate()
      if (!dailyMap[day]) {
        dailyMap[day] = 0
      }
      dailyMap[day] += parseFloat(exp.amount || 0)
    })
    
    // Create array for all days
    return daysInMonth.map(date => ({
      name: format(date, 'd'),
      amount: dailyMap[date.getDate()] || 0,
      fullDate: format(date, 'MMM d')
    }))
  }

  const processCategoryBreakdown = (expenses) => {
    const categories = {}
    expenses.forEach(exp => {
      const catName = exp.category_name || 'Uncategorized'
      if (!categories[catName]) {
        categories[catName] = 0
      }
      categories[catName] += parseFloat(exp.amount || 0)
    })
    
    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name)
      }))
      .sort((a, b) => b.value - a.value)
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#3b82f6',
      'Entertainment': '#8b5cf6',
      'Education': '#10b981',
      'Transport': '#f59e0b',
      'Utilities': '#ef4444',
      'Shopping': '#ec4899',
      'Health': '#14b8a6',
      'Other': '#6b7280'
    }
    return colors[category] || '#6b7280'
  }

  const calculatePredictedSpending = (expenses, status) => {
    if (!expenses.length || !status?.has_budget) return null
    
    const today = new Date()
    const currentDay = today.getDate()
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysPassed = currentDay
    
    const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    const averagePerDay = totalSpent / daysPassed
    const predictedTotal = averagePerDay * daysInMonth
    
    return {
      averagePerDay,
      predictedTotal,
      willExceed: predictedTotal > status.amount,
      remainingDays: daysInMonth - daysPassed,
      recommendedDaily: (status.amount - totalSpent) / (daysInMonth - daysPassed)
    }
  }

  const getDaysRemaining = () => {
    const lastDay = new Date(year, month, 0).getDate()
    const today = new Date().getDate()
    return lastDay - today
  }

  const getDailyAverage = () => {
    if (!budgetData?.has_budget) return 0
    const daysLeft = getDaysRemaining()
    const remaining = budgetData.amount - budgetData.spent
    return daysLeft > 0 ? remaining / daysLeft : 0
  }

  const onSubmit = async (data) => {
    try {
      await setBudget({ month, year, amount: parseFloat(data.amount) })
      toast.success('Budget saved successfully!')
      fetchBudgetData()
    } catch (error) {
      console.error('Failed to save budget:', error)
      toast.error('Failed to save budget')
    }
  }

  if (loading) return <LoadingSpinner />

  const daysRemaining = getDaysRemaining()
  const dailyAverage = getDailyAverage()
  const totalSpent = categoryBreakdown.reduce((sum, cat) => sum + cat.value, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Monthly Budget
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
              Plan and track your spending
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button 
              onClick={fetchBudgetData}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              <HiOutlineRefresh className="text-lg md:text-xl" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <select 
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select 
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m-1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alert */}
        {showAlert && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <HiOutlineExclamationCircle className="text-2xl text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-yellow-800 dark:text-yellow-200">Budget Alert!</span>
              <span className="text-sm text-yellow-700 dark:text-yellow-300 ml-2">
                You've used {budgetData?.percentage?.toFixed(1)}% of your monthly budget.
                {budgetData?.percentage >= 100 
                  ? ' You have exceeded your budget.' 
                  : ` You have $${(budgetData?.amount - budgetData?.spent).toFixed(2)} remaining.`}
              </span>
            </div>
            <button 
              className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 rounded-lg transition-colors"
              onClick={() => setShowAlert(false)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Budget Card */}
        {budgetData?.has_budget ? (
          <BudgetCard budget={budgetData} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">No budget set for {new Date(year, month-1).toLocaleString('default', { month: 'long' })} {year}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Set a monthly budget to track your spending and achieve your financial goals
            </p>
          </div>
        )}

        {/* Budget Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-6">
            {budgetData?.has_budget ? 'Update Budget' : 'Set Monthly Budget'}
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget Amount ($)</label>
                <div className="relative">
                  <HiOutlineCash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                    {...register('amount', { 
                      required: 'Budget amount is required',
                      min: { value: 1, message: 'Amount must be greater than 0' }
                    })}
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                <div className="relative">
                  <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                    value={`${new Date(year, month-1).toLocaleString('default', { month: 'long' })} ${year}`}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 flex items-center gap-2">
                <HiOutlineSave className="text-lg" />
                {budgetData?.has_budget ? 'Update Budget' : 'Set Budget'}
              </button>
            </div>
          </form>
        </div>

        {/* Insights */}
        {budgetData?.has_budget && (
          <>
            {/* Prediction Cards */}
            {predictedSpending && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Daily Average</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ${predictedSpending.averagePerDay.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Predicted Total</p>
                  <p className={`text-xl font-bold ${predictedSpending.willExceed ? 'text-red-600' : 'text-green-600'}`}>
                    ${predictedSpending.predictedTotal.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Recommended Daily</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${predictedSpending.recommendedDaily.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Daily Spending Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-base md:text-lg font-semibold mb-4">Daily Spending</h3>
              {dailyExpenses.length > 0 ? (
                <div className="h-[300px]">
                  <BarChart data={dailyExpenses} xKey="name" yKey="amount" color="#3b82f6" />
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No expenses recorded this month
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
              <h3 className="text-base md:text-lg font-semibold mb-4">Spending by Category</h3>
              {categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {categoryBreakdown.map((cat, index) => {
                    const percentage = ((cat.value / budgetData.amount) * 100).toFixed(1)
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{cat.name}</span>
                          <div className="text-right">
                            <span className="font-medium">${cat.value.toFixed(2)}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                              ({percentage}% of budget)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No categories yet
                </div>
              )}
            </div>

            {/* Category Pie Chart (Optional) */}
            {categoryBreakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-base md:text-lg font-semibold mb-4">Category Distribution</h3>
                <div className="h-[300px]">
                  <PieChart data={categoryBreakdown} />
                </div>
              </div>
            )}
          </>
        )}

        {/* Budget Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <HiOutlineSparkles className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Budgeting Tips:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
                <li>• Review your budget weekly to stay on track</li>
                <li>• Set aside money for irregular expenses</li>
                <li>• Adjust your budget based on spending patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}