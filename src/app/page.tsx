"use client";
import React from "react";
import Layout from './components/Layout';
import RepositoryContent from './components/RepositoryContent';

export default function Home() {
  return (
    <Layout activeTab="repository">
      <RepositoryContent />
    </Layout>
  );
}
