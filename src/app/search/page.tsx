'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import SearchContent from '../components/SearchContent';

export default function SearchPage() {
  return (
    <Layout activeTab="search">
      <SearchContent />
    </Layout>
  );
} 