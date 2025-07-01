import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Layout, List, Card, Button, InputNumber, Typography, Avatar, Popconfirm, Checkbox } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { decoder64 } from '../Components/Base64Encoder/Base64Encoder';
import "./CSS/CartDetail.css";
import { Link } from "react-router-dom";

const { Content } = Layout;
const { Text } = Typography;

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

const CartDetail = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const fetchUserAndCart = async () => {
            try {
                const userInfoCookie = getCookie('token');
                if (userInfoCookie) {
                    const decodedUserInfo = JSON.parse(decoder64(userInfoCookie));
                    setUser(decodedUserInfo);
                }
            } catch (error) {
                console.error("Lỗi lấy thông tin người dùng:", error);
                alert("Lỗi lấy thông tin người dùng: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndCart();
    }, []);

    useEffect(() => {
        const fetchCart = async () => {
            if (user) {
                try {
                    await fetchCartItems(user.user_id);
                } catch (error) {
                    console.error("Lỗi lấy sản phẩm trong giỏ hàng:", error);
                    alert("Lỗi lấy sản phẩm trong giỏ hàng: " + error.message);
                }
            }
        };

        fetchCart();
    }, [user]);

    const fetchCartItems = async (user_id) => {
        try {
            const { data: cartData, error: cartError } = await supabase
                .from("cart")
                .select("id")
                .eq('user_id', user_id)
                .single();

            if (cartError) throw cartError;

            const { data: itemsData, error: itemsError } = await supabase
                .from("cart_item")
                .select(`
                    cart_id,
                    quantity,
                    products (
                        product_id,
                        name,
                        sell_price,
                        img
                    )
                `)
                .eq('cart_id', cartData.id);

            if (itemsError) throw itemsError;
            setCartItems(itemsData);
        } catch (error) {
            alert("Lỗi lấy sản phẩm trong giỏ hàng: " + error.message);
        }
    };

    const updateQuantity = async (cart_item, quantity) => {
        try {
            const { error } = await supabase
                .from("cart_item")
                .update({ quantity: quantity })
                .eq('cart_id', cart_item.cart_id)
                .eq('product_id', cart_item.products.product_id);

            if (error) throw error;
            await fetchCartItems(user.user_id);
        } catch (error) {
            alert("Lỗi khi cập nhật số lượng: " + error.message);
        }
    };

    const handleSelectChange = (productId) => {
        setSelectedItems((prev) => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const removeProduct = async (cart_id, product_id) => {
        try {
            const { error } = await supabase
                .from("cart_item")
                .delete()
                .eq('cart_id', cart_id)
                .eq('product_id', product_id);

            if (error) throw error;
            await fetchCartItems(user.user_id);
        } catch (error) {
            alert("Lỗi khi xóa sản phẩm: " + error.message);
        }
    };

    const deleteSelectedItems = async () => {
        const itemsToDelete = cartItems.filter(item => selectedItems.includes(item.products.product_id));
        for (const item of itemsToDelete) {
            await removeProduct(item.cart_id, item.products.product_id);
        }
        setSelectedItems([]);
    };

    const selectedTotal = cartItems
        .filter(item => selectedItems.includes(item.products.product_id))
        .reduce((sum, item) => sum + item.products.sell_price * item.quantity, 0);
    const selectedItemCount = cartItems
        .filter(item => selectedItems.includes(item.products.product_id))
        .reduce((sum, item) => sum + item.quantity, 0);

    return (
        <Layout className="layout cart-layout">
            <Header />
            <Content className="cart-content">
                <div className="site-layout-content cart-site-content">
                    <h2>Giỏ hàng</h2>
                    <List
                        header={
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px' }}>
                                <Text strong style={{ width: '5%' }}></Text>
                                <Text strong style={{ width: '28%' }}>Sản phẩm</Text>
                                <Text strong style={{ width: '30%', textAlign: 'center' }}>Giá</Text>
                                <Text strong style={{ width: '22%', textAlign: 'center' }}>Số lượng</Text>
                                <Text strong style={{ width: '25%', textAlign: 'center' }}>Tổng tiền</Text>
                                <Text strong style={{ width: '20%', textAlign: 'center' }}>Hành động</Text>
                            </div>
                        }
                        itemLayout="horizontal"
                        dataSource={cartItems.sort((a, b) => a.products.product_id - b.products.product_id)}
                        loading={loading}
                        renderItem={item => (
                            <List.Item className="cart-item">
                                <Checkbox
                                    checked={selectedItems.includes(item.products.product_id)}
                                    onChange={() => handleSelectChange(item.products.product_id)}
                                />
                                <div className="cart-item-name">
                                    <List.Item.Meta
                                        avatar={<Avatar src={item.products.img[0]} shape="square" size={64} />}
                                        title={item.products.name}
                                    />
                                </div>
                                <div className="cart-item-price cart-center">
                                    {item.products.sell_price.toLocaleString('vi-VN')} VND
                                </div>
                                <div className="cart-item-quantity cart-center">
                                    <InputNumber
                                        min={1}
                                        value={item.quantity}
                                        onChange={(value) => updateQuantity(item, value)}
                                        className="quantity-input"
                                    />
                                </div>
                                <div className="cart-item-total cart-center">
                                    {(item.products.sell_price * item.quantity).toLocaleString('vi-VN')} VND
                                </div>
                                <div className="cart-item-action cart-center">
                                    <Popconfirm
                                        title="Bạn có chắc muốn xóa sản phẩm này"
                                        onConfirm={() => removeProduct(item.cart_id, item.products.product_id)}
                                        okText="Có"
                                        cancelText="Không"
                                    >
                                        <Button icon={<DeleteOutlined />} danger />
                                    </Popconfirm>
                                </div>
                            </List.Item>
                        )}
                    />

                    {/*Check xem có đang chọn sản phẩm hay k*/}
                    {selectedItems.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                            <Button onClick={deleteSelectedItems} className="delete-selected-button" danger>
                                Xóa đã chọn
                            </Button>
                        </div>
                    )}

                    <Card className="cart-total-card">
                        <Text strong>Tổng giá trị ({selectedItemCount} sản phẩm): {selectedTotal.toLocaleString('vi-VN')} VND</Text>
                        <Link to="/checkout" state={{ selectedItems: selectedItems }}> 
    <Button type="primary" size="large" className="checkout-button">
        Tiếp tục thanh toán
    </Button>
</Link>
                    </Card>
                </div>
            </Content>
            <Footer />
        </Layout>
    );
};

export default CartDetail;
