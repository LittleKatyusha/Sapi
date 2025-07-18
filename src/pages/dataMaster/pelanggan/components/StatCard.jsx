import React from 'react';

const StatCard = ({ title, value, icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500 text-white',
        green: 'bg-green-500 text-white',
        red: 'bg-red-500 text-white',
        yellow: 'bg-yellow-500 text-white',
        purple: 'bg-purple-500 text-white',
        gray: 'bg-gray-500 text-white'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;