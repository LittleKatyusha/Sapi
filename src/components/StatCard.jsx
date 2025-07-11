import React from 'react';

const StatCard = ({ icon, title, value, change }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
    <div className="bg-red-100 p-3 rounded-full">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {change && <p className={`text-xs ${change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</p>}
    </div>
  </div>
);

export default StatCard;
