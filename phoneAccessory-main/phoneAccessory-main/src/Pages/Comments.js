// Comment.js
import React, { useEffect, useState } from "react";
import { Card, Rate, Button, Input, message, Typography, Divider, Avatar } from "antd";
import { supabase } from "../supabaseClient"; // Adjust path if needed
import { UserOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Title } = Typography;

const Comment = ({ productId, user }) => {
    const [comments, setComments] = useState([]);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingFeedback, setExistingFeedback] = useState(null);

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from("comment")
            .select("*")
            .eq("product_id", productId);

        if (error) {
            console.error("Error fetching comments:", error);
        } else {
            setComments(data);
            if (user) {
                const userComment = data.find(comment => comment.user_id === user.user_id);
                if (userComment) {
                    setExistingFeedback(userComment);
                    setRating(userComment.rate);
                    setFeedback(userComment.feedback);
                }
            }
        }
    };

    useEffect(() => {
        fetchComments();
    }, [productId, user]);

    const handleSubmitFeedback = async () => {
        if (!user) {
            message.warning("Please log in to submit feedback.");
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase
            .from("comment")
            .insert({ product_id: productId, user_id: user.user_id, rate: rating, feedback });

        if (error) {
            console.error("Error submitting feedback:", error);
            message.error("Failed to submit feedback.");
        } else {
            message.success("Feedback submitted successfully!");
            setFeedback("");
            setRating(0);
            fetchComments();
        }

        setIsSubmitting(false);
        window.location.reload();
    };

    return (
        <div style={{ padding: "0 20px", maxWidth: "800px", margin: "0 auto" }}>
            <Title level={3} style={{ textAlign: "center", marginTop: "20px" }}>Đánh giá sản phẩm</Title>
            <Divider />
            
            {/* Feedback form */}
            {user && !existingFeedback ? (
                <div style={{ margin: "20px 0" }}>
                    <Title level={4}>Viết đánh giá của bạn</Title>
                    <Rate onChange={(value) => setRating(value)} value={rating} style={{ marginBottom: "10px" }} />
                    <TextArea
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Nhập đánh giá của bạn..."
                        style={{ marginBottom: "10px" }}
                    />
                    <Button
                        type="primary"
                        onClick={handleSubmitFeedback}
                        loading={isSubmitting}
                        block
                    >
                        Gửi đánh giá
                    </Button>
                </div>
            ) : (
                <Text type="secondary">{!user ? "Vui lòng đăng nhập để thêm đánh giá." : "Bạn đã gửi đánh giá cho sản phẩm này."}</Text>
            )}

            <Divider />

            {/* Display comments */}
            {comments.length > 0 ? (
                comments.map((comment) => (
                    <Card key={comment.id} style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <Avatar icon={<UserOutlined />} style={{ marginRight: "10px" }} />
                            <div>
                                <Text strong>Người dùng ẩn danh</Text>
                                <Rate disabled value={comment.rate} style={{ fontSize: "14px", marginLeft: "10px" }} />
                            </div>
                        </div>
                        <Text style={{ display: "block", marginTop: "10px" }}><strong>Feedback:</strong> {comment.feedback}</Text>
                    </Card>
                ))
            ) : (
                <Text type="secondary" style={{ textAlign: "center", display: "block" }}>
                    Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá sản phẩm!
                </Text>
            )}
        </div>
    );
};

export default Comment;

