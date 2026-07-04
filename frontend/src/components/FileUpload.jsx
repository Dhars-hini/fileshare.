import React, { useState } from "react";
import { axiosInstance, authHeader } from "../utils/api";

const FileUpload = ({ onUpload }) => {
  const [files, setFiles] = useState([]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!files.length) return alert("Select files to upload");

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    try {
      await axiosInstance.post("/files/upload", formData, {
        headers: {
          ...authHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      setFiles([]);
      onUpload();
      alert("Files uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  const styles = {
    form: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    input: {
      padding: "8px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      fontSize: "1rem",
    },
    button: {
      padding: "10px 20px",
      borderRadius: "5px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
      backgroundColor: "#e53935",
      color: "#fff",
      transition: "all 0.3s ease",
    },
    buttonHover: {
      backgroundColor: "#b71c1c",
    },
  };

  return (
    <form onSubmit={submitHandler} style={styles.form}>
      <input
        type="file"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
        style={styles.input}
      />
      <button
        type="submit"
        style={styles.button}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "#b71c1c")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "#e53935")
        }
      >
        Upload
      </button>
    </form>
  );
};

export default FileUpload;
