import React from 'react';
import StokDokaService from '../../../../services/stokDokaService';
import EditStokSapiPage from '../../StokSapi/EditStokSapiPage';

const EditStokDokaPage = () => (
  <EditStokSapiPage service={StokDokaService} entityName="DOKA" backUrl="/rph/stok-doka" />
);

export default EditStokDokaPage;