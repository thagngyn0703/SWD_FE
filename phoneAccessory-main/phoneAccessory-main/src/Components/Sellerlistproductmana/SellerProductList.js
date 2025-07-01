import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Space, Badge, List, Tag, Select, Input } from "antd";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import { BellOutlined, SearchOutlined } from "@ant-design/icons";
import "react-toastify/dist/ReactToastify.css";
import "./ProductManagement.css";

const { Option } = Select;

const PRODUCT_STATUS = {
  1: { color: "warning", text: "Chờ duyệt" },
  2: { color: "success", text: "Đã duyệt" },
  3: { color: "error", text: "Từ chối" },
  default: { color: "default", text: "Không xác định" }
};

const ProductTable = () => {
  // State Management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: null,
    brand: null,
    search: ""
  });
  const [modals, setModals] = useState({
    notification: false,
    status: false
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch Data
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBrands()
      ]);
    };
    
    initializeData();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select(`
        *,
        product_status (
          status_name
        )
      `);

      if (filters.category) {
        query = query.eq("cate_id", filters.category);
      }

      if (filters.brand) {
        query = query.eq("brand_id", filters.brand);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredData = data.sort((a, b) => b.isHot - a.isHot);

      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = filteredData.filter(product => 
          product.name.toLowerCase().includes(searchTerm) || 
          product.product_code.toLowerCase().includes(searchTerm)
        );
      }

      setProducts(filteredData);
      const lowStock = filteredData.filter(product => product.stock_quantity < 10);
      setLowStockProducts(lowStock);
      
      lowStock.forEach(product => {
        toast.warn(`Sản phẩm "${product.name}" sắp hết hàng!`);
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Không thể tải dữ liệu sản phẩm");
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Không thể tải dữ liệu thể loại");
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from("brand").select("*");
      if (error) throw error;
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Không thể tải dữ liệu nhãn hiệu");
    }
  };

  // Product Actions
  const toggleHotStatus = async (product) => {
    try {
      const newStatus = product.isHot === 1 ? 0 : 1;
      const { error } = await supabase
        .from("products")
        .update({ isHot: newStatus })
        .eq("product_id", product.product_id);

      if (error) throw error;

      toast.success(`Cập nhật trạng thái "Hot" cho sản phẩm "${product.name}" thành công!`);
      fetchProducts();
    } catch (error) {
      console.error("Error updating hot status:", error);
      toast.error("Không thể cập nhật trạng thái Hot");
    }
  };

  const updateProductStatus = async (status) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ status })
        .eq("product_id", selectedProduct.product_id);

      if (error) throw error;

      toast.success(`Đã cập nhật trạng thái sản phẩm thành công!`);
      fetchProducts();
      setModals(prev => ({ ...prev, status: false }));
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Không thể cập nhật trạng thái sản phẩm");
    }
  };

  // Render Functions
  const renderStatus = (status, record) => {
    const currentStatus = PRODUCT_STATUS[status] || PRODUCT_STATUS.default;

    return (
      <Space>
        <Tag color={currentStatus.color}>{currentStatus.text}</Tag>
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedProduct(record);
            setModals(prev => ({ ...prev, status: true }));
          }}
        >
          Thay đổi
        </Button>
      </Space>
    );
  };

  const columns = [
    { 
      title: "Tên sản phẩm", 
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name) 
    },
    { 
      title: "Mã sản phẩm", 
      dataIndex: "product_code",
      sorter: (a, b) => a.product_code.localeCompare(b.product_code)
    },
    { 
      title: "Giá nhập", 
      dataIndex: "import_price",
      sorter: (a, b) => a.import_price - b.import_price
    },
    { 
      title: "Giá bán", 
      dataIndex: "sell_price",
      sorter: (a, b) => a.sell_price - b.sell_price
    },
    { 
      title: "Số lượng", 
      dataIndex: "stock_quantity",
      sorter: (a, b) => a.stock_quantity - b.stock_quantity
    },
    {
      title: "Ảnh",
      dataIndex: "img",
      render: img => img ? <img src={img[0]} alt="Product" width="50" /> : "Trống"
    },
    {
      title: "Thể loại",
      dataIndex: "cate_id",
      render: cateId => categories.find(cat => cat.id === cateId)?.name || "Trống"
    },
    {
      title: "Nhãn hiệu",
      dataIndex: "brand_id",
      render: brandId => brands.find(brand => brand.brand_id === brandId)?.name || "Trống"
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: renderStatus
    },
    {
      title: "Trạng thái Hot",
      key: "isHot",
      render: (_, record) => (
        <Button
          onClick={() => toggleHotStatus(record)}
          type={record.isHot === 1 ? "primary" : "default"}
          disabled={record.status !== 2}
          className={`hot-status-btn ${record.isHot === 1 ? 'active' : ''}`}
        >
          {record.isHot === 1 ? "Hot" : "Không Hot"}
        </Button>
      )
    }
  ];

  return (
    <div className="product-table">
      <h1>Quản lí sản phẩm</h1>
      
      {/* Search and Filters */}
      <div className="filters-section"><Space className="mb-4" size="middle">
        <Input
          placeholder="Tìm kiếm theo tên hoặc mã sản phẩm"
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
          style={{ width: 300 }}
          allowClear
        />

        <Button
          onClick={() => setModals(prev => ({ ...prev, notification: true }))}
        >
          <Badge count={lowStockProducts.length} offset={[10, 0]}>
            <BellOutlined style={{ fontSize: "18px" }} />
          </Badge>
        </Button>

        <Select
          placeholder="Lọc theo thể loại"
          onChange={value => setFilters(prev => ({ ...prev, category: value }))}
          value={filters.category}
          style={{ width: 200 }}
          allowClear
        >
          {categories.map(category => (
            <Option key={category.id} value={category.id}>
              {category.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Lọc theo nhãn hiệu"
          onChange={value => setFilters(prev => ({ ...prev, brand: value }))}
          value={filters.brand}
          style={{ width: 200 }}
          allowClear
        >
          {brands.map(brand => (
            <Option key={brand.brand_id} value={brand.brand_id}>
              {brand.name}
            </Option>
          ))}
        </Select>
      </Space></div>
      

      {/* Product Table */}
      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="product_id"
        pagination={{ pageSize: 10 }}
      />

      {/* Modals */}
      <Modal
        title="Sản phẩm sắp hết hàng"
        open={modals.notification}
        onOk={() => setModals(prev => ({ ...prev, notification: false }))}
        onCancel={() => setModals(prev => ({ ...prev, notification: false }))}
      >
        <List
          itemLayout="horizontal"
          dataSource={lowStockProducts}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={item.name}
                description={`Số lượng: ${item.stock_quantity}`}
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
      title="Thay đổi trạng thái sản phẩm"
      open={modals.status}
      onCancel={() => {
        setModals(prev => ({ ...prev, status: false }));
        setSelectedProduct(null);
      }}
      footer={null}
    >
      {selectedProduct && (
        <div>
          <p>Sản phẩm: <strong>{selectedProduct.name}</strong></p>
          <p>Mã sản phẩm: {selectedProduct.product_code}</p>
          <div className="status-modal-buttons">
            {Object.entries(PRODUCT_STATUS).map(([key, value]) => {
              if (key === 'default') return null;
              return (
                <Button
                  key={key}
                  type={selectedProduct.status === parseInt(key) ? "primary" : "default"}
                  onClick={() => updateProductStatus(parseInt(key))}
                  className="status-button"
                >
                  <Tag color={value.color}>{value.text}</Tag>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>

      <ToastContainer />
    </div>
  );
};

export default ProductTable;