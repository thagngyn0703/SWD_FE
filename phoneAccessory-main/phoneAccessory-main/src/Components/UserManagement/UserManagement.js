import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Table,
  Button,
  Input,
  Form,
  Modal,
  message,
  Popconfirm,
  Space,
  Select,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";


const AccountManagement = () => {

  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [roles, setRoles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [sortOption, setSortOption] = useState("user_id"); // Sort mặc định theo user_id
  const [sortOrder, setSortOrder] = useState("ascend"); // Sort theo chiều tăng dần
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    fetchAccounts();
    fetchRoles();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Truy vấn bảng account và join vs bảng role để lấy dữ liệu
      const { data, error } = await supabase
        .from("account")
        .select(`*, role (*)`); 

      if (error) throw error;

      // Check xem có data hay k
      if (data) {
        setAccounts(data); // Có thì set state của account là data
        setFilteredAccounts(data || []);
      } else {
        setAccounts([]); // Set state là 1 array rỗng nếu như k có data
      }

    } catch (error) {
      message.error("Lỗi truy vấn account: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from("role").select("*");

      if (error) throw error;

      setRoles(data);
    } catch (error) {
      message.error("Lỗi khi truy vấn lấy role: " + error.message);
    }
  };

  const handleCreateAccount = async (values) => {
    try {
      // Đảm bảo role_id là 1 số
      const formattedValues = {
        ...values,
        role_id: Number(values.role_id)
      };

      const { data, error } = await supabase
        .from("account")
        .insert([formattedValues])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setAccounts((prevAccounts) => [...prevAccounts, data[0]]);
        await fetchAccounts();
        toast.success("Tạo tài khoản thành công!");
        setIsModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      message.error("Error creating account: " + error.message);
    }
  };

  const handleUpdateAccount = async (values) => {
    try {
      // Đảm bảo role_id được xử lý đúng
      const { role_name, ...formattedValues } = {
        ...values,
        role_id: Number(values.role_id),  // Convert role_id thành số
      };
      console.log('Updating with values:', formattedValues);  // Log kiểm tra giá trị đang được gửi

      const { error } = await supabase
        .from("account")
        .update(formattedValues)
        .eq("user_id", formattedValues.user_id);

      if (error) throw error;

      toast.success("Cập nhập thành công!");
      setAccounts(
        accounts.map((account) =>
          account.user_id === formattedValues.user_id
            ? { ...account, ...formattedValues }
            : account
        )
      );
      setIsModalVisible(false);
    } catch (error) {
      message.error("Lỗi khi cập nhật tài khoản: " + error.message);
    }
  };

  const handleDeleteAccount = async (accountId, roleId) => {
    try {
      if (roleId === 2) { // Check role_id cho admin
        message.error("Không thể xóa tài khoản admin!");
        return;
      }

      const { error } = await supabase
        .from("account")
        .delete()
        .eq("user_id", accountId);

      if (error) throw error;

      toast.success("Xóa thành công!");
      setAccounts(accounts.filter((account) => account.user_id !== accountId));
    } catch (error) {
      message.error("Lỗi khi xóa tài khoản: " + error.message);
    }
  };

  const showModal = (record = null) => {
    console.log("Record being edited: ", record);  // Log kiểm tra
    setIsEditing(!!record);
    if (record) {
      form.setFieldsValue({
        user_id: record.user_id,
        user_name: record.user_name,
        password: record.password,
        role_id: record.role?.role_id || 3,  // Set role_id để lưu đúng
        role_name: record.role?.role_name || "Không rõ quyền",  // Hiển thị tên quyền
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    form.submit();
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = accounts.filter((account) =>
      account.user_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAccounts(filtered);
  };

  const handleSortAndFilter = () => {
    let sortedAccounts = [...filteredAccounts];

    if (sortOption === "user_id") {
      sortedAccounts.sort((a, b) =>
        sortOrder === "ascend" ? a.user_id - b.user_id : b.user_id - a.user_id
      );
    } else if (sortOption === "role") {
      sortedAccounts.sort((a, b) =>
        sortOrder === "ascend"
          ? a.role?.role_name.localeCompare(b.role?.role_name)
          : b.role?.role_name.localeCompare(a.role?.role_name)
      );
    } else if (sortOption === "user_name") {
      sortedAccounts.sort((a, b) =>
        sortOrder === "ascend"
          ? a.user_name.localeCompare(b.user_name)
          : b.user_name.localeCompare(a.user_name)
      );
    }

    return sortedAccounts;
  };

  const onFinish = (values) => {
    console.log("Form values on submit: ", values);  // Log để kiểm tra role_id
    if (isEditing) {
      handleUpdateAccount(values);
    } else {
      handleCreateAccount({
        ...values,
        role_id: 3,  // Set giá trị role_id mặc định là 3 khi tạo tài khoản
      });
    }
  };

  const columns = [
    {
      title: <div style={{ textAlign: 'center' }}>Mã tài khoản</div>,
      dataIndex: "user_id",
      key: "user_id"
    },
    {
      title: <div style={{ textAlign: 'center' }}>Quyền</div>,
      dataIndex: ["role", "role_name"], // Lấy ra role_name
      key: "role_name",
      filters: roles.map((role) => ({
        text: role.role_name,
        value: role.role_name
      })), 
      onFilter: (value, record) => record.role.role_name === value, //Lọc theo role_name
    },
    {
      title: <div style={{ textAlign: 'center' }}>Số điện thoại</div>,
      dataIndex: "user_name",
      key: "user_name"
    },
    {
      title: <div style={{ textAlign: 'center' }}>Mật khẩu</div>,
      dataIndex: "password",
      key: "password",
      render: () => "••••••••", // Mask the password
    },
    {
      title: <div style={{ textAlign: 'center' }}>Hành động</div>,
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa tài khoản này"
            onConfirm={() => handleDeleteAccount(record.user_id, record.role_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h2>Quản lý tài khoản</h2>
      <Space style={{ marginBottom: "16px" }}>
      <Input
          placeholder="Tìm kiếm theo số điện thoại"
          value={searchTerm}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
        />
        
        <Select
          defaultValue="user_id"
          style={{ width: 180 }}
          onChange={(value) => setSortOption(value)}
        >
          <Select.Option value="user_id">Lọc theo Mã tài khoản</Select.Option>
          <Select.Option value="role">Lọc theo Quyền</Select.Option>
          <Select.Option value="user_name">Lọc theo SDT</Select.Option>
        </Select>

        <Select
          defaultValue="ascend"
          style={{ width: 180 }}
          onChange={(value) => setSortOrder(value)}
        >
          <Select.Option value="ascend">Tăng dần</Select.Option>
          <Select.Option value="descend">Giảm dần</Select.Option>
        </Select>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Tạo tài khoản
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={handleSortAndFilter()}
        loading={loading}
        rowKey="user_id"
      />
      <Modal
        title={isEditing ? "Chỉnh sửa tài khoản" : "Tạo tài khoản"}
        open={isModalVisible}
        onOk={handleModalOk}
        okText={isEditing ? "Lưu" : "Tạo"}
        onCancel={handleModalCancel}
        cancelText="Hủy"
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          {isEditing && (
            <Form.Item name="user_id" hidden>
              <Input />
            </Form.Item>
          )}
          <Form.Item
            name="user_name"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Nhập số điện thoại của bạn!' },
              { pattern: /^0\d{9}$/, message: 'Hãy nhập số điện thoại hợp lệ!' },
            ]}
          >
            <Input disabled={isEditing} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Hãy nhập mật khẩu!' },
              {
                pattern: /^(?=.*[A-Za-z])[A-Za-z\d@$!%*#?&]{8,}$/,
                message: 'Hãy điền tối thiểu 8 ký tự bao gồm chữ cái, số và kí tự đặc biệt'
              }
            ]}
          >
            <Input.Password />
          </Form.Item>

          {isEditing ? (
            // Khi chỉnh sửa, hiển thị tên quyền role_name và set hidden input cho role_id
            <>
              <Form.Item name="role_name" label="Quyền">
                <Input disabled />
              </Form.Item>
              <Form.Item name="role_id" hidden>
                <Input />
              </Form.Item>
            </>
          ) : (
            // Khi tạo tài khoản, role_id sẽ tự động là 3
            <Form.Item name="role_id" hidden>
              <Input defaultValue={3} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagement;