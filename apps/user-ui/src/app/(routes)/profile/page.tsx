'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import useRequireAuth from 'apps/user-ui/src/hooks/useRequiredAuth';
import QuickActionCard from 'apps/user-ui/src/shared/components/cards/quick-action.card';
import StatCard from 'apps/user-ui/src/shared/components/cards/stat.card';
import ChangePassword from 'apps/user-ui/src/shared/components/change-password/page';
import ShippingAddressSection from 'apps/user-ui/src/shared/components/ShippingAddress';
import OrdersTable from 'apps/user-ui/src/shared/components/tables/orders-table';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user, isLoading } = useRequireAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/get-user-orders`);
      return res.data.orders;
    },
  });
  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o: any) =>
      o?.deliveryStatus !== 'Delivered' && o?.deliveryStatus !== 'Cancelled'
  ).length;
  const completedOrders = orders.filter(
    (o: any) => o?.deliveryStatus === 'Delivered'
  ).length;

  const queryTab = searchParams.get('active') || 'Profile';
  const [activeTab, setActiveTab] = useState(queryTab);

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('active', activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const logOutHandler = async () => {
    await axiosInstance.get('/api/logout-user').then((res) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });

      router.push('/login');
    });
  };
  return (
    <div className="bg-gray-50 p-6 pb-14 ">
      <div className="md:max-w-7xl mx-auto">
        {/* Greeting */}
        <div className="text-center mb-10 ">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,
            <span className="text-blue-600">
              {isLoading ? (
                <Loader2 className="inline animate-spin size5" />
              ) : (
                `${user?.name || 'User'}`
              )}
            </span>{' '}
            👋
          </h1>
        </div>
        {/* Profile overview grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total orders" count={totalOrders} Icon={Clock} />
          <StatCard
            title="Processing Orders"
            count={processingOrders}
            Icon={Truck}
          />
          <StatCard
            title="Completed Orders"
            count={completedOrders}
            Icon={CheckCircle}
          />
        </div>
        {/* sidebar and content layout */}
        <div className="mt-10 flex flex-col md:flex-row gap-6">
          {/* Left Navigation */}
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 w-full  md:w-1/5">
            <nav className="space-y-2">
              <NavItem
                label="Profile"
                Icon={User}
                active={activeTab === 'Profile'}
                onClick={() => setActiveTab('Profile')}
              />
              <NavItem
                label="My Orders"
                Icon={ShoppingBag}
                active={activeTab === 'My Orders'}
                onClick={() => setActiveTab('My Orders')}
              />
              <NavItem
                label="Inbox"
                Icon={Inbox}
                active={activeTab === 'Inbox'}
                onClick={() => router.push('/inbox')}
              />
              <NavItem
                label="Notifications"
                Icon={Bell}
                active={activeTab === 'Notifications'}
                onClick={() => setActiveTab('Notifications')}
              />
              <NavItem
                label="Shipping Address"
                Icon={MapPin}
                active={activeTab === 'Shipping Address'}
                onClick={() => setActiveTab('Shipping Address')}
              />
              <NavItem
                label="Change Password"
                Icon={Lock}
                active={activeTab === 'Change Password'}
                onClick={() => setActiveTab('Change Password')}
              />
              <NavItem
                label="Logout"
                Icon={LogOut}
                danger
                onClick={() => logOutHandler()}
              />
            </nav>
          </div>
          {/* Main content */}
          <div className="bg-white p-6 rounded-md shadow-sm border border-gray-100 w-full md:w-[55%]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 ">
              {activeTab}
            </h2>
            {activeTab === 'Profile' && !isLoading && user ? (
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      user?.avatar ||
                      'https://ik.imagekit.io/fz0xzwtey/avatar/6_N7eMmuAvl.png?updatedAt=1742269698784'
                    }
                    alt="User avatar"
                    width={60}
                    height={60}
                    className="size-16 rounded-full border border-gray-200"
                  />
                  <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                    <Pencil className="w-4 h-4" /> Change Photo
                  </button>
                </div>
                <p>
                  <span className="font-semibold">Name:</span> {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold">Joined:</span>{' '}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Earned Points:</span>{' '}
                  {user.points || 0}
                </p>
              </div>
            ) : activeTab === 'Shipping Address' ? (
              <ShippingAddressSection />
            ) : activeTab === 'My Orders' ? (
              <OrdersTable />
            ) : activeTab === 'Change Password' ? (
              <ChangePassword />
            ) : (
              <></>
            )}
          </div>

          {/* Right quick panel */}
          <div className="w-full md:w-1/4  space-y-4">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements."
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage preferences and security."
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

const NavItem = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? 'bg-blue-100 text-blue-600'
        : danger
        ? 'text-red-500 hover:bg-red-50'
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
