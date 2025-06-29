import React, { useEffect, useState } from "react";

import { request } from "../axios_helper";

const AuthContent = (props) => {
    const [data, setdata] = useState([])

useEffect(() => {
    request("GET", "/messages", {})
        .then((res) => {
            console.log("Dữ liệu trả về:", res.data); // 👈 Xem kiểu dữ liệu
            setdata(res.data);
        })
        .catch(err => {
            console.error("Lỗi gọi API:", err);
        });
}, []);

    return (

        <div>
            {data && data.map(line => <p>{line}</p>
            )}
        </div>
    )
}
export default AuthContent;