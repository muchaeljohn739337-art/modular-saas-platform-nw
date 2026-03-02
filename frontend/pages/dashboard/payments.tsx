'use client';

import React from 'react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import PaymentProcessing from '../../../components/dashboard/PaymentProcessing';

export default function PaymentsPage() {
  return (
    <DashboardLayout title="Payment Processing">
      <PaymentProcessing />
    </DashboardLayout>
  );
}
