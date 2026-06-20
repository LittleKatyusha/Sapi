import React from 'react';
import PersediaanTab from './PersediaanTab';

const BoningTab = ({ onRefresh, onOpenDetail, onOpenEdit, onOpenDelete }) => {
  return (
    <PersediaanTab
      type="boning"
      onRefresh={onRefresh}
      onOpenDetail={onOpenDetail}
      onOpenEdit={onOpenEdit}
      onOpenDelete={onOpenDelete}
    />
  );
};

export default BoningTab;