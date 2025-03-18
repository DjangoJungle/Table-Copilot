'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import RepositoryContent from '../components/RepositoryContent';

export default function RepositoryPage() {
  return (
    <Layout activeTab="repository">
      <RepositoryContent />
    </Layout>
  );
} 