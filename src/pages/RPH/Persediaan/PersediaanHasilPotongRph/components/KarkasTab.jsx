import React from 'react';
import PersediaanTab from './PersediaanTab';

const KarkasTab = ({ onRefresh, onOpenDetail, onOpenEdit, onOpenDelete }) => {
  return (
    <PersediaanTab
      type="karkas"
      onRefresh={onRefresh}
      onOpenDetail={onOpenDetail}
      onOpenEdit={onOpenEdit}
      onOpenDelete={onOpenDelete}
    />
  );
};

export default KarkasTab;