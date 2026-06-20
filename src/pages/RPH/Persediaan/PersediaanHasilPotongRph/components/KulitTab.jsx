import React from 'react';
import PersediaanTab from './PersediaanTab';

const KulitTab = ({ onRefresh, onOpenDetail, onOpenEdit, onOpenDelete }) => {
  return (
    <PersediaanTab
      type="kulit"
      onRefresh={onRefresh}
      onOpenDetail={onOpenDetail}
      onOpenEdit={onOpenEdit}
      onOpenDelete={onOpenDelete}
    />
  );
};

export default KulitTab;