import React, { useState } from 'react';
import { Layout, Breadcrumb } from 'antd';
import AppHeader from '../Components/Header/Header';
import SellerSidebar from '../Components/SellerSliderbar/SellerSliderbar';
import SellerProductList from '../Components/Sellerlistproductmana/SellerProductList';
import DashboardOverview from '../Components/GeneralDash/General';
import SellerOrderManagement from '../Components/OrderManagement/SellerOrderManagement';
const { Content } = Layout;

const DashboardPage1 = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'products':
        return <SellerProductList />;
      case 'orders':
        return <SellerOrderManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  // Mapping page keys to breadcrumb items
  const breadcrumbItems = {
    dashboard: ['Tổng quan'],
    products: ['Quản lý sản phẩm'],
    orders: ['Quản lý đơn hàng'],
    
  
  };

  return (
    <Layout >
      <AppHeader />
      <Layout>
        <SellerSidebar onMenuClick={setCurrentPage} />
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

export default DashboardPage1;