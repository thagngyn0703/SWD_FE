import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileDoneOutlined,
  UserOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ onMenuClick }) => {

  return (
    <Sider
      width={300}
      className="site-layout-background" 
      breakpoint="lg" 
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={['dashboard']}
        style={{ height: '100%', borderRight: 0 }}
        onClick={({ key }) => onMenuClick(key)}
      >
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          Tổng quan
        </Menu.Item>
        <Menu.Item key="products" icon={<ShoppingOutlined />}>
          Quản lý sản phẩm
        </Menu.Item>
        <Menu.Item key="orders" icon={<FileDoneOutlined />}>
          Quản lý đơn hàng
        </Menu.Item>
        <Menu.Item key="customers" icon={<UserOutlined />}>
          Quản lý khách hàng
        </Menu.Item>
        <Menu.Item key="accounts" icon={<SettingOutlined />}>
          Quản lý tài khoản
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default Sidebar;

