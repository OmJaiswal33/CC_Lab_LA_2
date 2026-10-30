import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  UploadCloud, 
  FileText, 
  Image, 
  FileArchive, 
  File, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Cloud,
  Layers,
  Server
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(type, name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext) || type.includes('image')) {
    return <div className="file-icon file-icon-image"><Image size={18} /></div>;
  }
  if (['pdf'].includes(ext) || type.includes('pdf')) {
    return <div className="file-icon file-icon-pdf"><FileText size={18} /></div>;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
    return <div className="file-icon file-icon-zip"><FileArchive size={18} /></div>;
  }
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) {
    return <div className="file-icon file-icon-doc"><FileText size={18} /></div>;
  }
  return <div className="file-icon file-icon-other"><File size={18} /></div>;
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({
    total_files: 0,
    total_bytes: 0,
    storage_mode: 'Local Storage',
    db_mode: 'Local SQLite',
    bucket_name: 'Not connected'
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/files/`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to connect to backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/files/`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setMessage({ type: 'success', text: `Uploaded "${selectedFile.name}" successfully!` });
        await fetchFiles();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Upload failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error communicating with server' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/files/${fileId}/`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Deleted "${fileName}" successfully.` });
        fetchFiles();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete file.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error deleting file.' });
    }
  };

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">
            <HardDrive size={22} />
          </div>
          <div>
            <h1 className="brand-title">CloudDrive</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cloud File Vault & Object Storage</p>
          </div>
        </div>

        {/* AWS Practical Mapping Status Pills */}
        <div className="aws-status-pills">
          <span className="pill pill-s3" title="AWS S3 Object Storage (Practical 3)">
            <Cloud size={14} /> S3: {stats.storage_mode}
          </span>
          <span className="pill pill-rds" title="AWS RDS Relational Database (Practical 7)">
            <Database size={14} /> RDS: {stats.db_mode}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="container">
        {/* Left Column: Upload & Storage Stats */}
        <aside className="sidebar">
          {/* Upload Card */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Upload File</h2>

            <form onSubmit={handleUpload}>
              <div 
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                <div className="dropzone-icon">
                  <UploadCloud size={24} />
                </div>
                <div className="dropzone-text">
                  <strong>Click to browse</strong> or drag & drop file
                </div>
                {selectedFile && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginTop: '0.5rem' }}>
                    Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn-upload" 
                style={{ marginTop: '1rem' }}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading to Storage...' : 'Upload to Cloud'}
              </button>
            </form>

            {message && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: message.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
                color: message.type === 'success' ? 'var(--success)' : 'var(--danger)'
              }}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}
          </div>

          {/* Storage Meter */}
          <div className="card">
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Storage Usage</h2>
            <div className="storage-stat">
              <div className="storage-info">
                <span>{stats.total_files} file{stats.total_files === 1 ? '' : 's'} stored</span>
                <span>{formatBytes(stats.total_bytes)}</span>
              </div>
              <div className="storage-bar-bg">
                <div 
                  className="storage-bar-fill" 
                  style={{ width: `${Math.min(100, Math.max(5, (stats.total_bytes / (50 * 1024 * 1024)) * 100))}%` }}
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Target: {stats.storage_mode === 'AWS S3' ? `S3 Bucket (${stats.bucket_name})` : 'Local Media Folder'}
              </div>
            </div>
          </div>

          {/* Practical Mapping Reference */}
          <div className="prac-card">
            <strong>Cloud Computing Practical Mapping:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>EC2 (Prac 1):</strong> Hosts web app & API</li>
              <li><strong>S3 (Prac 3):</strong> Stores file binaries & versions</li>
              <li><strong>VPC (Prac 6):</strong> Public & private subnet network</li>
              <li><strong>RDS (Prac 7):</strong> Stores file names, size, metadata</li>
              <li><strong>IAM (Prac 8):</strong> Role attached for S3 access</li>
            </ul>
          </div>
        </aside>

        {/* Right Column: Files List */}
        <main className="main-content">
          <div className="section-header">
            <h2 className="section-title">
              <Layers size={20} color="var(--primary)" /> Stored Files
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {files.length} Item{files.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading files from database...
            </div>
          ) : files.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">
                <HardDrive size={28} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                No files uploaded yet
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}>
                Drag and drop your documents, images, or PDFs on the left to upload them to the cloud vault.
              </p>
            </div>
          ) : (
            <div className="file-table-container">
              <table className="file-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Uploaded Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const downloadUrl = file.file_url?.startsWith('http')
                      ? file.file_url
                      : `http://localhost:8000${file.file_url}`;

                    return (
                      <tr key={file.id}>
                        <td>
                          <div className="file-item">
                            {getFileIcon(file.file_type, file.original_name)}
                            <div>
                              <div className="file-name">{file.original_name}</div>
                              <div className="file-meta">{file.file_type}</div>
                            </div>
                          </div>
                        </td>
                        <td>{formatBytes(file.file_size)}</td>
                        <td>{new Date(file.uploaded_at).toLocaleDateString()}</td>
                        <td>
                          <div className="actions">
                            <a 
                              href={downloadUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn-icon" 
                              title="Download File"
                              download
                            >
                              <Download size={15} />
                            </a>
                            <button 
                              onClick={() => handleDelete(file.id, file.original_name)}
                              className="btn-icon btn-icon-danger"
                              title="Delete File"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
