import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow ${
      onClick ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </div>
)

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow'
  trend?: number
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'blue', trend }) => (
  <Card className={`${colorClasses[color]}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {trend !== undefined && (
          <p className={`text-sm mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </p>
        )}
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
  </Card>
)
