'use client';

import { Protected } from '@/lib/auth';
import Sidebar from '@/components/shell/Sidebar';
import Header from '@/components/shell/Header';

export default function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Protected>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </Protected>
  );
}
