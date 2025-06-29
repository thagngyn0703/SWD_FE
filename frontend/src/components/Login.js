import { useState } from "react";
import { request } from "../axios_helper"; // đúng đường dẫn tới file của em
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await request("post", "/login", {
        login: email,
        password: password,
      });

      localStorage.setItem("token", res.data.token);

      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("📦 Payload bên trong token:", payload);
      }
      alert("Đăng nhập thành công!");
    } catch (err) {
      alert("Sai thông tin đăng nhập!");
      console.error(err);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="formBasicEmail">
        <Form.Label>Địa chỉ email</Form.Label>
        <Form.Control
          type="text"
          placeholder="Nhập email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
      </Form.Group>

      <Form.Group className="mb-3" controlId="formBasicPassword">
        <Form.Label>Mật khẩu</Form.Label>
        <Form.Control
          type="password"
          placeholder="Nhập mật khẩu"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
      </Form.Group>

      <Button variant="primary" type="submit">
        Đăng nhập
      </Button>
    </Form>
  );
}

export default LoginForm;
