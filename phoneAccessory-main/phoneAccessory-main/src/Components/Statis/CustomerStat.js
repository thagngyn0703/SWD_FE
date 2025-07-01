// CustomerStatistics.js
import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import { supabase } from "../supabaseClient";

const CustomerStatistics = () => {
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [topCustomers, setTopCustomers] = useState([]);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [customerSegments, setCustomerSegments] = useState({ high: 0, regular: 0, occasional: 0 });
  const [averageSpending, setAverageSpending] = useState(0);

  useEffect(() => {
    const fetchCustomerData = async () => {
      // Fetch customer data
      const { data: customers, error: customerError } = await supabase
        .from('profileuser')
        .select('*');
      if (customerError) {
        console.error('Lỗi khi lấy dữ liệu khách hàng từ Supabase:', customerError);
        return;
      }
      setTotalCustomers(customers.length);

      // Fetch order data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_price, created_at');
      if (ordersError) {
        console.error('Lỗi khi lấy dữ liệu đơn hàng từ Supabase:', ordersError);
        return;
      }

      // 1. New Customers (within the last month)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const newCustomerCount = customers.filter(customer =>
        new Date(customer.created_at) >= oneMonthAgo
      ).length;
      setNewCustomers(newCustomerCount);

      // 2. Active Customers (who placed orders in the last month)
      const activeCustomerIds = new Set();
      orders.forEach(order => {
        if (new Date(order.created_at) >= oneMonthAgo) {
          activeCustomerIds.add(order.user_id);
        }
      });
      setActiveCustomers(activeCustomerIds.size);

      // 3. Calculate total spending per customer for segmentation
      const spendingPerCustomer = {};
      orders.forEach(order => {
        if (!spendingPerCustomer[order.user_id]) {
          spendingPerCustomer[order.user_id] = 0;
        }
        spendingPerCustomer[order.user_id] += order.total_price;
      });

      // khach tieu nhieu nhat
      const topCustomerData = customers
        .map(customer => ({
          ...customer,
          total_spending: spendingPerCustomer[customer.user_id] || 0,
        }))
        .sort((a, b) => b.total_spending - a.total_spending)
        .slice(0, 5);
      setTopCustomers(topCustomerData);

      // 5. Customer Segmentation
      const segments = { high: 0, regular: 0, occasional: 0 };
      let totalSpending = 0;
      let totalCustomersWithSpending = 0;

      customers.forEach(customer => {
        const spending = spendingPerCustomer[customer.user_id] || 0;
        totalSpending += spending;

        if (spending > 10000000) { // High spenders (over 10 million VND)
          segments.high += 1;
        } else if (spending > 5000000) { // Regular customers (5-10 million VND)
          segments.regular += 1;
        } else if (spending > 0) { // Occasional customers (under 5 million VND)
          segments.occasional += 1;
        }

        if (spending > 0) {
          totalCustomersWithSpending += 1;
        }
      });

      setCustomerSegments(segments);

      // 6. Average Spending per Customer
      const avgSpending = totalCustomersWithSpending ? totalSpending / totalCustomersWithSpending : 0;
      setAverageSpending(avgSpending);
    };

    fetchCustomerData();
  }, []);

  const columns = [
    {
      title: 'Tên Khách Hàng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Tổng Chi Tiêu (₫)',
      dataIndex: 'total_spending',
      key: 'total_spending',
      render: (value) => value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
    },
  ];

  return (
    <div>
      <h3>Thống Kê Khách Hàng</h3>

      <div style={{ marginBottom: '20px', fontSize: '1.2em' }}>
        <p><strong>Tổng số khách hàng:</strong> {totalCustomers}</p>
        <p><strong>Khách hàng mới (trong tháng qua):</strong> {newCustomers}</p>
        <p><strong>Khách hàng hoạt động (trong tháng qua):</strong> {activeCustomers}</p>
        <p><strong>Chi tiêu trung bình mỗi khách hàng:</strong> {averageSpending.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
      </div>

      <div style={{ marginBottom: '20px', fontSize: '1.2em' }}>
        <h4>Phân Khúc Khách Hàng</h4>
        <p><strong>Khách hàng chi tiêu cao (trên 10 triệu ₫):</strong> {customerSegments.high}</p>
        <p><strong>Khách hàng thường xuyên (5-10 triệu ₫):</strong> {customerSegments.regular}</p>
        <p><strong>Khách hàng không thường xuyên (dưới 5 triệu ₫):</strong> {customerSegments.occasional}</p>
      </div>

      <h4>Top 5 Khách Hàng Theo Tổng Chi Tiêu</h4>
      <Table dataSource={topCustomers} columns={columns} rowKey="user_id" />
    </div>
  );
};

export default CustomerStatistics;
