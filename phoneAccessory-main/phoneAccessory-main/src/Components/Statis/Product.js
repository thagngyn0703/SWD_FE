import React, { useState, useEffect } from 'react';
import { Table, Button } from 'antd';
import { Bar } from 'react-chartjs-2';
import { supabase } from "../supabaseClient";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Link } from 'react-router-dom';

// Register the components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProductStat = () => {
  const [productStats, setProductStats] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu sản phẩm từ Supabase
  const fetchProductData = async () => {
    setLoading(true);
  
    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('product_id, name, stock_quantity, img, status, product_code');
  
    if (productsError) {
      console.error('Error fetching products:', productsError);
      setLoading(false);
      return;
    }
  
    // Fetch order items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('product_id, quantity');
  
    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      setLoading(false);
      return;
    }
  
    // Calculate total quantity sold for each product
    const quantitySoldMap = orderItems.reduce((acc, item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + item.quantity;
      return acc;
    }, {});
  
    // Add quantity_sold to each product
    const productsWithSales = products.map(product => ({
      ...product,
      quantity_sold: quantitySoldMap[product.product_id] || 0 // Default to 0 if no sales
    }));
  
    setProductStats(productsWithSales);
    setTotalProducts(productsWithSales.length);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchProductData();
  }, []);
  
  
  
  // Cấu hình dữ liệu cho biểu đồ Bar Chart
  const chartData = {
    labels: productStats.map((product) => product.product_code),
    datasets: [
      {
        label: 'Số lượng tồn kho',
        data: productStats.map((product) => product.stock_quantity),
        backgroundColor: 'rgba(54, 12, 45, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Cột cho bảng từ dữ liệu Supabase
  const columns = [
    {
      title: 'Số thứ tự',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Ảnh',
      dataIndex: 'img',
      key: 'img',
      render: (image, record) => (
        <Link to={`/productdetail/${record.product_id}`}>
          <img src={image ? image[0] : ''} alt="product" style={{ width: 100, border: '1px solid #ccc' }} />
        </Link>
      ),
    },
    {
      title: 'Mã sản phẩm',
      dataIndex: 'product_code',
      key: 'product_code',
      render: (productId) => (
        <Link to={`/productdetail/${productId}`}>{productId}</Link>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock_quantity',
      key: 'stock_quantity',
      sorter: (a, b) => a.stock_quantity - b.stock_quantity,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Chờ Duyệt', value: 1 },
        { text: 'Đã Duyệt', value: 2 },
        { text: 'Từ Chối', value: 3 },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        if (status === 1) return 'Chờ Duyệt';
        if (status === 2) return 'Đã Duyệt';
        if (status === 3) return 'Từ Chối';
        return 'Không xác định';
      },
    },
    {
      title: 'Số lượng đã bán',
      dataIndex: 'quantity_sold',
      key: 'quantity_sold',
      sorter: (a, b) => a.quantity_sold - b.quantity_sold,
    },
    
  ];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3>Số Lượng Tồn Kho Sản Phẩm</h3>
        <div style={{ marginBottom: '20px', fontSize: '1.5em', fontWeight: 'bold' }}>
          TỔNG SỐ SẢN PHẨM: <span style={{ color: 'red' }}>{totalProducts}</span> sản phẩm
        </div>
        <Table dataSource={productStats} columns={columns} rowKey="product_id" loading={loading} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Biểu Đồ Tồn Kho Sản Phẩm</h3>
        <Bar data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default ProductStat;
