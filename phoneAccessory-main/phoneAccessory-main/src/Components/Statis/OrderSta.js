// SalesStatistics.js
import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Select } from 'antd';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
import { supabase } from "../supabaseClient";
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesStatistics = () => {
  const [dailyStats, setDailyStats] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0); // Total revenue for the chart
  const [tableTotalRevenue, setTableTotalRevenue] = useState(0); // Total revenue for the table
  const [filteredStats, setFilteredStats] = useState([]); // Used for the chart
  const [tableData, setTableData] = useState([]); // Used for the table
  const [filterType, setFilterType] = useState('day');

  useEffect(() => {
    const fetchSalesData = async () => {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, total_price');
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity');
      
      if (ordersError || orderItemsError) {
        console.error('Lỗi khi lấy dữ liệu từ Supabase:', ordersError || orderItemsError);
        return;
      }

      const stats = {};
      let totalRev = 0;

      orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('vi-VN');
        if (!stats[date]) {
          stats[date] = { orderCount: 0, revenue: 0, productsSold: 0 };
        }
        stats[date].orderCount += 1;
        stats[date].revenue += order.total_price;
        totalRev += order.total_price; // Accumulate total revenue
      });

      orderItems.forEach(item => {
        const order = orders.find(o => o.id === item.order_id);
        if (order) {
          const date = new Date(order.created_at).toLocaleDateString('vi-VN');
          stats[date].productsSold += item.quantity;
        }
      });

      const dailyStatsArray = Object.entries(stats).map(([date, data]) => ({
        date,
        ...data
      }));
      
      setDailyStats(dailyStatsArray);
      setTotalRevenue(totalRev); // Set total revenue for the chart
      setFilteredStats(dailyStatsArray); // Initialize chart data with all data
      setTableData(dailyStatsArray); // Initialize table data with all data
      calculateTableTotalRevenue(dailyStatsArray); // Calculate initial table total revenue
    };

    fetchSalesData();
  }, []);

  // Function to calculate total revenue based on tableData
  const calculateTableTotalRevenue = (data) => {
    const total = data.reduce((sum, item) => sum + item.revenue, 0);
    setTableTotalRevenue(total);
  };

  // Function to filter table data by day, week, or month
  const handleFilterTypeChange = (value) => {
    setFilterType(value);
    let filtered = dailyStats;

    const currentDate = new Date();

    if (value === 'day') {
      filtered = dailyStats.filter(stat => {
        const statDate = new Date(stat.date.split('/').reverse().join('-')); // Convert to YYYY-MM-DD format
        return statDate.toDateString() === currentDate.toDateString();
      });
    } else if (value === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(currentDate.getDate() - 7);

      filtered = dailyStats.filter(stat => {
        const statDate = new Date(stat.date.split('/').reverse().join('-'));
        return statDate >= weekAgo && statDate <= currentDate;
      });
    } else if (value === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(currentDate.getMonth() - 1);

      filtered = dailyStats.filter(stat => {
        const statDate = new Date(stat.date.split('/').reverse().join('-'));
        return statDate >= monthAgo && statDate <= currentDate;
      });
    }

    setTableData(filtered); // Only update the table data
    calculateTableTotalRevenue(filtered); // Update the table's total revenue based on the filtered data
  };

  // Function to filter chart data by date range
  const handleDateRangeChange = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      setFilteredStats(dailyStats); // Reset to all data if no dates are selected
      return;
    }

    const [start, end] = dates;
    const filtered = dailyStats.filter(stat => {
      const statDate = new Date(stat.date.split('/').reverse().join('-')); // Convert to YYYY-MM-DD format
      return statDate >= start.toDate() && statDate <= end.toDate();
    });

    setFilteredStats(filtered);
  };

  const chartData = {
    labels: filteredStats.map(stat => stat.date),
    datasets: [
      {
        type: 'line',
        label: 'Doanh thu (₫)',
        data: filteredStats.map(stat => stat.revenue),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        type: 'bar',
        label: 'Số lượng sản phẩm đã bán',
        data: filteredStats.map(stat => stat.productsSold),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Doanh thu (₫)' },
        ticks: {
          callback: (value) => value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Số lượng sản phẩm đã bán' },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.dataset.label === 'Doanh thu (₫)') {
              return `${context.dataset.label}: ${context.raw.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}`;
            }
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    }
  };

  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Số lượng đơn hàng',
      dataIndex: 'orderCount',
      key: 'orderCount',
    },
    {
      title: 'Doanh thu (₫)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
    },
    {
      title: 'Số lượng sản phẩm đã bán',
      dataIndex: 'productsSold',
      key: 'productsSold',
    },
  ];

  return (
    <div>
      <h3>Thống Kê Bán Hàng</h3>

      <div style={{ marginBottom: '20px', fontSize: '1.5em', fontWeight: 'bold' }}>
        Tổng Doanh Thu (Biểu Đồ): <span style={{ color: 'red' }}>{totalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
      </div>
      
      <div style={{ marginBottom: '20px', fontSize: '1.5em', fontWeight: 'bold' }}>
        Tổng Doanh Thu (Bảng): <span style={{ color: 'blue' }}>{tableTotalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
      </div>

      <Select 
        defaultValue="day" 
        style={{ width: 200, marginBottom: '20px', marginRight: '20px' }}
        onChange={handleFilterTypeChange}
      >
        <Option value="day">Hôm nay</Option>
        <Option value="week">Tuần này</Option>
        <Option value="month">Tháng này</Option>
      </Select>

      <Table dataSource={tableData} columns={columns} rowKey="date" style={{ marginBottom: '40px' }} />

      <RangePicker
        format="DD/MM/YYYY"
        onChange={handleDateRangeChange}
        style={{ marginBottom: '20px' }}
      />

      <Chart type="bar" data={chartData} options={chartOptions} />
    </div>
  );
};

export default SalesStatistics;
