import React, { useEffect, useState } from "react";
import { Layout, Row, Col, Card, Input, List, Spin, Button, Select, Pagination } from "antd";
import { supabase } from "../supabaseClient";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { useNavigate, useParams } from "react-router-dom";
import "./CSS/ProductList.css";

const { Content } = Layout;
const { Meta } = Card;
const { Search } = Input;
const { Option } = Select;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 16;
  const { id: categoryId } = useParams();
  const navigate = useNavigate();

  // Fetch products based on selected category or brand with pagination
  const fetchProducts = async () => {
    setLoading(true);

    // Query to count total products based on filters
    let countQuery = supabase.from("products").select("*", { count: "exact" }).eq("status", 2);
    if (categoryId) countQuery = countQuery.eq("cate_id", categoryId);
    if (selectedBrand) countQuery = countQuery.eq("brand_id", selectedBrand);

    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("Error counting products:", countError);
    } else {
      setTotalProducts(count); // Set total product count for pagination
    }

    // Query to get paginated products
    let productQuery = supabase
      .from("products")
      .select("*")
      .eq("status", 2)
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1); // Range for pagination

    if (categoryId) productQuery = productQuery.eq("cate_id", categoryId);
    if (selectedBrand) productQuery = productQuery.eq("brand_id", selectedBrand);

    const { data, error } = await productQuery;
    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data);
    }
    setLoading(false);
  };


  // Fetch categories and brands
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) console.error("Error fetching categories:", error);
    else setCategories(data);
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase.from("brand").select("*");
    if (error) console.error("Error fetching brands:", error);
    else setBrands(data);
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts();
  }, [categoryId, selectedBrand, currentPage]);

  // Search products by name
  const handleSearch = async (value) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${value}%`);
    if (error) {
      console.error("Error searching products:", error);
    } else {
      setProducts(data);
    }
    setLoading(false);
  };

  // Toggle category filter
  const handleCategoryClick = (id) => {
    if (parseInt(categoryId) === id) {
      navigate("/productlist"); // Clear category filter
    } else {
      navigate(`/productlist/${id}`);
    }
  };

  // Toggle brand filter
  const handleBrandClick = (id) => {
    if (selectedBrand === id) {
      setSelectedBrand(null); // Clear brand filter
    } else {
      setSelectedBrand(id);
    }
  };

  const handleProductClick = (id) => {
    navigate(`/ProductDetail/${id}`);
  };

  // Sort products
  const handleSortChange = (value) => {
    const sortedProducts = [...products];
    if (value === "") {
      sortedProducts.sort((a, b) => b.isHot - a.isHot);
    } else if (value === "lowest") {
      sortedProducts.sort((a, b) => a.sell_price - b.sell_price);
    } else if (value === "highest") {
      sortedProducts.sort((a, b) => b.sell_price - a.sell_price);
    }
    setProducts(sortedProducts);
  };

  // Dynamic title based on filters
  const getTitle = () => {
    const categoryName = categories.find((cat) => cat.id === parseInt(categoryId))?.name;
    const brandName = brands.find((brand) => brand.brand_id === selectedBrand)?.name;

    if (categoryId && selectedBrand) {
      return `Tất cả sản phẩm của ${categoryName} ${brandName}`;
    } else if (categoryId) {
      return `Tất cả sản phẩm của ${categoryName}`;
    } else if (selectedBrand) {
      return `Tất cả sản phẩm của ${brandName}`;
    } else {
      return "Tất cả sản phẩm";
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#F9F4F2" }}>
      <Header />
      <Content style={{ padding: "50px" }}>
        <Row justify="center" gutter={[16, 16]}>
          {/* Filters: Categories and Search */}
          <Col xs={24} sm={6}>
            <Card title="Tìm kiếm sản phẩm" bordered={false}>
              <Search
                placeholder="Nhập tên sản phẩm"
                allowClear
                enterButton="Tìm kiếm"
                size="large"
                onSearch={handleSearch}
              />
            </Card>

            <Card title="Thể loại sản phẩm" bordered={false} style={{ marginTop: 20 }}>
              <List
                dataSource={categories}
                renderItem={(category) => (
                  <List.Item
                    onClick={() => handleCategoryClick(category.id)}
                    style={{
                      fontWeight: parseInt(categoryId) === category.id ? "bold" : "normal",
                      color: parseInt(categoryId) === category.id ? "#1890ff" : "inherit",
                    }}
                  >
                    {category.name}
                  </List.Item>
                )}
              />
            </Card>

            <Card title="Thương hiệu sản phẩm" bordered={false} style={{ marginTop: 20 }}>
              <List
                dataSource={brands}
                renderItem={(brand) => (
                  <List.Item
                    onClick={() => handleBrandClick(brand.brand_id)}
                    style={{
                      fontWeight: selectedBrand === brand.brand_id ? "bold" : "normal",
                      color: selectedBrand === brand.brand_id ? "#1890ff" : "inherit",
                    }}
                  >
                    {brand.name}
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* Product List */}
          <Col xs={24} sm={16}>
            <h2 className="text-center">
              {getTitle()}
              <Select placeholder="Lọc sản phẩm" onChange={handleSortChange} style={{ float: "right" }}>
                <Option value="">Nổi bật</Option>
                <Option value="lowest">Giá từ thấp tới cao</Option>
                <Option value="highest">Giá từ cao tới thấp</Option>
              </Select>
            </h2>

            {loading ? (
              <div className="spinner-container">
                <Spin size="large" />
              </div>
            ) : (
              <Row gutter={[16, 16]} style={{ padding: "10px" }}>
                {products.map((product) => (
                  <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      cover={
                        <img
                          alt={product.name}
                          src={product.img[0]}
                          style={{ height: "auto", objectFit: "cover" }}
                        />
                      }
                      actions={[
                        <Button type="primary" onClick={() => handleProductClick(product.product_id)}>
                          Xem chi tiết
                        </Button>,
                      ]}
                    >
                      <Meta
                        title={<span>
                          {product.name} {product.isHot == 1 && <span className="hot-badge">Hot</span>}
                        </span>}

                        description={<strong style={{ color: "#ee4d2d", marginTop: "10px" }}>Giá: {product.sell_price.toLocaleString()} VND</strong>}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {/* Pagination */}
            <Row justify="end" style={{ marginTop: 20 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalProducts}
                onChange={handlePageChange}
                style={{ textAlign: "right" }}
              />
            </Row>


          </Col>
        </Row>
      </Content>
      <Footer />
    </Layout>
  );
};

export default ProductList;
