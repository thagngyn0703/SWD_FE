import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Container, Row, Col, Alert } from "react-bootstrap";

const RegisterForm = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    login: "",
    password: "",
  });

  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState("success");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8081/register", form);
      setVariant("success");
      setMessage("Đăng ký thành công!");
      setForm({
        firstName: "",
        lastName: "",
        login: "",
        password: "",
      });
    } catch (error) {
      console.error(error);
      setVariant("danger");
      setMessage("Đăng ký thất bại! Tài khoản đã tồn tại?");
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <h2 className="mb-4 text-center">Đăng ký tài khoản</h2>
          {message && <Alert variant={variant}>{message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Họ</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Nhập họ của bạn"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Nhập tên của bạn"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email đăng nhập</Form.Label>
              <Form.Control
                type="email"
                name="login"
                value={form.login}
                onChange={handleChange}
                placeholder="VD: truc@gmail.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Đăng ký
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterForm;
