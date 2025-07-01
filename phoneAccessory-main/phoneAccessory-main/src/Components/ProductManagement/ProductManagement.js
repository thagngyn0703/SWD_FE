import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Badge,
  List,
  Upload,
} from "antd";
import { supabase } from "../supabaseClient";
import "./SellerProductList.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BellOutlined, UploadOutlined } from "@ant-design/icons";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { render } from "@testing-library/react";

const { Option } = Select;

const ProductTable1 = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [statuss, setStatuss] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isAddBrandModalVisible, setIsAddBrandModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] =
    useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [under10, setUnder10] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [fileList, setFileList] = useState([]);
  const quillRef = useRef(null);
  const [quillContent, setQuillContent] = useState("");
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    fetchStatuss();
  }, [selectedCategory, selectedBrand]);
  useEffect(() => {
    if (editingProduct) {
      form.setFieldsValue(editingProduct);
      setQuillContent(editingProduct.des || "");
    } else {
      form.resetFields();
      setQuillContent("");
    }
  }, [editingProduct, form]);
  useEffect(() => {
    // Clear Quill editor when "Add Product" modal is open
    if (isModalVisible && quillRef.current) {
      quillRef.current.getEditor().setText("");
    }
  }, [isModalVisible]);
  const fetchStatuss = async () => {
    try {
      const { data, error } = await supabase.from("product_status").select("*");
      if (error) throw error;
      setStatuss(data);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast.error("Không thể tải dữ liệu trạng thái");
    }
  };
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase.from("products").select("*");

      // Apply category filter
      if (selectedCategory) {
        query = query.eq("cate_id", selectedCategory);
      }

      // Apply brand filter
      if (selectedBrand) {
        query = query.eq("brand_id", selectedBrand);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sort products to prioritize hot products
      const sortedProducts = data.sort((a, b) => b.isHot - a.isHot); // Sắp xếp sản phẩm hot lên đầu

      setProducts(sortedProducts);

      const lowStockProducts = sortedProducts.filter(
        (product) => product.stock_quantity < 10
      );
      lowStockProducts.forEach((product) => {
        toast.warn(`Sản phẩm "${product.name}" sắp hết hàng!`);
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Không thể tải dữ liệu sản phẩm");
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Không thể tải dữ liệu thể loại");
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from("brand").select("*");
      if (error) throw error;
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Không thể tải dữ liệu nhãn hiệu");
    }
  };

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // ... (file type and size validation) ...

      const fileName = `${Date.now()}_${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;

      try {
        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data: publicURLData, error: urlError } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        if (urlError) throw urlError;

        const quillEditor = quillRef.current.getEditor();
        const range = quillEditor.getSelection();
        quillEditor.insertEmbed(
          range ? range.index : 0,
          "image",
          publicURLData.publicUrl
        );
      } catch (error) {
        console.error("Error handling image upload:", error);
        alert("Error uploading image. Please try again.");
      }
    };

    input.click();
  };
  useEffect(() => {
    if (editingProduct && quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.root.innerHTML = editingProduct.des || "";
    }
  }, [editingProduct]);
  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };
  const addProduct = async (values) => {
    setUploading(true); // Bắt đầu uploading
    try {
      const productCode = await generateProductCode(
        values.cate_id,
        values.brand_id
      );

      const quillEditor = quillRef.current.getEditor();
      const des = quillEditor.root.innerHTML;

      const newProduct = {
        ...values,
        product_code: productCode,
        des: des,
        img: [],
        status: 1,
      };

      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert([newProduct])
        .select();
      if (productError) throw productError;

      const imageUrls = await Promise.all(
        values.img.map(async (file) => {
          const fileName = `${productData[0].product_id}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("Image")
            .upload(fileName, file.originFileObj);

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            return null;
          }

          const { data: urlData, error: urlError } = supabase.storage
            .from("Image")
            .getPublicUrl(fileName);

          if (urlError) {
            console.error("Error getting public URL:", urlError);
            return null;
          }

          return urlData.publicUrl;
        })
      );

      const validImageUrls = imageUrls.filter((url) => url !== null);

      if (validImageUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ img: validImageUrls })
          .eq("product_id", productData[0].product_id);

        if (updateError) {
          console.error("Error updating product with image URLs:", updateError);
        }
      }

      toast.success("Thêm sản phẩm thành công!");
      fetchProducts();
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Có lỗi xảy ra khi thêm sản phẩm. Vui lòng thử lại.");
    } finally {
      setUploading(false); // Kết thúc uploading dù thành công hay thất bại
    }
  };

  const generateProductCode = async (categoryId, brandId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    const brand = brands.find((b) => b.brand_id === brandId);
    const productCount = await getProductCount();

    // Sử dụng mã viết tắt cho thể loại
    const categoryCode = getCategoryCode(category.name);
    const brandCode = brand.name.substring(0, 3).toUpperCase();

    return `${categoryCode}-${brandCode}-${String(productCount + 1).padStart(
      4,
      "0"
    )}`;
  };

  // Hàm để lấy mã viết tắt cho thể loại
  const getCategoryCode = (categoryName) => {
    const categoryCodeMap = {
      "Ốp lưng": "OP",
      "Củ sạc": "CS",
      "Cáp sạc": "DS",
      "Tai nghe": "TN",
      "Sạc dự phòng pin": "SDP",
      "Giá đỡ điện thoại": "GDT",
      "Loa bluetooth": "LB",
      // Thêm các thể loại khác tại đây
    };
    return (
      categoryCodeMap[categoryName] ||
      categoryName.substring(0, 2).toUpperCase()
    );
  };
  // Hàm để lấy số lượng sản phẩm hiện tại
  const getProductCount = async () => {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error getting product count:", error);
      return 0;
    }

    return count || 0;
  };

  const confirmDeleteProduct = async () => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("product_id", productToDelete.product_id);
      if (error) throw error;
      toast.success("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Không thể xóa sản phẩm");
    }
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setDeleteModalVisible(true);
  };

  const editProduct = async (product_id, values) => {
    try {
      const currentProduct = products.find((p) => p.product_id === product_id);
      let newProductCode = currentProduct.product_code;

      if (
        currentProduct.cate_id !== values.cate_id ||
        currentProduct.brand_id !== values.brand_id
      ) {
        newProductCode = await generateProductCode(
          values.cate_id,
          values.brand_id
        );
      }

      const quillEditor = quillRef.current.getEditor();
      const des = quillEditor.root.innerHTML;

      const updateValues = {
        ...values,
        product_code: newProductCode,
        des: des,
      };

      const { error } = await supabase
        .from("products")
        .update(updateValues)
        .eq("product_id", product_id);
      if (error) throw error;
      toast.success("Sửa thông tin sản phẩm thành công!");
      fetchProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error("Error editing product:", error);
      toast.error("Không thể sửa thông tin sản phẩm");
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product); // Set the product to edit
  };
  const handleAddBrand = async () => {
    try {
      const { error } = await supabase
        .from("brand")
        .insert([{ name: newBrandName }]);
      if (error) throw error;
      toast.success("Thêm nhãn hiệu thành công!");
      setNewBrandName("");
      setIsAddBrandModalVisible(false);
      fetchBrands();
    } catch (error) {
      console.error("Error adding brand:", error);
      toast.error("Không thể thêm nhãn hiệu");
    }
  };

  const handleAddCategory = async () => {
    try {
      const { error } = await supabase
        .from("categories")
        .insert([{ name: newCategoryName }]);
      if (error) throw error;
      toast.success("Thêm thể loại thành công!");
      setNewCategoryName("");
      setIsAddCategoryModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Không thể thêm thể loại");
    }
  };
  const toggleHotStatus = async (product) => {
    const newStatus = product.isHot === 1 ? 0 : 1;

    try {
      const { error } = await supabase
        .from("products")
        .update({ isHot: newStatus })
        .eq("product_id", product.product_id);

      if (error) throw error;

      toast.success(
        `Cập nhật trạng thái "Hot" cho sản phẩm "${product.name}" thành công!`
      );
      fetchProducts(); // Tải lại danh sách sản phẩm sau khi cập nhật
    } catch (error) {
      console.error("Error updating hot status:", error);
      toast.error("Không thể cập nhật trạng thái Hot");
    }
  };

  const columns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text) => text.length > 20 ? `${text.substring(0, 20)}...` : text
    },
    {
      title: "Mã sản phẩm",
      dataIndex: "product_code",
      key: "product_code",
    },
    { title: "Giá nhập", dataIndex: "import_price", key: "import_price" },
    { title: "Giá bán", dataIndex: "sell_price", key: "sell_price" },
    { title: "Số lượng", dataIndex: "stock_quantity", key: "stock_quantity" },

    {
      title: "Thể loại",
      dataIndex: "cate_id",
      key: "cate_id",
      render: (cate_id) =>
        categories.find((cat) => cat.id === cate_id)?.name || "Trống",
    },
    {
      title: "Nhãn hiệu",
      dataIndex: "brand_id",
      key: "brand_id",
      render: (brand_id) =>
        brands.find((brand) => brand.brand_id === brand_id)?.name || "Trống",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const productStatus = statuss.find((s) => s.id === status);
        return productStatus ? productStatus.status_name : "Trống";
      },
    },
    {
      title: "Trạng thái Hot",
      key: "isHot",
      render: (_, record) => (
        <Button
          onClick={() => toggleHotStatus(record)}
          type={record.isHot === 1 ? "primary" : "default"}
        >
          {record.isHot === 1 ? "Hot" : "Không Hot"}
        </Button>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEditClick(record)}>Sửa</Button>
          <Button onClick={() => handleDeleteProduct(record)} danger>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="product-table">
      <h1>Quản lí sản phẩm</h1>
      <Space>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Thêm sản phẩm
        </Button>
        <Button
          className="mx-2"
          onClick={() => {
            setIsNotificationModalVisible(true);
            const under10 = products.filter(
              (product) => product.stock_quantity < 10
            );
            setUnder10(under10);
          }}
        >
          <Badge count={under10.length} offset={[10, 0]}>
            <BellOutlined style={{ fontSize: "18px" }} />
          </Badge>
        </Button>
      </Space>
      <Space>
        <Select
          placeholder="Lọc theo thể loại"
          onChange={(value) => setSelectedCategory(value)}
          value={selectedCategory}
          allowClear
        >
          {categories.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.name}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Lọc theo nhãn hiệu"
          onChange={(value) => setSelectedBrand(value)}
          value={selectedBrand}
          allowClear
        >
          {brands.map((brand) => (
            <Option key={brand.brand_id} value={brand.brand_id}>
              {brand.name}
            </Option>
          ))}
        </Select>
      </Space>
      <Table
        className="my-3"
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="product_id"
        pagination={{
          pageSize: 10,
        }}
      />

      <Modal
        title="Thêm sản phẩm"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false); // Đóng modal
          setQuillContent(""); // Reset nội dung của Quill Editor
          form.resetFields(); // Reset các trường trong form
        }}
        footer={null}
        zIndex={1000} // Đặt zIndex thấp nhất
      >
        <Form form={form} onFinish={addProduct}>
          {" "}
          {/* Bind the form here */}
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="product_code" label="Mã sản phẩm">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="import_price"
            label="Giá nhập (VND)"
            rules={[{ required: true, message: "Nhập giá nhập" }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="sell_price"
            label="Giá bán (VND)"
            rules={[{ required: true, message: "Nhập giá bán" },
              ({ getFieldValue }) => ({
              validator(_, value) {
                if (value !== getFieldValue('import_price') || value > getFieldValue('import_price')) {// Giá bán phải lớn hơn giá nhap
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Giá bán phải lớn hơn giá nhập"));
              },
            }),

            ]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="stock_quantity"
            label="Số lượng (Cái/Chiếc)"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="cate_id"
            label="Thể loại"
            rules={[{ required: true, message: "Chọn thể loại" }]}
          >
            <Select
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Button
                    type="link"
                    onClick={() => setIsAddCategoryModalVisible(true)}
                  >
                    + Thêm thể loại mới
                  </Button>
                </>
              )}
            >
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="brand_id"
            label="Nhãn hiệu"
            rules={[{ required: true, message: "Chọn nhãn hiệu" }]}
          >
            <Select
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Button
                    type="link"
                    onClick={() => setIsAddBrandModalVisible(true)}
                  >
                    + Thêm nhãn hiệu mới
                  </Button>
                </>
              )}
            >
              {brands.map((brand) => (
                <Select.Option key={brand.brand_id} value={brand.brand_id}>
                  {brand.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isHot" label="Trạng thái Hot">
            <Select>
              <Option value={1}>Hot</Option>
              <Option value={0}>Không Hot</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="img"
            label="Ảnh sản phẩm"
            valuePropName="fileList" // Important for Ant Design Upload
            getValueFromEvent={(e) => e.fileList} // Get fileList from event
          >
            <Upload
              beforeUpload={() => false}
              multiple={true}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="des"
            label="Mô tả"
            rules={[{ required: true, message: "Nhập mô tả sản phẩm" }]}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              placeholder="Mô tả sản phẩm"
              style={{ height: "200px", marginBottom: "20px", width: "100%" }}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="mt-5"
            disabled={uploading}
            style={{
              backgroundColor: uploading ? "#ccc" : "#1890ff",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Đang thêm sản phẩm..." : "Thêm sản phẩm"}
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa thông tin sản phẩm"
        open={!!editingProduct}
        onCancel={() => {
          setEditingProduct(null);
          setQuillContent("");
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          initialValues={{
            ...editingProduct,
          }}
          onFinish={(values) => editProduct(editingProduct.product_id, values)}
        >
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="import_price"
            label="Giá nhập"
            rules={[{ required: true, message: "Nhập giá nhập" }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="sell_price"
            label="Giá bán"
            rules={[{ required: true, message: "Nhập giá bán" }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="stock_quantity"
            label="Số lượng"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="cate_id"
            label="Thể loại"
            rules={[{ required: true, message: "Chọn thể loại" }]}
          >
            <Select>
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="brand_id"
            label="Nhãn hiệu"
            rules={[{ required: true, message: "Chọn nhãn hiệu" }]}
          >
            <Select>
              {brands.map((brand) => (
                <Option key={brand.brand_id} value={brand.brand_id}>
                  {brand.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="img" label="Ảnh sản phẩm">
            <Upload
              beforeUpload={() => false}
              onChange={handleUploadChange}
              multiple={true}
              listType="picture"
              fileList={fileList}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="des"
            label="Mô tả"
            rules={[{ required: true, message: "Nhập mô tả sản phẩm" }]}
          >
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={quillContent} // Use state to control content
              onChange={setQuillContent} // Update state on content change
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Cập nhật thông tin
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Xóa sản phẩm"
        open={deleteModalVisible}
        onOk={confirmDeleteProduct}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>Bạn có chắc chắn muốn xóa sản phẩm này?</p>
      </Modal>

      <Modal
        title="Thêm nhãn hiệu mới"
        open={isAddBrandModalVisible}
        onCancel={() => {
          setIsAddBrandModalVisible(false); // Đóng modal
          setNewBrandName(""); // Xóa tên nhãn hiệu sau khi đóng modal
        }}
        onOk={handleAddBrand}
        zIndex={1100}
      >
        <Form>
          <Form.Item label="Tên nhãn hiệu">
            <Input
              value={newBrandName}
              required
              onChange={(e) => setNewBrandName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thêm thể loại mới"
        open={isAddCategoryModalVisible}
        onCancel={() => {
          setIsAddCategoryModalVisible(false); // Đóng modal
          setNewCategoryName(""); // Xóa tên thể loại sau khi đóng modal
        }}
        onOk={handleAddCategory}
        zIndex={1100}
      >
        <Form>
          <Form.Item label="Tên thể loại">
            <Input
              value={newCategoryName}
              required
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sản phẩm sắp hết hàng"
        open={isNotificationModalVisible}
        onOk={() => setIsNotificationModalVisible(false)}
        onCancel={() => setIsNotificationModalVisible(false)}
      >
        <List
          itemLayout="horizontal"
          dataSource={under10}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={item.name}
                description={`Số lượng: ${item.stock_quantity}`}
              />
            </List.Item>
          )}
        />
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default ProductTable1;
