import React, { useEffect, useState, useRef } from "react";
import { Carousel, Card, Spin, Button, Row } from "antd";
import { supabase } from "../supabaseClient"; // Import Supabase client
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./CSS/HomeBrand.css";

const { Meta } = Card;

const HomeBrand = ({ brandName }) => {
  const [products, setProducts] = useState([]); // Danh sách sản phẩm
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu
  const carouselRef = useRef(); // Dùng để điều khiển Carousel
  const [brandId, setBrandId] = useState(null); // Trạng thái id của thương hiệu

  const navigate = useNavigate();

  const handleProductClick = (id) => {
    navigate(`/ProductDetail/${id}`);
  };

  // Hàm lấy sản phẩm theo tên thương hiệu
  const fetchProductsByBrandName = async () => {
    setLoading(true); // Bắt đầu tải dữ liệu

    try {
      // Lấy thông tin thương hiệu theo tên
      const { data: brand, error: brandError } = await supabase
        .from("brand")
        .select("brand_id, name")
        .eq("name", brandName)
        .single(); // Lấy thương hiệu duy nhất

      if (brandError) throw brandError;

      const brandId = brand.brand_id; // Lấy id của thương hiệu
      setBrandId(brandId); // Lưu id vào state

      // Lấy tất cả sản phẩm thuộc brand_id, đồng thời lấy image_url từ bảng images
      const { data: products, error: productError } = await supabase
        .from("products")
        .select(`*`)
        .eq("brand_id", brandId)
        .eq("status", 2)
        .gt("stock_quantity", 0)
        .order("isHot", { ascending: false });

      if (productError) throw productError;

      setProducts(products); // Lưu sản phẩm vào state
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm:", error);
    } finally {
      setLoading(false); // Dừng trạng thái tải
    }
  };

  // Gọi API khi component render lần đầu
  useEffect(() => {
    fetchProductsByBrandName();
  }, [brandName]);

  const next = () => carouselRef.current.next();
  const prev = () => carouselRef.current.prev();

  if (loading) {
    return (
      <div className="spinner-container">
        <Spin size="large" />
      </div>
    );
  }

  const handleViewMore = () => {
    if (brandId) {
      navigate(`/BrandProducts/${brandId}`); // Chuyển hướng đến trang chi tiết sản phẩm theo brand_id
    }
  };

  return (
    <div className="product-carousel">
      <h2 className="carousel-title">Sản Phẩm Của Thương Hiệu {brandName}</h2>
      <Carousel
        ref={carouselRef}
        dots={false}
        slidesToShow={4}
        slidesToScroll={1}
        arrows={false}
        className="product-slider"
      >
        {products.map((product) => (
          <div key={product.id} className="product-card-container">
            <Card
              hoverable
              cover={
            
                <img
                  alt={product.name}
                  src={product.img[0]}
                  style={{ height: "350px", objectFit: "cover", cursor: "pointer" }}
                  onClick={() => handleProductClick(product.product_id)} // Thêm sự kiện onClick
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
                  description={<span style={{ color: "rgb(255 64 64)" }}>Giá: {product.sell_price.toLocaleString()} VND</span>}
              />
            </Card>
          </div>
        ))}
      </Carousel>

      {/* Nút điều hướng */}
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

      {/* Nút Xem thêm */}
      <div style={{ textAlign: "center" }}>
      <Button type="primary" onClick={handleViewMore} className="view-more-button">
        Xem thêm
      </Button>
    </div>
    </div>
  );
};

export default HomeBrand;
