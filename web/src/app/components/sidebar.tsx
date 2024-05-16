"use client";
import { useEffect } from "react";
import { UploadButton } from "./upload";
import { R2RClient } from "../../r2r-js-client";

export function Sidebar({ userId, apiUrl, uploadedDocuments, setUploadedDocuments, setLogFetchID }) {

  const client = new R2RClient(apiUrl);

  useEffect(() => {
    if (userId) {
      client.getUserDocumentIds(userId).then((data) => {
        const documents = data.results.map(result => JSON.parse(result));
        setUploadedDocuments(documents);
        setLogFetchID(client.generateRunId());
      }).catch(error => {
        console.error("Error fetching user documents:", error);
      });
    }
  }, [userId]);

  const deleteDocument = async (documentId) => {
    try {
      await client.delete('document_id', documentId);
      // Update the state to remove the deleted document
      setUploadedDocuments(uploadedDocuments.filter(doc => doc.document_id !== documentId));
      alert("Document deleted successfully.");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    }
  };

  const abbreviateFileName = (name, maxLength = 48) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength - 3)}...`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 pt-4">
        <h2 className="text-lg text-ellipsis font-bold text-blue-500">
          Documents
        </h2>
        <UploadButton userId={userId} apiUrl={apiUrl} uploadedDocuments={uploadedDocuments} setUploadedDocuments={setUploadedDocuments} setLogFetchID={setLogFetchID}/>
      </div>
      <div className="border-t border-white-600 mb-2"></div>
      <div className="flex-grow overflow-auto max-h-[calc(100vh-290px)]">
        <ul className="">
          {uploadedDocuments?.map((document, index) => (
            <li key={index} className="flex justify-between items-center text-zinc-300 mt-2">
              <span className="truncate">{abbreviateFileName(document.title)}</span>
              <button
                onClick={() => deleteDocument(document.document_id)}
                className="hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
