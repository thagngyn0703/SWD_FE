import React, { useState, useEffect } from "react";
import {
  Layout,
  Avatar,
  Card,
  Typography,
  Button,
  Form,
  Input,
  Table,
  Modal,
  message,
  Divider,
  Space,
  Col,
  Row,
  Descriptions,
  Select,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  LockOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { supabase } from "../supabaseClient";
import { useLocation } from "react-router-dom";
import AppHeader from "../Components/Header/Header";
import AppFooter from "../Components/Footer/Footer";
import { decoder64 } from "../Components/Base64Encoder/Base64Encoder";

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const getDecodedToken = () => {
  const token = getCookie("token");
  if (!token) return null;
  try {
    const decodedToken = decoder64(token);
    return JSON.parse(decodedToken);
  } catch (error) {
    console.error("Lỗi khi giải mã token:", error);
    return null;
  }
};

export default function Profile() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [cityOptions, setCityOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [wardOptions, setWardOptions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm(); // Form instance for profile update
  const [formPassword] = Form.useForm(); // Form instance for password change

  const user = getDecodedToken();
  const userId = user?.user_id;
  const location = useLocation();

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchOrders();
      fetchCities();
    } else {
      console.error("Không tìm thấy ID người dùng trong token");
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profileuser")
      .select("name, email, phone, address, city, district, ward")  // Include new fields
      .eq("user_id", userId)
      .single();
  
    if (error) {
      console.error("Lỗi khi lấy thông tin hồ sơ: ", error);
    } else if (data) {
      const profileData = {
        fullName: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        district: data.district || "",
        ward: data.ward || ""
      };
      setProfile(profileData);
      form.setFieldsValue(profileData); // Set initial form values
    }
    setLoading(false);
  };
  

  const fetchCities = async () => {
    try {
      const response = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await response.json();
      setCityOptions(data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchDistricts = async (cityCode) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
      const data = await response.json();
      setDistrictOptions(data.districts);
      setWardOptions([]);
      form.setFieldsValue({ district: null, ward: null });
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchWards = async (districtCode) => {
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await response.json();
      setWardOptions(data.wards);
      form.setFieldsValue({ ward: null });
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };

  const handleCityChange = (value) => {
    setSelectedCity(value);
    fetchDistricts(value);
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);
    fetchWards(value);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        total_price,
        status,
        created_at,
        address_order,
        order_status (
          status_name
        ),
        order_items (
          quantity,
          products (
            name,
            img
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  
    if (error) {
      console.error("Lỗi khi lấy lịch sử đơn hàng: ", error);
    } else {
      const formattedOrders = data.map((order) => ({
        key: order.id,
        id: order.id,
        total_price: order.total_price.toLocaleString("vi-VN") + " VND",
        status: order.order_status.status_name, // Now using the status name instead of ID
        created_at: new Date(order.created_at).toLocaleString("vi-VN"),
        address_order: order.address_order,
        items: order.order_items.map((item) => ({
          product_name: item.products.name,
          quantity: item.quantity,
          img: item.products.img && item.products.img[0],
        })),
      }));
      setOrders(formattedOrders);
    }
    setLoading(false);
  };

  const updateProfile = async (values) => {
    const cityName = cityOptions.find(city => city.code === values.city)?.name || "";
    const districtName = districtOptions.find(district => district.code === values.district)?.name || "";
  
    console.log("Storing city name:", cityName);
    console.log("Storing district name:", districtName);
  
    const { error } = await supabase
      .from("profileuser")
      .update({
        name: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        city: cityName,          // Store city name instead of code
        district: districtName,   // Store district name instead of code
        ward: values.ward         // Store the ward name directly
      })
      .eq("user_id", userId);
  
    if (error) {
      console.error("Error updating profile:", error);
      message.error("Lỗi khi cập nhật hồ sơ");
    } else {
      message.success("Cập nhật hồ sơ thành công");
      setProfile({
        ...values,
        city: cityName,
        district: districtName
      });
      setIsEditing(false);
    }
  };
  
  
  

  const updatePassword = async (values) => {
    const { data, error } = await supabase
      .from("account")
      .select("password")
      .eq("user_id", userId)
      .eq("password", values.currentPassword)
      .single();

    if (!data || error) {
      message.error("Mật khẩu hiện tại không chính xác");
      return;
    }

    const { error: updateError } = await supabase
      .from("account")
      .update({ password: values.newPassword })
      .eq("user_id", userId);

    if (updateError) {
      message.error("Lỗi khi cập nhật mật khẩu");
    } else {
      message.success("Đổi mật khẩu thành công");
      formPassword.resetFields();
      setIsPasswordModalVisible(false);
    }
  };

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Tổng giá",
      dataIndex: "total_price",
      key: "total_price",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "Địa chỉ giao hàng",
      dataIndex: "address_order",
      key: "address_order",
    },
  ];

  const expandedRowRender = (record) => {
    const itemColumns = [
      {
        title: "Ảnh sản phẩm",
        dataIndex: "img",
        key: "img",
        render: (img) => <Avatar src={img} shape="square" size={64} />,
      },
      { title: "Tên sản phẩm", dataIndex: "product_name", key: "product_name" },
      { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    ];
    return (
      <Table
        columns={itemColumns}
        dataSource={record.items}
        pagination={false}
      />
    );
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <AppHeader />
      <Content style={{ padding: "40px 50px" }}>
        <Card
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          <Form form={form} layout="vertical" onFinish={updateProfile}> {/* Connect form instance */}
            <Row gutter={16}>
              <Col xs={24} sm={8} style={{ textAlign: "center" }}>
                <Avatar size={120} icon={<UserOutlined />} />
              </Col>
              <Col xs={24} sm={16}>
                <Title level={3}>{profile.fullName || "Người dùng"}</Title>
                <Divider />
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Họ và tên">
                    {isEditing ? (
                      <Form.Item name="fullName" style={{ marginBottom: 0 }}>
                        <Input prefix={<UserOutlined />} />
                      </Form.Item>
                    ) : (
                      profile.fullName
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {isEditing ? (
                      <Form.Item
                        name="email"
                        style={{ marginBottom: 0 }}
                        rules={[{ type: "email", message: "Vui lòng nhập email hợp lệ!" }]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    ) : (
                      profile.email
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {isEditing ? (
                      <Form.Item name="phone" style={{ marginBottom: 0 }}>
                        <Input prefix={<PhoneOutlined />}  disabled/>
                      </Form.Item>
                    ) : (
                      profile.phone
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">
                    {isEditing ? (
                      <>
                        <Form.Item name="city" label="Tỉnh/Thành phố" style={{ marginBottom: 8 }}>
                          <Select
                            placeholder="Chọn tỉnh/thành phố"
                            onChange={handleCityChange}
                            showSearch
                            optionFilterProp="children"
                          >
                            {cityOptions.map(city => (
                              <Option key={city.code} value={city.code}>
                                {city.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item name="district" label="Quận/Huyện" style={{ marginBottom: 8 }}>
                          <Select
                            placeholder="Chọn quận/huyện"
                            onChange={handleDistrictChange}
                            disabled={!selectedCity}
                            showSearch
                            optionFilterProp="children"
                          >
                            {districtOptions.map(district => (
                              <Option key={district.code} value={district.code}>
                                {district.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item name="ward" label="Phường/Xã">
                          <Select
                            placeholder="Chọn phường/xã"
                            disabled={!selectedDistrict}
                            showSearch
                            optionFilterProp="children"
                          >
                            {wardOptions.map(ward => (
                              <Option key={ward.code} value={ward.name}>
                                {ward.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item name="address" label="Địa chỉ cụ thể">
                          <Input.TextArea placeholder="Số nhà, tên đường..." rows={2} />
                        </Form.Item>
                      </>
                    ) : (
                      profile.address
                    )}
                  </Descriptions.Item>
                </Descriptions>
                <Space style={{ marginTop: 16 }}>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Hủy" : "Chỉnh sửa"}
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => setIsPasswordModalVisible(true)}
                  >
                    Đổi mật khẩu
                  </Button>
                  {isEditing && (
                    <Button
                      type="primary"
                      htmlType="submit"
                    >
                      Cập nhật hồ sơ
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          style={{
            marginTop: 24,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          }}
        >
          <Title level={4}>Lịch sử đơn hàng</Title>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            expandable={{ expandedRowRender }}
          />
        </Card>

        <Modal
          title="Đổi mật khẩu"
          open={isPasswordModalVisible}
          onCancel={() => setIsPasswordModalVisible(false)}
          footer={null}
        >
          <Form layout="vertical" form={formPassword} onFinish={updatePassword}> {/* Connect formPassword instance */}
            <Form.Item
              name="currentPassword"
              label="Mật khẩu hiện tại"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
                { pattern: /^(?=.*[A-Z])(?=.*\d).+$/, message: "Mật khẩu phải chứa ít nhất một chữ hoa và một chữ số!" },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Hai mật khẩu không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
      <AppFooter />
    </Layout>
  );
}
