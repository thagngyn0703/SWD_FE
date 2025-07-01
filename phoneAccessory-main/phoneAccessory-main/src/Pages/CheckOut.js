import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  Layout,
  Card,
  Typography,
  Button,
  Input,
  Form,
  Avatar,
  Row,
  Col,
  Divider,
  Select,
  Radio,
} from "antd";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header/Header";
import Footer from "../Components/Footer/Footer";
import { decoder64 } from "../Components/Base64Encoder/Base64Encoder";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css"; // Import toast styles
import { toast, ToastContainer } from "react-toastify";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Checkout = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedItems = location.state?.selectedItems || [];
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [form] = Form.useForm();
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash"); // New state for payment method

  useEffect(() => {
    fetchUserAndCart();
    fetchProvinces();
  }, []);
  useEffect(() => {
    // Reset districts and wards when switching between new and default addresses
    if (useNewAddress) {
      setDistricts([]);
      setWards([]);
      setSelectedProvince(null);
      setSelectedDistrict(null);
      form.resetFields(["city", "district", "ward", "address"]);
    } else {
      form.setFieldsValue({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        city: provinces.find((p) => p.name === profileData.city)?.code,
        district: districts.find((d) => d.name === profileData.district)?.code,
        ward: profileData.ward,
      });
    }
  }, [useNewAddress]);
  useEffect(() => {
    const calculatedTotal = cartItems.reduce(
      (acc, item) => acc + item.quantity * item.products.sell_price,
      0
    );
    setTotal(calculatedTotal);

    // Tính phí vận chuyển
    let calculatedShippingFee = 0;
    if (calculatedTotal < 100000) {
      calculatedShippingFee = 50000;
    } else if (calculatedTotal < 200000) {
      calculatedShippingFee = 30000;
    }
    setShippingFee(calculatedShippingFee);
  }, [cartItems]);
  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      const response = await fetch("https://provinces.open-api.vn/api/p/");
      const data = await response.json();
      setProvinces(data);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  // Fetch districts when province changes
  const fetchDistricts = async (provinceCode) => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      const data = await response.json();
      setDistricts(data.districts);
      setWards([]); // Clear wards when district changes
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchWards = async (districtCode) => {
    try {
      const response = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data = await response.json();
      setWards(data.wards);
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };
  const handleProvinceChange = async (value, option) => {
    setSelectedProvince(option.children);
    form.setFieldsValue({
      district: undefined,
      ward: undefined,
    });
    await fetchDistricts(value);
  };

  const handleDistrictChange = async (value, option) => {
    setSelectedDistrict(option.children);
    form.setFieldsValue({
      ward: undefined,
    });
    await fetchWards(value);
  };
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  const fetchUserAndCart = async () => {
    try {
      console.log("Starting fetchUserAndCart...");

      const token = getCookie("token");
      if (token) {
        const decodedUser = JSON.parse(decoder64(token));
        console.log("Decoded user:", decodedUser);
        setUser(decodedUser);

        // Fetch profile data from the database
        const { data: profileData, error: profileError } = await supabase
          .from("profileuser")
          .select("name, phone, address, city, district, ward")
          .eq("user_id", decodedUser.user_id)
          .single();
        if (
          !profileData.address ||
          !profileData.city ||
          !profileData.district ||
          !profileData.ward
        ) {
          toast.info(
            "Vui lòng cập nhật thông tin địa chỉ của bạn để tiến hành đặt hàng.",
            {
              position: "top-center",
              onClose: () => navigate("/profile"),
            }
          );
          return;
        }
        if (profileError) {
          console.error("Profile Fetch Error:", profileError);
          return;
        }

        console.log("Profile data fetched:", profileData);

        // Fetch provinces first
        const provincesResponse = await fetch(
          "https://provinces.open-api.vn/api/p/"
        );
        const provincesData = await provincesResponse.json();
        setProvinces(provincesData);

        // Find province code
        const province = provincesData.find((p) => p.name === profileData.city);
        if (province) {
          // Fetch districts for the province
          const districtsResponse = await fetch(
            `https://provinces.open-api.vn/api/p/${province.code}?depth=2`
          );
          const districtData = await districtsResponse.json();
          setDistricts(districtData.districts);

          // Find district code
          const district = districtData.districts.find(
            (d) => d.name === profileData.district
          );
          if (district) {
            // Fetch wards for the district
            const wardsResponse = await fetch(
              `https://provinces.open-api.vn/api/d/${district.code}?depth=2`
            );
            const wardData = await wardsResponse.json();
            setWards(wardData.wards);
          }

          // Set selected province and district
          setSelectedProvince(profileData.city);
          setSelectedDistrict(profileData.district);

          // Update form with the correct values
          form.setFieldsValue({
            name: profileData.name,
            phone: profileData.phone,
            address: profileData.address,
            city: province.code,
            district: district?.code,
            ward: profileData.ward,
          });
        }

        // Set profile data
        setProfileData({
          ...profileData,
          city: profileData.city,
          district: profileData.district,
          ward: profileData.ward,
        });

        // Fetch cart data if cart is empty
        if (cartItems.length === 0) {
          const { data: cartData, error: cartError } = await supabase
            .from("cart")
            .select("id")
            .eq("user_id", decodedUser.user_id)
            .single();

          if (cartError) {
            console.error("Cart Fetch Error:", cartError);
            return;
          }

          if (cartData) {
            const { data: cartItemsData, error: cartItemsError } =
              await supabase
                .from("cart_item")
                .select(
                  `
                            quantity,
                            products (
                                product_id,
                                name,
                                sell_price,
                                img
                            )
                        `
                )
                .eq("cart_id", cartData.id);

            // Filter cart items based on selectedItems
            const filteredCartItems = cartItemsData.filter((item) =>
              selectedItems.includes(item.products.product_id)
            );

            if (cartItemsError) {
              console.error("Cart Items Fetch Error:", cartItemsError);
              return;
            }

            if (filteredCartItems && filteredCartItems.length > 0) {
              setCartItems(filteredCartItems);
              const totalAmount = filteredCartItems.reduce(
                (acc, item) => acc + item.quantity * item.products.sell_price,
                0
              );
              setTotal(totalAmount);
            }
          }
        }
      }
    } catch (error) {
      console.error("Unexpected Error:", error);
      alert("Lỗi khi lấy thông tin người dùng và giỏ hàng: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (values) => {
    try {
      if (paymentMethod === "vnpay") {
        toast.info("Hình thức thanh toán qua VNPAY đang phát triển.");
        return;
      } else if (!cartItems || cartItems.length === 0) {
        alert("Giỏ hàng của bạn đang trống!");
        return;
      }

      let shippingInfo;
      if (!useNewAddress) {
        // Use default address
        shippingInfo = {
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          district: profileData.district,
          ward: profileData.ward,
        };
      } else {
        // Use new address from form
        const selectedCity = provinces.find(
          (p) => p.code === values.city
        )?.name;
        const selectedDistrict = districts.find(
          (d) => d.code === values.district
        )?.name;

        shippingInfo = {
          name: values.name,
          phone: values.phone,
          address: values.address,
          city: selectedCity,
          district: selectedDistrict,
          ward: values.ward,
        };
      }

      // Tính tổng giá trị đơn hàng bao gồm cả phí vận chuyển
      const totalWithShipping = total + shippingFee;

      const vietnamTime = new Date();
      vietnamTime.setHours(
        vietnamTime.getHours() + 7 - vietnamTime.getTimezoneOffset() / 60
      );

      const orderInsertData = {
        user_id: user.user_id,
        total_price: totalWithShipping,
        status: 1,
        address_order: `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.city}`,
        created_at: vietnamTime.toISOString(),
      };

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(orderInsertData)
        .select()
        .single();

      if (orderError) {
        console.error("Order Error Details:", orderError);
        alert(`Lỗi khi tạo đơn hàng: ${orderError.message}`);
        return;
      }

      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.products.product_id,
        quantity: parseInt(item.quantity),
      }));

      const { error: orderItemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) {
        await supabase.from("orders").delete().eq("id", orderData.id);
        alert("Lỗi khi lưu chi tiết đơn hàng!");
        return;
      }

      // Chỉ xóa các sản phẩm đã chọn khỏi giỏ hàng
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("id")
        .eq("user_id", user.user_id)
        .single();

      if (cartError) {
        console.error("Error fetching cart data:", cartError);
        return;
      }

      if (cartData && selectedItems.length > 0) {
        const { error: clearCartError } = await supabase
          .from("cart_item")
          .delete()
          .in("product_id", selectedItems) // Use selectedItems directly
          .eq("cart_id", cartData.id);

        if (clearCartError) throw clearCartError;
      }

      toast.success("Đặt hàng thành công!");
      navigate("/order-confirmation", {
        state: {
          orderId: orderData.id,
          orderTotal: totalWithShipping,
          shippingInfo,
        },
      });
      for (const item of cartItems) {
        // Lấy số lượng tồn kho hiện tại của sản phẩm
        const { data: productData, error: fetchError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("product_id", item.products.product_id)
          .single();

        if (fetchError) {
          console.error("Error fetching product stock quantity:", fetchError);
          alert("Lỗi khi lấy thông tin tồn kho sản phẩm.");
          return;
        }

        const newStockQuantity = productData.stock_quantity - item.quantity;

        if (newStockQuantity < 0) {
          alert(`Sản phẩm ${item.products.name} không đủ hàng tồn kho.`);
          return;
        }

        // Cập nhật số lượng hàng
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: newStockQuantity })
          .eq("product_id", item.products.product_id);

        if (updateError) {
          console.error("Stock Update Error:", updateError);
          alert("Lỗi khi cập nhật tồn kho sản phẩm.");
          return;
        }
      }
    } catch (error) {
      console.error("Unexpected Error:", error);
      alert(
        "Lỗi khi đặt hàng: " + (error.message || "Đã xảy ra lỗi không xác định")
      );
    }
  };
  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    if (e.target.value === "vnpay") {
      toast.info("Hình thức thanh toán qua VNPAY đang phát triển.");
    }
  };
  const handleAddressTypeChange = (e) => {
    setUseNewAddress(e.target.value === "new");
    if (e.target.value === "default") {
      // Reset form to default profile values
      form.setFieldsValue({
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        city: provinces.find((p) => p.name === profileData.city)?.code,
        district: districts.find((d) => d.name === profileData.district)?.code,
        ward: profileData.ward,
      });
    } else {
      // Clear form for new address
      form.resetFields();
    }
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <Layout className="layout" style={{ minHeight: "100vh" }}>
      <ToastContainer />
      <Header />
      <Content style={{ padding: "0 50px", marginTop: 64 }}>
        <div
          className="site-layout-content"
          style={{ background: "#fff", padding: 24, minHeight: 380 }}
        >
          <Title
            level={2}
            style={{ textAlign: "center", marginBottom: "40px" }}
          >
            Thanh toán
          </Title>
          <Row gutter={32}>
            <Col xs={24} md={12}>
              <Card bordered={false}>
                <Title level={4}>Thông tin người nhận</Title>
                <Divider />

                <Radio.Group
                  onChange={handleAddressTypeChange}
                  value={useNewAddress ? "new" : "default"}
                  style={{ marginBottom: "20px" }}
                >
                  <Radio value="default">Sử dụng địa chỉ mặc định</Radio>
                  <Radio value="new">Sử dụng địa chỉ mới</Radio>
                </Radio.Group>

                {!useNewAddress ? (
                  <div className="default-address-info">
                    <p>
                      <strong>Họ và tên:</strong> {profileData.name}
                    </p>
                    <p>
                      <strong>Số điện thoại:</strong> {profileData.phone}
                    </p>
                    <p>
                      <strong>Địa chỉ:</strong> {profileData.address}
                    </p>
                    <p>
                      <strong>Tỉnh/Thành phố:</strong> {profileData.city}
                    </p>
                    <p>
                      <strong>Quận/Huyện:</strong> {profileData.district}
                    </p>
                    <p>
                      <strong>Phường/Xã:</strong> {profileData.ward}
                    </p>
                  </div>
                ) : (
                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handlePlaceOrder}
                  >
                    <Form.Item
                      label="Họ và tên"
                      name="name"
                      rules={[
                        { required: true, message: "Vui lòng nhập họ tên" },
                      ]}
                    >
                      <Input placeholder="Nhập họ và tên" />
                    </Form.Item>

                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số điện thoại",
                        },
                        {
                          pattern: /^[0-9]{10}$/,
                          message: "Số điện thoại không hợp lệ",
                        },
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại" />
                    </Form.Item>

                    <Form.Item
                      label="Tỉnh/Thành phố"
                      name="city"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn tỉnh/thành phố",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Chọn tỉnh/thành phố"
                        onChange={handleProvinceChange}
                        showSearch
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {provinces.map((province) => (
                          <Option key={province.code} value={province.code}>
                            {province.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Quận/Huyện"
                      name="district"
                      rules={[
                        { required: true, message: "Vui lòng chọn quận/huyện" },
                      ]}
                    >
                      <Select
                        placeholder="Chọn quận/huyện"
                        onChange={handleDistrictChange}
                        showSearch
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {districts.map((district) => (
                          <Option key={district.code} value={district.code}>
                            {district.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Phường/Xã"
                      name="ward"
                      rules={[
                        { required: true, message: "Vui lòng chọn phường/xã" },
                      ]}
                    >
                      <Select
                        placeholder="Chọn phường/xã"
                        showSearch
                        filterOption={(input, option) =>
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {wards.map((ward) => (
                          <Option key={ward.code} value={ward.name}>
                            {ward.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Địa chỉ cụ thể"
                      name="address"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập địa chỉ cụ thể",
                        },
                      ]}
                    >
                      <Input.TextArea
                        placeholder="Số nhà, tên đường..."
                        rows={3}
                      />
                    </Form.Item>
                  </Form>
                )}
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card bordered={false} style={{ marginBottom: "24px" }}>
                <Title level={4}>Sản phẩm</Title>
                <Divider />
                {cartItems.length > 0 ? (
                  <ul style={{ padding: 0, listStyle: "none" }}>
                    {cartItems.map((item, index) => (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <Avatar
                          src={item.products.img[0]}
                          shape="square"
                          size={80}
                          style={{ marginRight: "16px" }}
                        />
                        <div>
                          <Text strong>{item.products.name}</Text>
                          <br />
                          <Text>
                            {item.quantity} x{" "}
                            {item.products.sell_price.toLocaleString("vi-VN")}{" "}
                            VND
                          </Text>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text>Giỏ hàng trống</Text>
                )}
                <Divider />

                <Title level={4}>Hình thức thanh toán</Title>
                <Radio.Group
                  onChange={handlePaymentMethodChange}
                  value={paymentMethod}
                  style={{ marginBottom: "20px" }}
                >
                  <Radio value="cash">Thanh toán khi nhận hàng</Radio>
                  <Radio value="vnpay" disabled>
                    Thanh toán qua VNPAY (đang phát triển)
                  </Radio>
                </Radio.Group>
                <Divider />
                <Text strong style={{ fontSize: "16px" }}>
                  Phí vận chuyển:{" "}
                  {shippingFee > 0
                    ? `${shippingFee.toLocaleString("vi-VN")} VND`
                    : "Miễn phí"}
                </Text>
                <br />
                <Text strong style={{ fontSize: "20px" }}>
                  Tổng thanh toán:{" "}
                  <span style={{ color: "red" }}>
                    {(total + shippingFee).toLocaleString("vi-VN")}
                  </span>{" "}
                  VND
                </Text>
                <Button
                  onClick={() =>
                    useNewAddress ? form.submit() : handlePlaceOrder({})
                  }
                  style={{ width: "100%", marginTop: "16px",backgroundColor: 'rgb(48, 47, 47)', color: '#fff' }}
                  size="large"
                >
                  Đặt hàng
                </Button>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default Checkout;
