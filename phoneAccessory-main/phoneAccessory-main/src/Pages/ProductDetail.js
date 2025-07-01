
import React, { useEffect, useState, useRef } from "react";
import { Layout, Row, Col, Card, List, Spin, Carousel, Rate } from "antd";
import { Modal, Button } from 'antd';
import { useParams } from 'react-router-dom';
import { supabase } from "../supabaseClient"; // Import Supabase client
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { useNavigate } from "react-router-dom";
import { decoder64 } from '../Components/Base64Encoder/Base64Encoder';
import { toast, ToastContainer } from 'react-toastify'; // Import Toast from react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import "./CSS/ProductDetail.css";
import Comments from "./Comments";
import AvgRate from "./avgcmt";

const { Content } = Layout;
const { Meta } = Card;

function ProductDetail() {
    const [quantity, setQuantity] = useState(1);
    const { id } = useParams(); // Lấy id từ URL
    const [product, setProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const carouselRef = useRef(); // Dùng để điều khiển Carousel
    const [user, setUser] = useState(null);
    const [cart, setCart] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null); // Thêm state cho ảnh chính
    const [isAdding, setIsAdding] = useState(false); // New state for "Add to Cart" button
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingFeedback, setExistingFeedback] = useState(null);
    const [averageRate, setAverageRate] = useState(0);

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const fetchUserAndCart = async () => {
        try {
            const userInfoCookie = getCookie('token');
            if (userInfoCookie) {
                const decodedUserInfo = JSON.parse(decoder64(userInfoCookie));
                setUser(decodedUserInfo); // Cập nhật state user
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            toast.error("Lỗi lấy thông tin người dùng: " + error.message); // Toast in Vietnamese
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const fetchProduct = async () => {
            const { data: product, proerror } = await supabase
                .from('products')
                .select('*')
                .eq('product_id', id)
                .single();

            if (proerror) {
                console.error('Error fetching product:', proerror);
            } else {
                setProduct(product);
                setSelectedImage(product.img[0]); // Đặt ảnh đầu tiên làm ảnh chính
            }

            const cateid = product.cate_id;
            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .eq('cate_id', cateid);

            if (error) {
                console.error('Error fetching product:', error);
            } else {
                setProducts(products);
            }

            setLoading(false);
        };
        fetchUserAndCart()
        fetchProduct();
    }, [id]);

    if (loading) {
        return <p>Đang tải thông tin sản phẩm...</p>;
    }

    if (!product) {
        return <p>Không tìm thấy sản phẩm.</p>;
    }

    const handleQuantityChange = (newQuantity) => {
        if (newQuantity < 1) {
            toast.warn('Số lượng sản phẩm phải lơn hơn 1');
            return;
        }
        if (newQuantity > product.stock_quantity) {
            toast.warn(`Số lượng sản phẩm vượt quá tồn kho. Đã đặt về ${product.stock_quantity}.`);
            setQuantity(product.stock_quantity);
        } else {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            Modal.confirm({
                title: 'Bạn chưa đăng nhập',
                content: 'Đăng nhập trước khi thêm sản phẩm vào giỏ hàng.',
                okText: 'OK',
                cancelText: 'Đăng nhập',
                onCancel: () => {
                    navigate('/login');
                }
            });
            return;
        }

        if (quantity > product.stock_quantity) {
            toast.warn(`Số lượng sản phẩm bạn muốn mua vượt quá tồn kho. Chỉ còn lại ${product.stock_quantity} sản phẩm.`);
            setQuantity(product.stock_quantity);
            return;
        }

        const userid = user.user_id;
        const product_id = product.product_id;

        const fetchCart = async () => {
            const { data: cart, error } = await supabase
                .from('cart')
                .select('*')
                .eq('user_id', userid)
                .single();

            if (error) {
                console.error("cart error:", error);
                toast.error("Lỗi giỏ hàng: " + error.message);
            } else {
                setCart(cart);
            }
        };

        await fetchCart();

        if (cart) {
            try {
                const { data: cart_item, error: cartDetailError } = await supabase
                    .from('cart_item')
                    .select('*')
                    .eq('cart_id', cart.id)
                    .eq('product_id', product_id)
                    .single();

                if (cart_item) {
                    const newQuantity = cart_item.quantity + +quantity;

                    if (newQuantity > product.stock_quantity) {
                        toast.warn(`Không thể thêm vượt quá tồn kho. Đã điều chỉnh số lượng tối đa là ${product.stock_quantity}.`);
                        await supabase
                            .from('cart_item')
                            .update({ quantity: product.stock_quantity })
                            .eq('cart_id', cart.id)
                            .eq('product_id', product_id);
                    } else {
                        const { error: updateError } = await supabase
                            .from('cart_item')
                            .update({ quantity: newQuantity })
                            .eq('cart_id', cart.id)
                            .eq('product_id', product_id);

                        if (updateError) {
                            console.error('Error updating cart detail:', updateError);
                            toast.error('Lỗi cập nhật giỏ hàng: ' + updateError.message);
                        } else {
                            toast.success(`Cập nhật số lượng sản phẩm ${product.name} lên ${newQuantity}.`);
                        }
                    }
                } else {
                    const { error: insertError } = await supabase
                        .from('cart_item')
                        .insert({ cart_id: cart.id, product_id: product_id, quantity: quantity });

                    if (insertError) {
                        console.error('Error adding product to cart:', insertError);
                        toast.error('Lỗi thêm sản phẩm vào giỏ hàng: ' + insertError.message);
                    } else {
                        toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng.`);
                    }
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                toast.error('Lỗi thêm vào giỏ hàng: ' + error.message);
            }
        }
    };


    const formatPrice = (price) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Thay đổi ảnh chính khi người dùng bấm vào ảnh nhỏ
    const handleImageClick = (imgUrl) => {
        setSelectedImage(imgUrl);
    };

    const handleProductClick = (id) => {
        navigate(`/ProductDetail/${id}`);
        window.location.reload();
    };


    return (
        <div style={{ backgroundColor: "#F9F4F2" }}>
            <Header />
            <div >
                <ToastContainer /> {/* Toast container to show toasts */}
                <div className="product-container">
                    <div className="product-image-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Card
                            hoverable
                            cover={
                                <img
                                    alt={product.name}
                                    src={selectedImage} // Hiển thị ảnh chính được chọn
                                    style={{ cursor: "pointer", width: '100%', maxHeight: '400px', objectFit: 'cover' }} // Giảm maxHeight và giữ tỉ lệ
                                />
                            }
                            style={{ width: '400px' }} // Đặt chiều rộng cho Card và giảm margin bên dưới
                        />
                        <div className="product-thumbnails" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            {/* Hiển thị tất cả ảnh nhỏ */}
                            {product.img.map((imgUrl, index) => (
                                <img
                                    key={index}
                                    src={imgUrl}
                                    alt={`Thumbnail ${index}`}
                                    className={`thumbnail ${selectedImage === imgUrl ? 'selected' : ''}`} // Đánh dấu ảnh được chọn
                                    onClick={() => handleImageClick(imgUrl)}
                                    style={{
                                        cursor: 'pointer',
                                        width: '70px',
                                        height: '70px',
                                        objectFit: 'cover', // Đảm bảo ảnh nhỏ cũng giữ tỉ lệ
                                        border: selectedImage === imgUrl ? '2px solid #1890ff' : '1px solid #d9d9d9'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="product-details">
                        <h1>{product.name}</h1>
                        {/* Display average rating using Rate component */}
                        <AvgRate productId={id} />

                        <p className="product-price">{formatPrice(product.sell_price)} VND</p>
                        <p>Số lượng sản phẩm còn trong kho: <span style={{ color: 'red' }}>{product.stock_quantity}</span></p>

                        <label htmlFor="quantity">Số lượng:</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(Number(e.target.value))}
                            min="1"
                            max={product.stock_quantity}
                            style={{ margin: '5px' }}
                        />

                        <button onClick={handleAddToCart} disabled={isAdding}>
                            {isAdding ? "Đang thêm sản phẩm..." : "Thêm vào giỏ"}
                        </button>

                        <div
                            className="product-description"
                            dangerouslySetInnerHTML={{ __html: product.des }} // Inject HTML content safely
                        />
                    </div>

                </div>

            </div>
            <div>
                <Comments productId={id} user={user} />
            </div>

            <div className="product-carousel">
                <h2 className="carousel-title">Sản phẩm cùng thể loại</h2>
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
                                        style={{ height: "auto", objectFit: "cover" }}
                                    />
                                }
                                actions={[
                                    <Button type="primary" onClick={() => handleProductClick(product.product_id)}>
                                        Xem chi tiết
                                    </Button>,
                                ]}
                                className="product-card"
                            >
                                <Meta
                                    title={product.name}
                                    description={`Giá: ${formatPrice(product.sell_price)} VNĐ`}
                                />
                            </Card>
                        </div>
                    ))}
                </Carousel>
            </div>

            <Footer />
        </div>
    );
};


export default ProductDetail;
