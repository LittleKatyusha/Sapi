import React from 'react';
import { Outlet } from 'react-router-dom';

const BoningLayout = () => {

  return (
    <div className="space-y-6">
      {/* Content Area */}
      <Outlet />
    </div>
  );
};

export default BoningLayout;
