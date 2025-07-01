import React, { useEffect, useState, useRef } from "react";
import { Carousel, Card, Spin, Button } from "antd";
import { supabase } from "../supabaseClient"; // Import Supabase client
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./CSS/HomeBrand.css";

const { Meta } = Card;

const HotProducts = () => {
  const [hotProducts, setHotProducts] = useState([]); // List of hot products
  const [loading, setLoading] = useState(true); // Loading state
  const carouselRef = useRef(); // Ref to control the Carousel
  const navigate = useNavigate();

  const handleProductClick = (id) => {
    navigate(`/ProductDetail/${id}`);
  };

  // Fetch only hot products
  const fetchHotProducts = async () => {
    setLoading(true); // Start loading

    try {
      const { data: products, error } = await supabase
        .from("products")
        .select(`*`)
        .eq("isHot", 1)
        .eq("status", 2)
        .gt("stock_quantity", 0)
        .order("isHot", { ascending: false });

      if (error) throw error;

      setHotProducts(products); // Save hot products in state
    } catch (error) {
      console.error("Error fetching hot products:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Fetch data when component first renders
  useEffect(() => {
    fetchHotProducts();
  }, []);

  const next = () => carouselRef.current.next();
  const prev = () => carouselRef.current.prev();

  if (loading) {
    return (
      <div className="spinner-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="product-carousel">
      <h2 className="carousel-title">Sản phẩm bán chạy</h2>
      <Carousel
        ref={carouselRef}
        dots={false}
        slidesToShow={4}
        slidesToScroll={1}
        arrows={false}
        className="product-slider"
      >
        {hotProducts.map((product) => (
          <div key={product.id} className="product-card-container">
            <Card
              hoverable
              cover={
                <img
                  alt={product.name}
                  src={product.img[0]}
                  style={{ height: "350px", objectFit: "cover", cursor: "pointer" }}
                  onClick={() => handleProductClick(product.product_id)}
                />
              }
              className="product-card"
            >
              <Meta
                title={
                  <span>
                    {product.name} {product.isHot == 1 && <span className="hot-badge">Hot</span>}
                  </span>
                }
                description={
                  <span style={{ color: "rgb(255 64 64)" }}>
                    Giá: {product.sell_price.toLocaleString()} VND
                  </span>
                }
              />
            </Card>
          </div>
        ))}
      </Carousel>

      {/* Navigation Buttons */}
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={prev}
        className="carousel-arrow left-arrow"
      />
      <Button
        type="text"
        icon={<RightOutlined />}
        onClick={next}
        className="carousel-arrow right-arrow"
      />

      {/* View More Button */}
      <div style={{ textAlign: "center" }}>
        <Button type="primary" onClick={() => navigate("/productlist")} className="view-more-button">
          Xem thêm
        </Button>
      </div>
    </div>
  );
};

export default HotProducts;
