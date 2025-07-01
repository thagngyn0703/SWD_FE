import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Input } from 'antd';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './CSS/HomeMenu.css';
import capsac from './images/capsac.png';
import cusac from './images/cusac.png';
import giado from './images/giado.png';
import loablu from './images/loablu.png';
import phukien from './images/phukien.png';
import oplung from './images/oplung.png';
import sacduphong from './images/sacduphong.png';
import tainghe from './images/tainghe.png';

const { Meta } = Card;
const { Search } = Input;

const categoryCodeMap = {
  'Ốp lưng': oplung,
  'Củ sạc': cusac,
  'Cáp sạc': capsac,
  'Tai nghe': tainghe,
  'Sạc dự phòng': sacduphong,
  'Giá đỡ': giado,
  'Loa bluetooth': loablu,
  'Linh kiện khác': phukien,
};

const getCategoryImage = (categoryName) => {
  return categoryCodeMap[categoryName] || null;
};

// Hàm định dạng giá
const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return 'Liên hệ';
  }
  try {
    return `${Number(price).toLocaleString('vi-VN')} đ`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return 'Liên hệ';
  }
};

const HomeMenu = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const handleSearch = (value) => {
    setSearchValue(value);
    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filteredProducts = products.filter(product =>
      product?.name?.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(filteredProducts);
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Spin size="large" />
      </div>
    );
  }
  const handleSearch1 = (value) => {
    setSearchValue(value);
    if (value.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filteredProducts = products.filter(product =>
      product?.name?.toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(filteredProducts);

    // Navigate to the product list page with search results
    navigate('/SearchProductList', { state: { searchResults: filteredProducts } });
  };
  
  return (
    <div className="product-grid-container">
      <div className="search-container" style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
        <Search
          placeholder="Nhập sản phẩm bạn muốn tìm"
         onSearch={handleSearch1}
          onChange={(e) => handleSearch(e.target.value)}
          value={searchValue}
          size='large'
          style={{ width: '100%' }}
        />
        
        {/* Hiển thị kết quả tìm kiếm */}
        {searchValue && searchResults.length > 0 && (
          <div className="search-results" style={{ 
            marginTop: '1rem',
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {searchResults.map((product) => (
              <Link 
                key={product?.product_id} 
                to={`/ProductDetail/${product?.product_id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="search-result-item"  style={{
                  padding: '0.5rem 1rem',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'

                }}

                >
                  <img 
                    src={product?.img?.[0] || '/placeholder-image.png'} 
                    alt={product?.name || 'Sản phẩm'}
                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{product?.name || 'Không có tên'}</div>
                    <div style={{ color: '#ff4d4f' }}>{formatPrice(product?.sell_price)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Hiển thị thông báo không tìm thấy kết quả */}
        {searchValue && searchResults.length === 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '4px',
            textAlign: 'center',
            color: '#999'
          }}>
            Không tìm thấy sản phẩm phù hợp
          </div>
        )}
      </div>

      <h3 className="text-center mb-4">ĐÚNG HÀNG - ĐÚNG GIÁ - ĐÚNG CHẤT LƯỢNG</h3>
      <h3 className="text-center mb-4">Danh mục sản phẩm</h3>
      
      <Row gutter={[16, 16]} justify="center">
      {categories.slice(0, 8).map((category) => {
          const imageUrl = category?.image_url || getCategoryImage(category?.name);
          return (
            <Col
            span={4}
              xs={24}
              sm={12}
              md={6}
              lg={3}
              xl={3}
              className="d-flex justify-content-center"
              key={category?.id}
            >
              <Link to={`/productlist/${category.id}`}>
                <Card
                  hoverable
                  style={{ width: '15rem', height: '15rem' }}
                  cover={
                    <img
                      alt={category?.name || 'Danh mục'}
                      src={imageUrl}
                      className="card-img"
                      style={{ height: '9rem', objectFit: 'contain', padding: '10px' }}
                    />
                  }
                >
                  <Meta title={category?.name || 'Danh mục'} style={{ textAlign: 'center' }} />
                </Card>
              </Link>
            </Col>
          );
        })}
      </Row>

    </div>
  );
};

export default HomeMenu;