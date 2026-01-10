import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { creatorAPI } from '../services/api';
import { uploadAPI } from '../services/api'; // PASTIKAN INI ADA DI api.js
import { toast } from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  PaperClipIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    type: 'article',
    visibility: 'public',
    mediaUrls: []
  });

  // Fungsi untuk upload file ke server
  const uploadFileToServer = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadAPI.uploadFile(formData);
      return response.data; // { url, filename, mimeType, size }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFileTypeLabel = (fileType, extension) => {
    const labels = {
      'image': 'gambar',
      'video': 'video', 
      'application': 'dokumen',
      'text': 'dokumen teks'
    };
    
    if (extension === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'dokumen Word';
    return labels[fileType] || 'file';
  };

  // Handle file upload - UPLOAD KE SERVER
  const handleFileUpload = async (files) => {
    const FILE_LIMITS = {
      IMAGE: 20 * 1024 * 1024,
      VIDEO: 500 * 1024 * 1024,
      PDF: 50 * 1024 * 1024,
      DEFAULT: 100 * 1024 * 1024
    };

    const validFiles = Array.from(files).filter(file => {
      const fileType = file.type.split('/')[0];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      let limit;
      if (fileType === 'image') limit = FILE_LIMITS.IMAGE;
      else if (fileType === 'video') limit = FILE_LIMITS.VIDEO;
      else if (fileExtension === 'pdf') limit = FILE_LIMITS.PDF;
      else limit = FILE_LIMITS.DEFAULT;

      if (file.size > limit) {
        const maxSizeMB = (limit / (1024 * 1024)).toFixed(0);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`${file.name} (${fileSizeMB}MB) terlalu besar! Maksimal ${maxSizeMB}MB`);
        return false;
      }

      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mov', 'video/avi', 'video/webm',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} - Format tidak didukung`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of validFiles) {
        try {
          // UPLOAD KE SERVER
          const serverResult = await uploadFileToServer(file);
          
          // Simpan hasil upload ke state
          setUploadedFiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            serverUrl: serverResult.url, // URL DARI SERVER
            extension: file.name.split('.').pop().toLowerCase(),
            serverData: serverResult
          }]);

          // Update mediaUrls dengan URL dari server
          setFormData(prev => ({
            ...prev,
            mediaUrls: [...prev.mediaUrls, serverResult.url]
          }));

        } catch (uploadError) {
          console.error('Upload file error:', uploadError);
          toast.error(`Gagal mengupload ${file.name}`);
        }
      }

      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} file berhasil diupload ke server`);
      }
      
    } catch (error) {
      console.error('Upload process error:', error);
      toast.error('Terjadi kesalahan dalam proses upload');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (index) => {
    if (index < 0 || index >= uploadedFiles.length) return;
    
    const fileToRemove = uploadedFiles[index];
    
    // Hapus file dari server jika ada serverData
    if (fileToRemove.serverData) {
      try {
        await uploadAPI.deleteFile(fileToRemove.serverData.filename);
        toast.success('File dihapus dari server');
      } catch (error) {
        console.error('Delete from server error:', error);
        toast.error('Gagal menghapus file dari server');
      }
    }
    
    // Hapus dari state
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Hapus dari mediaUrls
    if (fileToRemove.serverUrl) {
      setFormData(prev => ({
        ...prev,
        mediaUrls: prev.mediaUrls.filter(url => url !== fileToRemove.serverUrl)
      }));
    }
    
    toast.success('File dihapus');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Judul dan konten harus diisi');
      return;
    }

    setLoading(true);
    try {
      const backendVisibility = formData.visibility === 'subscribers_only' 
        ? 'subscribers' 
        : formData.visibility;
      
      // Gunakan mediaUrls yang sudah berisi URL dari server
      const postData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200),
        type: formData.type,
        visibility: backendVisibility,
        mediaUrls: formData.mediaUrls // SUDAH URL DARI SERVER
      };
      
      console.log('Membuat post dengan data:', postData);
      
      const response = await creatorAPI.createPost(postData);
      
      if (response.data.success) {
        toast.success('Post berhasil dibuat!');
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          type: 'article',
          visibility: 'public',
          mediaUrls: []
        });
        setUploadedFiles([]);
        
        setTimeout(() => {
          navigate('/creator/posts');
        }, 1500);
      }
    } catch (error) {
      console.error('Error membuat post:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat post');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = formData.content.length;

  const getFileIcon = (fileType, extension) => {
    if (fileType.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <VideoCameraIcon className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('pdf') || extension === 'pdf') {
      return <DocumentIcon className="h-5 w-5 text-red-500" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <DocumentIcon className="h-5 w-5 text-blue-500" />;
    } else {
      return <PaperClipIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const totalUploadedSize = uploadedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  const totalUploadedSizeMB = (totalUploadedSize / (1024 * 1024)).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button onClick={() => navigate('/creator/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="h-5 w-5 mr-2" /> Kembali ke Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Buat Post Baru</h1>
          <p className="text-gray-600 mt-2">Bagikan konten Anda dengan subscribers</p>
          {user?.role === 'creator' && <p className="text-sm text-blue-600 mt-1">Membuat sebagai: {user.name}</p>}
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Tipe Post</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'article' }))} className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${formData.type === 'article' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <DocumentIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Artikel</span>
                  <span className="text-sm text-gray-500">Konten berbasis teks</span>
                </button>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))} className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${formData.type === 'video' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <VideoCameraIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Video</span>
                  <span className="text-sm text-gray-500">Konten video</span>
                </button>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, type: 'image' }))} className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center ${formData.type === 'image' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <PhotoIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Gambar</span>
                  <span className="text-sm text-gray-500">Foto & gambar</span>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Judul *</label>
              <input id="title" name="title" type="text" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Masukkan judul yang menarik" maxLength={200} />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 karakter</p>
            </div>

            <div className="mb-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">Ringkasan (Opsional)</label>
              <textarea id="excerpt" name="excerpt" rows="2" value={formData.excerpt} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Deskripsi singkat tentang post Anda" maxLength={300} />
              <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/300 karakter</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">Konten *</label>
                <div className="text-sm text-gray-500">{wordCount} kata • {charCount} karakter</div>
              </div>
              <textarea id="content" name="content" rows="12" required value={formData.content} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono" placeholder="Tulis konten Anda di sini..." />
            </div>

            {/* FILE UPLOAD SECTION */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Upload File (Opsional)</label>
                <div className="flex items-center space-x-4">
                  {uploadedFiles.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {uploadedFiles.length} file • {totalUploadedSizeMB}MB
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ Di server
                      </span>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <input type="file" ref={fileInputRef} multiple onChange={(e) => handleFileUpload(e.target.files)} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                      <CloudArrowUpIcon className="h-4 w-4 mr-1" /> 
                      {uploading ? 'Mengupload...' : 'Upload File'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-1">Batas Ukuran File:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
                  <div>• Gambar: 20MB</div><div>• Video: 500MB</div>
                  <div>• PDF: 50MB</div><div>• Dokumen: 100MB</div>
                </div>
              </div>
              
              {uploadedFiles.length > 0 ? (
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">{getFileIcon(file.type, file.extension)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <span>{getFileTypeLabel(file.type.split('/')[0], file.extension)}</span>
                            <span>•</span>
                            <span className="text-green-600 font-medium">✓ Di server</span>
                          </div>
                          {file.serverUrl && (
                            <div className="text-xs text-blue-600 truncate mt-1">
                              URL: {file.serverUrl.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Hapus file">
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Image Preview - langsung dari server URL */}
                  {uploadedFiles.some(f => f.type.startsWith('image/')) && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Gambar dari Server:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {uploadedFiles
                          .filter(f => f.type.startsWith('image/') && f.serverUrl)
                          .map((file, index) => (
                            <div key={file.id} className="relative group">
                              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                <img 
                                  src={file.serverUrl} 
                                  alt={file.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                                  }}
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                                {file.name}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50" onClick={() => fileInputRef.current?.click()}>
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Klik untuk upload file ke server</p>
                  <p className="text-sm text-gray-500 mt-1">File akan langsung diupload ke server</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Visibilitas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))} className={`p-4 rounded-lg border-2 flex items-center ${formData.visibility === 'public' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Publik</div>
                    <div className="text-sm text-gray-500">Terlihat oleh semua orang</div>
                  </div>
                </button>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, visibility: 'subscribers_only' }))} className={`p-4 rounded-lg border-2 flex items-center ${formData.visibility === 'subscribers_only' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Hanya Subscribers</div>
                    <div className="text-sm text-gray-500">Hanya untuk subscribers yang membayar</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {formData.visibility === 'subscribers_only' ? (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 text-purple-600 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                      Post ini akan terkunci untuk non-subscribers
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Post ini akan terlihat oleh semua orang
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button type="button" onClick={() => navigate('/creator/posts')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg">
                    Batal
                  </button>
                  <button type="submit" disabled={loading || uploading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Mempublikasikan...</>) : 'Publikasikan Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePost;