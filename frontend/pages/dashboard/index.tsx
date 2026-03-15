'use client';

import React from 'react';
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DashboardOverview from "../../components/dashboard/DashboardOverview";

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard Overview">
      <DashboardOverview />
    </DashboardLayout>
  );
}
