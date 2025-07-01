import React, { useState } from 'react';
import { Tabs } from 'antd';
import ProductStat from "../Statis/Product";
import SalesStatistics from "../Statis/OrderSta";
const { TabPane } = Tabs;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('1');

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>THỐNG KÊ CỬA HÀNG</h2>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Thống kê đơn hàng" key="1">
          <SalesStatistics />
        </TabPane>
        <TabPane tab="Thống kê sản phẩm" key="2">
          <ProductStat />
        </TabPane>

      </Tabs>
    </div>
  );
};

export default AdminDashboard;