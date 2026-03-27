import RiskMeter from "./RiskMeter";
import { Badge } from "./index";

export default function AnomalyCard({ anomaly }) {
  const isStatistical = anomaly.anomaly_reason.includes('sigma');
  const isDuplicate = anomaly.anomaly_reason.includes('Duplicate');
  
  return (
    <div className={`p-4 rounded-lg border ${
      isStatistical ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 
      isDuplicate ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800' : 
      'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Badge variant={isStatistical ? 'danger' : isDuplicate ? 'warning' : 'info'}>
            {isStatistical ? '📊 Statistical' : isDuplicate ? '📋 Duplicate' : '✓ Logical'}
          </Badge>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{anomaly.description}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{anomaly.anomaly_reason}</p>
          
          {anomaly.severity && (
            <RiskMeter
              score={anomaly.severity.score}
              label={anomaly.severity.label}
            />
          )}
          
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{anomaly.date}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-red-600">₹{anomaly.amount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
