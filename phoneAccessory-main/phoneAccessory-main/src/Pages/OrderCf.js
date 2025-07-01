import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout, Card, Typography, Button, Divider, Result } from 'antd';
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { SmileOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId, orderTotal, shippingInfo } = location.state || {};

    // Redirect back to the homepage or order history if no order data is available
    if (!orderId) {
        navigate('/');
        return null;
    }

    return (
        <Layout className="layout" style={{ minHeight: "100vh", backgroundColor: '#f0f2f5' }}>
            <Header />
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Card 
                    bordered={false} 
                    style={{
                        maxWidth: 600,
                        textAlign: 'center',
                        padding: '40px 20px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        background: '#fff',
                    }}
                >
                    <Result
                        icon={<SmileOutlined style={{ color: '#52c41a' }} />}
                        title="Đơn hàng của bạn đã được đặt thành công!"
                        subTitle={`Mã đơn hàng: #${orderId}`}
                        status="success"
                    />
                    <Divider />
                    <Title level={4} style={{ color: '#1890ff' }}>Thông tin đơn hàng</Title>
                    <Text style={{ fontSize: '18px', color: '#333' }}>
                        Tổng thanh toán: <Text strong style={{ color: '#ff4d4f' }}>{orderTotal.toLocaleString('vi-VN')} VND</Text>
                    </Text>
                    <Divider />
                    <Title level={4} style={{ color: '#1890ff' }}>Thông tin giao hàng</Title>
                    <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: '75%' }}>
                        <Text strong>Họ và tên:</Text> <Text>{shippingInfo?.name}</Text>
                        <br />
                        <Text strong>Số điện thoại:</Text> <Text>{shippingInfo?.phone}</Text>
                        <br />
                        <Text strong>Địa chỉ:</Text> <Text>{shippingInfo?.address}, {shippingInfo?.ward}, {shippingInfo?.district}, {shippingInfo?.city}</Text>
                    </div>
                    <Divider />
                    <Button 
                        type="primary" 
                        size="large" 
                        style={{ width: '100%', marginTop: '20px', backgroundColor: '#20c35a', borderColor: '#52c41a' }}
                        onClick={() => navigate('/profile')}
                    >
                        Kiểm tra đơn hàng
                    </Button>
                    <Button 
                        type="primary" 
                        size="large" 
                        style={{ width: '100%', marginTop: '20px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => navigate('/')}
                    >
                        Quay về trang chủ
                    </Button>
                </Card>
            </Content>
            <Footer />
        </Layout>
    );
};

export default OrderConfirmation;
