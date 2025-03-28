import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";


const Compilation = ({ code }) => {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(71); // Default: Python

  // ✅ Language options with Judge0 language IDs
  const languages = [
    { id: 54, name: "C++" },
    { id: 50, name: "C" },
    { id: 62, name: "Java" },
    { id: 71, name: "Python" },
    { id: 63, name: "JavaScript" },
    { id: 78, name: "Kotlin" },
    { id: 60, name: "Go" },
    { id: 68, name: "PHP" },
    { id: 43, name: "Plain Text" },
  ];

  // ✅ API Configuration
  const API_URL = "https://judge0-ce.p.rapidapi.com/submissions/?base64_encoded=false&wait=true";
  const API_KEY = "60726d79bemsh488552bf44cfb6dp148229jsn8d365aee637e";

  const compileCode = async () => {
    if (!code) {
      toast.error("No code to compile!");
      return;
    }

    setLoading(true);
    setOutput(""); // Reset output before compilation

    try {
      const submissionData = {
        source_code: code,
        language_id: selectedLanguage, // ✅ Use selected language ID
        stdin: "", // Provide input if needed
      };

      // ✅ Submit the code to Judge0 API
      const { data: submission } = await axios.post(API_URL, submissionData, {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": API_KEY, // ✅ Correct API Key Header
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        },
      });

      if (submission.token) {
        // ✅ Fetch execution result
        const result = await fetchSubmissionResult(submission.token);
        setOutput(result);
      } else {
        setOutput("Error: No submission token received.");
        toast.error("Submission failed!");
      }
    } catch (error) {
      console.error("Compilation error:", error);
      setOutput("Error compiling code!");
      toast.error("Compilation failed!");
    }

    setLoading(false);
  };

  const fetchSubmissionResult = async (token) => {
    try {
      let status = null;
      let resultData = null;

      while (!status || status.id <= 2) { // 1: In queue, 2: Processing
        const { data } = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`,
          {
            headers: {
              "x-rapidapi-key": API_KEY, // ✅ Use correct API Key
              "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        status = data.status;
        resultData = data;

        if (status.id >= 3) break; // 3: Completed
        await new Promise((res) => setTimeout(res, 2000)); // Wait before retrying
      }

      if (resultData.stdout) return resultData.stdout;
      if (resultData.stderr) return resultData.stderr;
      if (resultData.compile_output) return resultData.compile_output;

      return "No output received.";
    } catch (error) {
      console.error("Error fetching result:", error);
      return "Error fetching output!";
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4">
      {/* ✅ Language Selection Dropdown */}
      <label className="block mb-2 text-sm font-medium">Select Language:</label>
      <select
        className="bg-gray-700 text-white p-2 rounded mb-4"
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(Number(e.target.value))}
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>

      <button
        onClick={compileCode}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
        disabled={loading}
      >
        {loading ? "Compiling..." : "Compile & Run"}
      </button>

      <h3 className="font-semibold">Output:</h3>
      <pre className="bg-black p-3 rounded shadow text-green-400">
        {loading ? "Compiling..." : output}
      </pre>
    </div>
  );
};

export default Compilation;
