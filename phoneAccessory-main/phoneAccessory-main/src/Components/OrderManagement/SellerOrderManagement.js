import React, { useState, useEffect } from "react";
import { Table, Tag, Button, Select, Modal, Descriptions, Input } from "antd";
import { supabase } from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { Option } = Select;

const SellerOrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [orderStatus, setOrderStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState("");

    const STATUS_MAP = {
        "Chờ duyệt": 1,
        "Đang xử lí": 2,
        "Hoàn thành": 3,
        "Hủy": 4,
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("orders")
            .select(`
                id,
                user_id,
                total_price,
                created_at,
                address_order,
                status,
                profileuser(name, email, phone),
                order_items(product_id, quantity, products(name, sell_price)),
                order_status:status(status_name)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Lỗi khi lấy dữ liệu đơn hàng từ Supabase:", error);
        } else {
            setOrders(data);
            setFilteredOrders(data);
        }
        setLoading(false);
    };

    const updateOrderStatus = async (orderId, newStatusName) => {
        setLoading(true);
        const newStatusId = STATUS_MAP[newStatusName];

        const { error } = await supabase
            .from("orders")
            .update({ status: newStatusId })
            .eq("id", orderId);

        if (error) {
            console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
            toast.error("Cập nhật trạng thái đơn hàng thất bại.");
        } else {
            fetchOrders();
            toast.success("Trạng thái đơn hàng đã được cập nhật.");
        }
        setLoading(false);
    };

    const handleStatusFilter = (status) => {
        setOrderStatus(status);
        if (status) {
            setFilteredOrders(orders.filter(order => order.order_status?.status_name === status));
        } else {
            setFilteredOrders(orders);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const filteredData = orders.filter(order =>
            order.profileuser?.name.toLowerCase().includes(value.toLowerCase()) ||
            order.id.toString().includes(value) // Convert order ID to string for comparison
        );
        setFilteredOrders(filteredData);
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    // Function to show order details in a modal
    const showOrderDetails = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    // Function to close the order details modal
    const closeOrderDetails = () => {
        setSelectedOrder(null);
        setModalVisible(false);
    };
    const columns = [
        {
            title: "Mã Đơn Hàng",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Tên Khách Hàng",
            dataIndex: ["profileuser", "name"],
            key: "customer_name",
            render: (text, record) => record.profileuser ? record.profileuser.name : "N/A",
        },
        {
            title: "Số Tiền (₫)",
            dataIndex: "total_price",
            key: "total_price",
            render: (value) => value.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
            sorter: (a, b) => a.total_price - b.total_price,
        },
        {
            title: "Ngày Đặt Hàng",
            dataIndex: "created_at",
            key: "created_at",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
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
        {
            title: "Trạng Thái",
            dataIndex: ["order_status", "status_name"],
            key: "status_name",
            render: (statusName, record) => (
                <Select
                    defaultValue={Object.keys(STATUS_MAP).find(
                        (key) => STATUS_MAP[key] === record.status
                    )}
                    onChange={(value) => updateOrderStatus(record.id, value)}
                    style={{ width: 150 }}
                >
                    {Object.keys(STATUS_MAP).map((status) => (
                        <Option key={status} value={status}>{status}</Option>
                    ))}
                </Select>
            ),
            filters: Object.keys(STATUS_MAP).map(status => ({ text: status, value: status })),
            onFilter: (value, record) => record.order_status?.status_name === value,
        },
    ];

    return (
        <div style={{ padding: "20px" }}>
            <ToastContainer />
            <h2>Quản Lý Đơn Hàng</h2>

            {/* Filter by Status */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <Input.Search
                    placeholder="Tìm kiếm theo mã hoặc tên" 
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 300 }}
                />
                <Select
                    placeholder="Lọc theo trạng thái"
                    value={orderStatus}
                    onChange={handleStatusFilter}
                    style={{ width: 200 }}
                >
                    <Option value={null}>Tất cả</Option>
                    {Object.keys(STATUS_MAP).map((status) => (
                        <Option key={status} value={status}>{status}</Option>
                    ))}
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
    open={modalVisible}
    onCancel={closeOrderDetails}
    footer={[
        <Button key="close" onClick={closeOrderDetails}>
            Đóng
        </Button>,
        <Button
            key="update"
            type="primary"
            onClick={() => updateOrderStatus(selectedOrder.id, orderStatus)}
        >
            Cập nhật Trạng Thái
        </Button>,
    ]}
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
                            <strong>{item.products?.name}</strong> - Số lượng: {item.quantity}
                        </p>
                        <p>
                            Giá: {(item.products?.sell_price * item.quantity).toLocaleString(
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

export default SellerOrderManagement;
