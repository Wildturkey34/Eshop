'use client';
import useSeller from 'apps/seller-ui/src/hooks/useSeller';
import useSidebar from 'apps/seller-ui/src/hooks/useSidebar';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Box from '../box';
import { Sidebar } from './sidebar.styles';
import Link from 'next/link';
import { Home, LayoutDashboard, ListOrdered } from 'lucide-react';
import SidebarItem from './sidebar.item';
import SidebarMenu from './sidebar.menu';
import Payment from '../icons/payment';

const SideBarWrapper = () => {
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();
  const { seller } = useSeller();

  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  const getIconColor = (route: string) =>
    activeSidebar === route ? '#0085ff' : '#969696';
  return (
    <Box
      css={{
        height: '100vh',
        zIndex: 202,
        position: 'sticky',
        padding: '8px',
        top: '0',
        overflowY: 'scroll',
        scrollbarWidth: 'none',
      }}
      className="sidebar-wrapper"
    >
      <Sidebar.Header>
        <Box>
          <Link href={'/'} className="flex justify-center text-center gap-2">
            <LayoutDashboard />
            <Box>
              <h3 className="text-xl font-medium text-[#ecedee]">
                {seller?.shop?.name}
              </h3>
              <h5 className="font-medium text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] pl-2">
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>

      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            title="Dashboard"
            icon={<Home fill={getIconColor('/dashboard')} />}
            isActive={activeSidebar === '/dashboard'}
            href="/dashboard"
          />
          <div className="mt-2 block">
            <SidebarMenu title="Main menu">
              <SidebarItem
                isActive={activeSidebar === '/orders'}
                title="Orders"
                href="/orders"
                icon={
                  <ListOrdered size={26} color={getIconColor('/accounts')} />
                }
              />
              <SidebarItem
                isActive={activeSidebar === '/payments'}
                title="Payment"
                href="/payments"
                icon={<Payment fill={getIconColor('/payments')} />}
              />
            </SidebarMenu>
          </div>
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SideBarWrapper;
