import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ✅ Initialize Supabase Client
const supabaseUrl = 'https://bkeojfxhjaedjwpbavsf.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey)

const FileDrawer = ({ editorValue, setEditorValue }) => {
  if (!setEditorValue) {
    console.error("❌ setEditorValue function is missing!");
    return null;
  }

  const [files, setFiles] = useState(["main.c"]); // Default file
  const [currentFile, setCurrentFile] = useState("main.c");

  // ✅ Load available files from Supabase
  useEffect(() => {
    fetchFiles();
    retrieveFile("main.c"); // Load default file
  }, []);

  // ✅ Fetch all stored files
  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from("code-storage").list();
    if (error) {
      console.error("❌ Error fetching files:", error);
      return;
    }
    setFiles(data.map((file) => file.name));
  };

  // ✅ Create a new file
  const createFile = () => {
    const fileName = prompt("Enter new file name (e.g., script.js):");
    if (!fileName || files.includes(fileName)) return alert("Invalid file name!");
    
    setFiles([...files, fileName]);
    setCurrentFile(fileName);
    setEditorValue(""); // Clear editor for new file
  };

  // ✅ Save file to Supabase
  const saveFile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("❌ You must be logged in to save files!");
      return;
    }
  
    const fileContent = new Blob([editorValue], { type: "text/plain" });
  
    const { error } = await supabase.storage
      .from("code-storage")
      .upload(currentFile, fileContent, { upsert: true });
  
    if (error) {
      console.error("❌ Error saving file:", error);
      alert(`Failed to save: ${error.message}`);
      return;
    }
  
    alert("✅ File saved successfully!");
    fetchFiles(); // Refresh file list
  };
  

  // ✅ Retrieve file from Supabase
  const retrieveFile = async (fileName) => {
    setCurrentFile(fileName);
    const { data } = supabase.storage.from("code-storage").getPublicUrl(fileName);

    if (!data.publicUrl) {
      console.error("❌ File not found:", fileName);
      alert("Failed to retrieve file!");
      return;
    }

    const response = await fetch(data.publicUrl);
    const fileText = await response.text();
    setEditorValue(fileText);
  };

  // ✅ Delete file from Supabase
  const deleteFile = async () => {
    if (!window.confirm(`Are you sure you want to delete ${currentFile}?`)) return;
console.log("deleted from supabase" )
    const { error } = await supabase.storage.from("code-storage").remove([currentFile]);

    if (error) {
      console.error("❌ Delete error:", error);
      alert("Failed to delete!");
      return;
    }

    alert("✅ File deleted successfully!");
    setFiles(files.filter((file) => file !== currentFile));
    setCurrentFile("main.c");
    setEditorValue(""); // Clear editor if deleted
  };

  return (
    <div className="flex flex-col bg-gray-900 text-white p-4">
      {/* Buttons at the Top */}
      <div className="flex justify-between mb-3">
        <button onClick={createFile} className="p-2 bg-green-500 rounded">➕ New File</button>
        <button onClick={saveFile} className="p-2 bg-blue-500 rounded">💾 Save File</button>
        <button onClick={deleteFile} className="p-2 bg-red-500 rounded">🗑️ Delete File</button>
      </div>

      {/* File Selector */}
      <select
        value={currentFile}
        onChange={(e) => retrieveFile(e.target.value)}
        className="bg-gray-800 p-2 rounded text-white mb-2"
      >
        {files.map((file) => (
          <option key={file} value={file}>
            {file}
          </option>
        ))}
      </select>

      <h3 className="font-bold">Editing: {currentFile}</h3>
    </div>
  );
};

export default FileDrawer;
