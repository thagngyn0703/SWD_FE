import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '../supabaseClient';
import { encoder64 } from '../Components/Base64Encoder/Base64Encoder';
import AppHeader from '../Components/Header/Header';
import AppFooter from '../Components/Footer/Footer';
import './CSS/Log.css';

const { Title } = Typography;
const { Content } = Layout;

const SlidingAuthForm = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const toggleForm = () => {
    setIsLogin(!isLogin);
    loginForm.resetFields();
    registerForm.resetFields();
  };

  const handleSubmit = async (values) => {
    const { phone, password, confirmPassword } = values;

    if (!isLogin) {
      if (password !== confirmPassword) {
        message.error('Mật khẩu không trùng!');
        return;
      }

      const { error: insertError } = await supabase.from('account').insert([
        {
          user_name: phone,
          password: password,
          role_id: 1, // Default role (as 'User')
        },
      ]);

      if (insertError) {
        message.error(`Số điện thoại đã tồn tại trong hệ thống`);
      } else {
        message.success('Đăng kí thành công');
        setIsLogin(true);
      }
    } else {
      const { data, error: fetchError } = await supabase
        .from('account')
        .select('*')
        .eq('user_name', phone)
        .eq('password', password);

      if (fetchError) {
        message.error(`Error fetching user: ${fetchError.message}`);
        return;
      }

      if (data && data.length > 0 && data[0].role_id === 1) {
        message.success('Đăng nhập thành công');
        const user = data[0];
        const tokenData = { user_id: user.user_id, role_id: user.role_id };
        const encodedToken = encoder64(JSON.stringify(tokenData));
        localStorage.setItem('isLoggedIn', 'true');

        const { data: profileData, error: profileError } = await supabase
          .from('profileuser')
          .select('name, address')
          .eq('user_id', user.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profileData && profileData.address === '') {
          window.location.href = '/profile';
        } else {
          window.location.href = '/';
        }

        document.cookie = `token=${encodedToken}; expires=${new Date(
          new Date().getTime() + 60 * 60 * 1000 // 1 hour expiry
        ).toUTCString()}; path=/; samesite=strict; secure`;

        if (user.role_id === 2) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/';
        }
      } else {
        message.error('Số điện thoại hoặc mật khẩu không hợp lệ!');
      }
    }
  };

  return (
    <Layout>
      <AppHeader />
      <Content>
        <div className="auth-wrapper">
          <div className={`container ${isLogin ? '' : 'right-panel-active'}`}>
            <div className="form-container sign-up-container">
              <div>
                <Title level={2}>Đăng ký</Title>
                <Form
                  form={registerForm}
                  name="register-form"
                  onFinish={handleSubmit}
                  layout="vertical"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: 'Nhập số điện thoại của bạn!' },
                      { pattern: /^0[0-9]{9}$/, message: 'Hãy nhập số điện thoại hợp lệ!' },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Số điện thoại" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Hãy nhập mật khẩu!' },
                      { pattern: /^(?=.*[A-Za-z])[A-Za-z\d@$!%*#?&]{8,}$/, message: 'Hãy điền tối thiểu 8 ký tự bao gồm chữ cái, số và kí tự đặc biệt' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Hãy nhập mật khẩu xác nhận!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu không khớp!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" className="form-button">
                      Đăng ký
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </div>
            <div className="form-container sign-in-container">
              <div>
                <Title level={2}>Đăng nhập</Title>
                <Form
                  form={loginForm}
                  name="login-form"
                  onFinish={handleSubmit}
                  layout="vertical"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: 'Nhập số điện thoại của bạn!' },
                      { pattern: /^0[0-9]{9}$/, message: 'Hãy nhập số điện thoại hợp lệ!' },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Số điện thoại" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Hãy nhập mật khẩu!' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" className="form-button">
                      Đăng nhập
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </div>
            <div className="overlay-container">
              <div className="overlay">
                <div className="overlay-panel overlay-left">
                  <Title level={2}>Chào mừng trở lại!</Title>
                  <p>Để giữ kết nối với chúng tôi, vui lòng đăng nhập.</p>
                  <Button ghost onClick={toggleForm}>
                    Đăng nhập
                  </Button>
                </div>
                <div className="overlay-panel overlay-right">
                  <Title level={2}>Chào mừng bạn!</Title>
                  <p>Để kết nối với chúng tôi, vui lòng đăng ký tài khoản.</p>
                  <Button ghost onClick={toggleForm}>
                    Đăng ký
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Content>
      <AppFooter />
    </Layout>
  );
};

export default SlidingAuthForm;