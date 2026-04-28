import { HiOutlineTrendingUp, HiOutlineExclamationCircle } from 'react-icons/hi'

export default function BudgetCard({ budget }) {
  const { amount, spent, percentage, warning, has_budget } = budget
  
  const remaining = amount - spent
  const progressColor = percentage >= 100 
    ? 'error' 
    : percentage >= 80 
      ? 'warning' 
      : 'success'
  
  const statusIcon = {
    error: '🔥',
    warning: '⚠️',
    success: '🎯'
  }

  return (
    <div className="relative group">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
      
      <div className="relative bg-base-100 rounded-3xl shadow-xl p-6 border border-base-200/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Monthly Budget
              <span className="text-xs px-2 py-1 rounded-full bg-base-200 text-base-content/70">
                {new Date().toLocaleString('default', { month: 'long' })}
              </span>
            </h3>
            <p className="text-sm text-base-content/40 mt-1">Track your monthly spending</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl bg-${progressColor}/10 flex items-center justify-center`}>
            <span className="text-2xl">{statusIcon[progressColor]}</span>
          </div>
        </div>

        {/* Amount display */}
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-4xl font-bold">${spent.toFixed(2)}</span>
            <span className="text-base-content/40 text-lg ml-2">/ ${amount.toFixed(2)}</span>
          </div>
          <div className={`badge badge-${progressColor} badge-lg gap-2`}>
            <HiOutlineTrendingUp />
            {percentage.toFixed(1)}%
          </div>
        </div>

        {/* Progress bar with animation */}
        <div className="relative h-4 bg-base-200 rounded-full overflow-hidden mb-4">
          <div 
            className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${progressColor} to-${progressColor}/80 rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-base-200/50 rounded-xl p-4">
            <p className="text-sm text-base-content/40 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${remaining < 0 ? 'text-error' : 'text-success'}`}>
              ${Math.abs(remaining).toFixed(2)}
              {remaining < 0 && ' overspent'}
            </p>
          </div>
          <div className="bg-base-200/50 rounded-xl p-4">
            <p className="text-sm text-base-content/40 mb-1">Daily average</p>
            <p className="text-xl font-bold">${(spent / new Date().getDate()).toFixed(2)}</p>
          </div>
        </div>

        {/* Warning message */}
        {warning && (
          <div className={`mt-4 p-4 rounded-xl bg-${progressColor}/10 border border-${progressColor}/20 flex items-start gap-3`}>
            <HiOutlineExclamationCircle className={`text-${progressColor} text-xl flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-medium text-${progressColor}`}>
                {percentage >= 100 
                  ? 'Budget exceeded!' 
                  : 'Approaching budget limit'}
              </p>
              <p className="text-sm text-base-content/60 mt-1">
                {percentage >= 100
                  ? `You've overspent by $${Math.abs(remaining).toFixed(2)}`
                  : `You have $${remaining.toFixed(2)} left for the remaining ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} days`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}