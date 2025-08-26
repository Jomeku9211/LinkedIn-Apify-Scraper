import React, { useState } from 'react';
import axios from 'axios';

export default function PostScraperManual() {
  const [file, setFile] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleStart = async () => {
    if (!file) return;
    setLoading(true);
    setStats(null);
    setLogs(['Uploading and processing...']);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/manual-post-scraper/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStats(res.data);
      setLogs(res.data.logs || []);
    } catch (err) {
      setLogs([err.response?.data?.error || err.message]);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Post Scraper Manual</h2>
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button onClick={handleStart} disabled={!file || loading}>
        {loading ? 'Processing...' : 'Start'}
      </button>
      {stats && (
        <div style={{ marginTop: 16 }}>
          <b>Stats:</b>
          <div>Total: {stats.total}</div>
          <div>Matched: {stats.matched}</div>
          <div>Updated: {stats.updated}</div>
          <div>Failed: {stats.failed}</div>
        </div>
      )}
      <div style={{ marginTop: 16, background: '#f5f5f5', padding: 10, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
        <b>Logs:</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </pre>
      </div>
    </div>
  );
}