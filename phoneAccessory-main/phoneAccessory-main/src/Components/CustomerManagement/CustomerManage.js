import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Table, message, Spin } from "antd";

const ProfileManagement = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch profiles from the database
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("profileuser").select("*");
      if (error) throw error;
      setProfiles(data);
    } catch (error) {
      message.error("Error fetching profiles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Define table columns
  const columns = [
    { title: "User ID", dataIndex: "user_id", key: "user_id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h2>Profile Management</h2>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table columns={columns} dataSource={profiles} rowKey="user_id" />
      )}
    </div>
  );
};

export default ProfileManagement;
