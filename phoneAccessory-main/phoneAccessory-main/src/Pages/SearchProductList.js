import React from 'react';
import { useLocation } from 'react-router-dom';
import { Layout, Row, Col, Card, Button } from "antd";
import "./CSS/ProductList.css";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { Content } from 'antd/es/layout/layout';
const SearchProductList = () => {
    const location = useLocation();
    const { searchResults } = location.state || {};
    const { Meta } = Card;
    const handleProductClick = (id) => {
        // Navigate to product detail page
        window.location.href = `/ProductDetail/${id}`;
    };

    return (
        <Layout style={{ minHeight: "100vh", backgroundColor: "#F9F4F2" }}>
            <Header />
            <Content style={{ padding: "50px" }}>
                <h2 className="text-center">Kết quả tìm kiếm</h2>
                {searchResults && searchResults.length > 0 ? (
                    <Row gutter={[16, 16]} style={{ padding: "10px" }}>
                    {searchResults.map((product) => (
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
                            <Button
                              type="primary"
                              onClick={() => handleProductClick(product.product_id)}
                            >
                              Xem chi tiết
                            </Button>,
                          ]}
                        >
                          <Meta
                            title={
                              <span>
                                {product.name}{" "}
                                {product.isHot === 1 && <span className="hot-badge">Hot</span>}
                              </span>
                            }
                            description={
                              <p style={{ color: "#121214", marginTop: "10px" }}>
                                Giá: {product.sell_price.toLocaleString()} VND
                              </p>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                    <p>Không tìm thấy sản phẩm.</p>
                )}
            </Content>
            <Footer />

        </Layout>



    );
};

export default SearchProductList;
