// AvgRate.js
import React, { useEffect, useState } from "react";
import { Rate } from "antd";
import { supabase } from "../supabaseClient"; // Adjust path if necessary

const AvgRate = ({ productId}) => {
    const [averageRate, setAverageRate] = useState(0);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from("comment")
            .select("rate")
            .eq("product_id", productId);

        if (error) {
            console.error("Error fetching comments:", error);
        } else if (data.length > 0) {
            const totalRate = data.reduce((acc, comment) => acc + comment.rate, 0);
            setAverageRate(totalRate / data.length);
        } else {
            setAverageRate(0); // No ratings
        }
    };

    useEffect(() => {
        if (productId) fetchComments();
    }, [productId]);

    return (
        <Rate allowHalf disabled value={averageRate} style={{ fontSize: 24, marginBottom: "20px" }} />
    );
};

export default AvgRate;
