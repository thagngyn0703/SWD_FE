import React from 'react';
import { Layout, Space, Avatar } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import './HeaderDash.css';

const { Header } = Layout;

const HeaderDash = () => {
  return (
    <Header className="header-dash">
      <h1 className="header-title">Bảng điều khiển</h1>
      <Space className="header-icons">
        <Avatar
          icon={<BellOutlined />}
          className="header-icon"
          size="large"
        />
        <Avatar
          icon={<UserOutlined />}
          className="header-icon"
          size="large"
        />
      </Space>
    </Header>
  );
};

export default HeaderDash;