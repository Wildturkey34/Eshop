'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import dynamic from 'next/dynamic';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';

const GeographicalMap = dynamic(
  () => import('apps/seller-ui/src/shared/components/charts/geographicalMap'),
  { ssr: false, loading: () => <div className="w-full h-[35vh] bg-slate-800 animate-pulse rounded-lg" /> }
);

const SalesChart = dynamic(
  () => import('apps/seller-ui/src/shared/components/charts/sales.chart').then((mod) => mod.SalesChart),
  { ssr: false, loading: () => <div className="w-full h-[425px] bg-slate-800 animate-pulse rounded-lg" /> }
);

const COLORS = ['#4ade80', '#facc15', '#60a5fa'];

const columns = [
  {
    accessorKey: 'id',
    header: 'Order ID',
    cell: ({ getValue }: any) => <span className="font-mono text-xs">{String(getValue()).slice(-8)}</span>,
  },
  { accessorKey: 'total', header: 'Amount', cell: ({ getValue }: any) => `Rs.${getValue()}` },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }: any) => {
      const value = getValue();
      const color = value === 'Paid' ? 'text-green-400' : value === 'Pending' ? 'text-yellow-400' : 'text-red-400';
      return <span className={`font-medium ${color}`}>{value}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ getValue }: any) => new Date(getValue()).toLocaleDateString(),
  },
];

const OrdersTable = ({ data }: { data: any[] }) => {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className="mt-6">
      <h2 className="text-white text-xl font-semibold mb-4">
        Recent Orders
        <span className="block text-sm text-slate-400 font-normal">A quick snapshot of your latest transactions.</span>
      </h2>
      <div className="!rounded shadow-xl overflow-hidden border border-slate-700">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-slate-900 text-slate-300">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="p-3 text-left">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-transparent">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-600 hover:bg-slate-800 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['seller-dashboard-stats'],
    queryFn: async () => {
      const res = await axiosInstance.get('/seller/api/dashboard-stats');
      return res.data.stats;
    },
    staleTime: 1000 * 60 * 5,
  });

  const deviceData = data?.deviceData ?? [
    { name: 'Phone', value: 0 },
    { name: 'Tablet', value: 0 },
    { name: 'Computer', value: 0 },
  ];

  return (
    <div className="p-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Total Orders</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-slate-700 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-white text-3xl font-bold mt-1">{data?.totalOrders ?? 0}</p>
          )}
        </div>
        <div className="bg-slate-800 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Total Revenue</p>
          {isLoading ? (
            <div className="h-8 w-28 bg-slate-700 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-white text-3xl font-bold mt-1">Rs.{data?.totalRevenue?.toFixed(0) ?? 0}</p>
          )}
        </div>
      </div>

      {/* Top Charts */}
      <div className="w-full flex gap-8">
        <div className="w-[65%]">
          <div className="rounded-2xl shadow-xl">
            <h2 className="text-white text-xl font-semibold">
              Revenue
              <span className="block text-sm text-slate-400 font-normal">Last 6 months performance</span>
            </h2>
            <SalesChart ordersData={data?.monthlyRevenue} />
          </div>
        </div>

        <div className="w-[35%] rounded-2xl shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-2">
            Device Usage
            <span className="block text-sm text-slate-400 font-normal">How visitors visit your shop</span>
          </h2>
          <div className="mt-14">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                  isAnimationActive
                >
                  {deviceData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-white text-sm ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geo Map + Orders */}
      <div className="w-full flex gap-8">
        <div className="w-[60%]">
          <h2 className="text-white text-xl font-semibold mt-6">
            Visitors Distribution
            <span className="block text-sm text-slate-400 font-normal">Visual breakdown of global visitors activity.</span>
          </h2>
          <GeographicalMap countryData={data?.countryData ?? []} />
        </div>
        <div className="w-[40%]">
          <OrdersTable data={data?.recentOrders ?? []} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
