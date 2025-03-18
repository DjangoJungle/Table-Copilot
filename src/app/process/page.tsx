'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import ProcessContent from '../components/ProcessContent';

export default function ProcessPage() {
  return (
    <Layout activeTab="process">
      <ProcessContent />
    </Layout>
  );
} 