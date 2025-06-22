'use client';

import { useSettings } from '../hooks/useSettings';

const SettingsTest = () => {
  const { settings, isLoading, getEnabledPaymentMethods, isPaymentMethodEnabled } = useSettings();

  if (isLoading) {
    return <div className="p-4 bg-gray-100 rounded">Loading settings...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h3 className="font-bold mb-2">🔧 Settings Debug Info</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <h4 className="font-semibold">Payment Methods:</h4>
          <ul>
            <li>COD: {isPaymentMethodEnabled('cod') ? '✅' : '❌'}</li>
            <li>MoMo: {isPaymentMethodEnabled('momo') ? '✅' : '❌'}</li>
            <li>Stripe: {isPaymentMethodEnabled('stripe') ? '✅' : '❌'}</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold">Enabled Methods:</h4>
          <p>{getEnabledPaymentMethods().join(', ') || 'None'}</p>
        </div>
        
        <div>
          <h4 className="font-semibold">Other Settings:</h4>
          <ul>
            <li>Discord: {settings.discordNotifications ? '✅' : '❌'}</li>
            <li>Reports: {settings.dailyReports ? '✅' : '❌'}</li>
            <li>Session: {settings.sessionTimeout}min</li>
          </ul>
        </div>
      </div>
      
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-gray-600">View Raw Settings</summary>
        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default SettingsTest;
