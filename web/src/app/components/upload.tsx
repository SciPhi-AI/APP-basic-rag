"use client";
import { useState, useRef } from "react";
import { R2RClient } from '../../r2r-js-client';

export const UploadButton = ({ userId, apiUrl, uploadedDocuments, setUploadedDocuments, setLogFetchID }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length) {
      setIsUploading(true);
      const files = Array.from(fileInputRef.current.files);
      try {
        if (!apiUrl) {
          throw new Error('API URL is not defined');
        }
        const client = new R2RClient(apiUrl);
        const uploadedFiles: any[] = [];
        let metadatas = [];
        for (const file of files) {
          if (!file) continue;
          const fileId = client.generateIdFromLabel(file.name);
          uploadedFiles.push({document_id: fileId, title: file.name});
          metadatas.push({ user_id: userId, title: file.name });
          const document_id = await client.getUserDocumentIds(userId);
        }
        await client.ingestFiles(metadatas, files);
        console.log('uploadedFiles = ', uploadedFiles)
        setUploadedDocuments([...uploadedDocuments, ...uploadedFiles]);
        setLogFetchID(client.generateRunId());

        alert("Success");
      } catch (error) {
        console.error("Error uploading files:", error);
        alert("Failed to upload files. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <form onSubmit={handleDocumentUpload}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleDocumentUpload}
        />
        <button
          type="button"
          onClick={handleUploadButtonClick}
          disabled={isUploading}
          className={`pl-2 pr-2 text-white py-2 px-4 rounded ${
            isUploading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload File(s)"}
        </button>
      </form>
    </>
  );
};
