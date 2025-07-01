import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Select, Modal, Descriptions } from "antd";
import { supabase } from "../supabaseClient";

const { Option } = Select;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        total_price,
        created_at,
        address_order,
        status,
        profileuser(name, email, phone),
        order_items(product_id, quantity, products(name, sell_price)),
        order_status:status(status_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Lỗi khi lấy dữ liệu đơn hàng từ Supabase:", error);
    } else {
      setOrders(data);
      setFilteredOrders(data);
    }
    setLoading(false);
  };

  const handleStatusFilter = (status) => {
    setOrderStatus(status);
    if (status) {
      setFilteredOrders(orders.filter(order => order.order_status?.status_name === status));
    } else {
      setFilteredOrders(orders); // Show all orders if no status is selected
    }
  };

  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setModalVisible(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const columns = [
    {
      title: "Mã Đơn Hàng",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Tên Khách Hàng",
      dataIndex: ["profileuser", "name"],
      key: "customer_name",
      render: (text, record) =>
        record.profileuser ? record.profileuser.name : "N/A",
    },
    {
      title: "Số Tiền (₫)",
      dataIndex: "total_price",
      key: "total_price",
      render: (value) =>
        value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
    },
    {
      title: "Trạng Thái",
      dataIndex: ["order_status", "status_name"],
      key: "status_name",
      render: (statusName) => {
        let color = "blue";
        if (statusName === "Completed") color = "green";
        else if (statusName === "Pending") color = "orange";
        else if (statusName === "Cancelled") color = "red";
        return <Tag color={color}>{statusName?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Ngày Đặt Hàng",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => formatDate(date),
    },
    {
      title: "Xem Chi Tiết",
      key: "action",
      render: (text, record) => (
        <Button type="link" onClick={() => showOrderDetails(record)}>
          Chi Tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Quản Lý Đơn Hàng</h2>

      {/* Filter by Status */}
      <div style={{ marginBottom: "20px" }}>
        <Select
          placeholder="Lọc theo trạng thái"
          value={orderStatus}
          onChange={handleStatusFilter}
          style={{ width: 200 }}
        >
          <Option value={null}>Tất cả</Option>
          <Option value="Chờ duyệt">Chờ duyệt</Option>
          <Option value="Đang xử lí">Đang xử lí</Option>
          <Option value="Hoàn thành">Hoàn thành</Option>
          <Option value="Hủy">Hủy</Option>
        </Select>
      </div>

      {/* Order Table */}
      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Order Details Modal */}
      <Modal
        title="Chi Tiết Đơn Hàng"
        visible={modalVisible}
        onCancel={closeOrderDetails}
        footer={null}
      >
        {selectedOrder && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã Đơn Hàng">
              {selectedOrder.id}
            </Descriptions.Item>
            <Descriptions.Item label="Tên Khách Hàng">
              {selectedOrder.profileuser?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedOrder.profileuser?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Số Điện Thoại">
              {selectedOrder.profileuser?.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Địa Chỉ">
              {selectedOrder.address_order}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày Đặt Hàng">
              {formatDate(selectedOrder.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng Số Tiền">
              {selectedOrder.total_price.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng Thái">
              <Tag
                color={
                  selectedOrder.order_status?.status_name === "Completed"
                    ? "green"
                    : selectedOrder.order_status?.status_name === "Pending"
                    ? "orange"
                    : "red"
                }
              >
                {selectedOrder.order_status?.status_name?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Danh Sách Sản Phẩm">
              {selectedOrder.order_items.map((item, index) => (
                <div key={index}>
                  <p>
                    <strong>{item.products?.name}</strong> - Số lượng:{" "}
                    {item.quantity}
                  </p>
                  <p>
                    Giá:{" "}
                    {(item.products?.sell_price * item.quantity).toLocaleString(
                      "vi-VN",
                      { style: "currency", currency: "VND" }
                    )}
                  </p>
                  <hr />
                </div>
              ))}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;
