'use client';

import React from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import InvoiceManagement from '../../../components/dashboard/InvoiceManagement';

export default function InvoicesPage() {
  return (
    <DashboardLayout title="Invoice Management">
      <InvoiceManagement />
    </DashboardLayout>
  );
}
