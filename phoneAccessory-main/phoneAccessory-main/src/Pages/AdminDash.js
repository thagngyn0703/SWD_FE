import React, { useState } from 'react';
import { Layout, Breadcrumb } from 'antd';
import AppHeader from '../Components/Header/Header';
import Sidebar from '../Components/Sidebar/Sidebar';
import OrderManagement from '../Components/OrderManagement/OrderManagement';
import ProductManagement from '../Components/ProductManagement/ProductManagement';
import AccountManagement from '../Components/UserManagement/UserManagement';
import ProfileManagement from '../Components/CustomerManagement/CustomerManage';
import DashboardOverview from '../Components/AdminDash/AdminDash';
const { Content } = Layout;

const DashboardPage = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <ProfileManagement />;
      case 'accounts':
        return <AccountManagement />;
      
      default:
        return <DashboardOverview />;
    }
  };

  // Mapping page keys to breadcrumb items
  const breadcrumbItems = {
    dashboard: ['Tổng quan'],
    products: ['Quản lý sản phẩm'],
    orders: ['Quản lý đơn hàng'],
    customers: ['Quản lý khách hàng'],
    accounts: ['Quản lý tài khoản'],
    reports: ['Quản lý mã giảm giá'],
  };

  return (
    <Layout >
      <AppHeader />
      <Layout>
        <Sidebar onMenuClick={setCurrentPage} />
        <Layout style={{ padding: '0 24px 24px' }}>
          {/* Breadcrumb */}
          <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>  
            {breadcrumbItems[currentPage].map((item, index) => (
              <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
          {/* Page content */}
          <Content>{renderContent()}</Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;
