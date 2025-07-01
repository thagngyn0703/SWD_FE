import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Select } from 'antd';
import { UserOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';
import { supabase } from '../supabaseClient';
import { encoder64 } from '../Components/Base64Encoder/Base64Encoder';
import './CSS/AdminAuth.css';

const { Title } = Typography;
const { Option } = Select;

const STATIC_SECRET_KEY = "a1b2c3d4e5f6";

const AuthPortal = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [selectedRole, setSelectedRole] = useState('seller');
    const [form] = Form.useForm();

    const handleRoleChange = (value) => {
        setSelectedRole(value);
    };

    const handleSubmit = async (values) => {
        const { phone, password } = values;
        const roleId = selectedRole === 'admin' ? 2 : 3;

        const { data, error: fetchError } = await supabase
            .from('account')
            .select('*')
            .eq('user_name', phone)
            .eq('password', password)
            .eq('role_id', roleId);

        if (fetchError) {
            message.error(`Lỗi truy vấn cơ sở dữ liệu: ${fetchError.message}`);
            return;
        }

        if (data.length > 0) {
            message.success('Đăng nhập thành công!');
            const user = data[0];
            const tokenData = { user_id: user.user_id, role_id: user.role_id };

            const encodedToken = encoder64(JSON.stringify(tokenData));
            document.cookie = `token=${encodedToken}; expires=${new Date(
                new Date().getTime() + 60 * 60 * 1000 // Hết trong 1 giờ
            ).toUTCString()}; path=/; samesite=strict; secure`;

            window.location.href = selectedRole === 'admin' ? '/dashboard' : '/SellerDashboard';
        } else {
            message.error('Sai thông tin đăng nhập');
        }
    };

    const handleChangePasswordSubmit = async (values) => {
        const { phone, oldPassword, newPassword, confirmNewPassword, secretKey } = values;

        if (newPassword !== confirmNewPassword) {
            message.error('Mật khẩu mới và mật khẩu xác nhận không khớp!');
            return;
        }

        if (selectedRole === 'admin' && secretKey !== STATIC_SECRET_KEY) {
            message.error('Mã Admin không hợp lệ!');
            return;
        }

        const roleId = selectedRole === 'admin' ? 2 : 3;
        const queryCondition = selectedRole === 'admin'
            ? { role_id: roleId }
            : { user_name: phone, password: oldPassword, role_id: roleId };

        const { data, error: fetchError } = await supabase
            .from('account')
            .select('*')
            .match(queryCondition);

        if (fetchError || data.length === 0) {
            message.error('Mật khẩu cũ hoặc tài khoản không tồn tại!');
            return;
        }

        const { error: updateError } = await supabase
            .from('account')
            .update({ password: newPassword })
            .match({ user_name: phone, role_id: roleId });

        if (updateError) {
            message.error(`Error updating password: ${updateError.message}`);
        } else {
            message.success('Thay đổi mật khẩu thành công!');
            setIsLogin(true);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <Title level={2} className="auth-title">
                    {isLogin ? 'Đăng nhập' : 'Đổi mật khẩu'}
                </Title>

                <Form
                    form={form}
                    name={isLogin ? 'auth-form' : 'change-password-form'}
                    onFinish={isLogin ? handleSubmit : handleChangePasswordSubmit}
                    layout="vertical"
                    className="auth-form"
                    initialValues={{ role: selectedRole }}
                >
                    <Form.Item
                        name="role"
                        label="Bạn là"
                        rules={[{ required: true, message: 'Hãy chọn vai trò của bạn!' }]}
                    >
                        <Select
                            value={selectedRole}
                            onChange={handleRoleChange}
                            disabled={!isLogin}>
                            <Option value="seller">Người Bán</Option>
                            <Option value="admin">Quản trị</Option>
                        </Select>
                    </Form.Item>

                    {isLogin ? (
                        <>
                            <Form.Item
                                name="phone"
                                rules={[
                                    { required: true, message: 'Hãy nhập số điện thoại của bạn!' },
                                    { pattern: /^0\d{9}$/, message: 'Hãy nhập số điện thoại hợp lệ!' },
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined className="auth-icon" />}
                                    placeholder="Số điện thoại"
                                    className="auth-input"
                                />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                rules={[
                                    {
                                        required: true, message: 'Hãy nhập mật khẩu của bạn!',
                                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                        message: 'Hãy điền tối thiểu 8 ký tự bao gồm tối thiểu 1 chữ cái thường, chữ cái in hoa, số và kí tự đặc biệt!'
                                    }
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="auth-icon" />}
                                    placeholder="Mật khẩu"
                                    className="auth-input"
                                />
                            </Form.Item>
                        </>
                    ) : (
                        <>
                            {selectedRole === 'admin' && (
                                <Form.Item
                                    name="secretKey"
                                    rules={[{ required: true, message: 'Hãy nhập mã Admin!' }]}>
                                    <Input
                                        prefix={<KeyOutlined className="auth-icon" />}
                                        placeholder="Mã Admin"
                                        className="auth-input"
                                    />
                                </Form.Item>
                            )}
                            {selectedRole === 'seller' && (
                                <Form.Item
                                    name="phone"
                                    rules={[{ required: true, message: 'Hãy nhập số điện thoại!' }]}>
                                    <Input
                                        prefix={<UserOutlined className="auth-icon" />}
                                        placeholder="Số điện thoại"
                                        className="auth-input"
                                    />
                                </Form.Item>
                            )}
                            {selectedRole === 'seller' && (
                                <Form.Item
                                    name="oldPassword"
                                    rules={[{ required: true, message: 'Hãy nhập mật khẩu hiện tại!' }]}>
                                    <Input.Password
                                        prefix={<LockOutlined className="auth-icon" />}
                                        placeholder="Mật khẩu hiện tại"
                                        className="auth-input"
                                    />
                                </Form.Item>
                            )}
                            <Form.Item
                                name="newPassword"
                                rules={[
                                    {
                                        required: true, message: 'Hãy nhập mật khẩu!',
                                        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                                        message: 'Hãy điền tối thiểu 8 ký tự bao gồm tối thiểu 1 chữ cái thường, chữ cái in hoa, số và kí tự đặc biệt!'
                                    }
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="auth-icon" />}
                                    placeholder="Mật khẩu"
                                    className="auth-input"
                                />
                            </Form.Item>
                            <Form.Item
                                name="confirmNewPassword"
                                rules={[{ required: true, message: 'Hãy nhập mật khẩu xác nhận!' }]}>
                                <Input.Password
                                    prefix={<LockOutlined className="auth-icon" />}
                                    placeholder="Xác nhận mật khẩu"
                                    className="auth-input"
                                />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="auth-button">
                            {isLogin ? 'Đăng nhập' : 'Đổi mật khẩu'}
                        </Button>
                        <Button
                            type="default"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                form.resetFields();
                            }}
                            className="toggle-auth-button"
                        >
                            {isLogin ? 'Đổi mật khẩu?' : 'Quay lại đăng nhập'}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default AuthPortal;
