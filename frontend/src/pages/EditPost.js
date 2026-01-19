import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { creatorAPI } from '../services/api';
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

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  // Fix ESLint warning
  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await creatorAPI.getPostById(id);
      console.log('Post data received:', response.data);
      
      // Extract post data from response
      const postData = response.data.post || response.data.data?.post || response.data;
      
      if (postData) {
        setFormData({
          title: postData.title || '',
          content: postData.content || '',
          excerpt: postData.excerpt || '',
          type: postData.type || 'article',
          visibility: postData.visibility || 'public',
          mediaUrls: postData.mediaUrls || postData.media_urls || []
        });

        // Convert existing media URLs to uploadedFiles format
        const mediaUrls = postData.mediaUrls || postData.media_urls || [];
        const existingFiles = mediaUrls.map((url, index) => ({
          id: `existing-${index}`,
          name: url.split('/').pop() || `File ${index + 1}`,
          size: '0', // Unknown size for existing files
          type: getFileTypeFromUrl(url),
          url: url,
          file: null,
          extension: getFileExtension(url),
          isExisting: true // Flag to identify existing files
        }));

        setUploadedFiles(existingFiles);
      } else {
        toast.error('Post tidak ditemukan');
        navigate('/creator/posts');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Gagal memuat post');
      navigate('/creator/posts');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to detect file type from URL
  const getFileTypeFromUrl = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image/jpeg';
    } else if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
      return 'video/mp4';
    } else if (['mp3', 'wav', 'mpeg'].includes(extension)) {
      return 'audio/mpeg';
    } else if (extension === 'pdf') {
      return 'application/pdf';
    } else {
      return 'application/octet-stream';
    }
  };

  // Helper function to get file extension
  const getFileExtension = (url) => {
    return url.split('.').pop().toLowerCase();
  };

  // Helper function untuk label file type
  const getFileTypeLabel = (fileType, extension) => {
    const labels = {
      'image': 'gambar',
      'video': 'video', 
      'audio': 'audio',
      'application': 'dokumen',
      'text': 'dokumen teks'
    };
    
    if (extension === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'dokumen Word';
    if (['ppt', 'pptx'].includes(extension)) return 'presentasi';
    if (['xls', 'xlsx'].includes(extension)) return 'spreadsheet';
    
    return labels[fileType] || 'file';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload with same logic as CreatePost
  const handleFileUpload = async (files) => {
    const FILE_LIMITS = {
      IMAGE: 20 * 1024 * 1024,           // 20MB untuk gambar
      VIDEO: 500 * 1024 * 1024,          // 500MB untuk video  
      AUDIO: 100 * 1024 * 1024,          // 100MB untuk audio
      PDF: 50 * 1024 * 1024,             // 50MB untuk PDF
      DOCUMENT: 30 * 1024 * 1024,        // 30MB untuk dokumen lain
      DEFAULT: 100 * 1024 * 1024         // 100MB default
    };

    const TOTAL_POST_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB total per post

    const validFiles = Array.from(files).filter(file => {
      // Deteksi tipe file
      const fileType = file.type.split('/')[0]; // 'image', 'video', etc
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // Tentukan limit berdasarkan tipe file
      let limit;
      
      if (fileType === 'image') {
        limit = FILE_LIMITS.IMAGE;
      } else if (fileType === 'video') {
        limit = FILE_LIMITS.VIDEO;
      } else if (fileType === 'audio') {
        limit = FILE_LIMITS.AUDIO;
      } else if (fileExtension === 'pdf' || file.type.includes('pdf')) {
        limit = FILE_LIMITS.PDF;
      } else if (['doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
        limit = FILE_LIMITS.DOCUMENT;
      } else {
        limit = FILE_LIMITS.DEFAULT;
      }

      // Validasi ukuran
      if (file.size > limit) {
        const maxSizeMB = (limit / (1024 * 1024)).toFixed(0);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        
        toast.error(
          `${file.name} (${fileSizeMB}MB) terlalu besar! ` +
          `Maksimal ${maxSizeMB}MB untuk ${getFileTypeLabel(fileType, fileExtension)}`
        );
        return false;
      }

      // Validasi tipe file yang diizinkan
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/mov', 'video/avi', 'video/webm',
        'audio/mpeg', 'audio/mp3', 'audio/wav',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type) && 
          !['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
        toast.error(`${file.name} - Format file tidak didukung`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Validasi total size
    const currentTotalSize = uploadedFiles.reduce((sum, f) => sum + (f.file?.size || 0), 0);
    const newTotalSize = currentTotalSize + validFiles.reduce((sum, f) => sum + f.size, 0);

    if (newTotalSize > TOTAL_POST_LIMIT) {
      toast.error(`Total ukuran file melebihi batas 2GB per post`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = [];
      const totalFiles = validFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = validFiles[i];
        
        setUploadProgress((i / totalFiles) * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Create FormData for file upload (simulation)
        const objectUrl = URL.createObjectURL(file);
        uploadedUrls.push(objectUrl);
        
        // Store file info for display
        setUploadedFiles(prev => [...prev, {
          id: Date.now() + i,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2),
          type: file.type,
          url: objectUrl,
          file: file,
          extension: file.name.split('.').pop().toLowerCase(),
          isNew: true // Flag to identify new files
        }]);
      }

      // Update form data with new media URLs
      const newMediaUrls = uploadedFiles
        .filter(file => !file.isNew || file.isExisting) // Keep existing and mark new ones
        .map(file => file.url);

      setFormData(prev => ({
        ...prev,
        mediaUrls: [...newMediaUrls, ...uploadedUrls]
      }));

      toast.success(`${validFiles.length} file(s) berhasil diupload`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index) => {
    const fileToRemove = uploadedFiles[index];
    
    // Revoke object URL if it's a blob URL (new files)
    if (fileToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    
    // Remove file from uploadedFiles
    const newUploadedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newUploadedFiles);
    
    // Update formData mediaUrls
    const newMediaUrls = newUploadedFiles.map(file => file.url);
    setFormData(prev => ({
      ...prev,
      mediaUrls: newMediaUrls
    }));
    
    toast.success('File berhasil dihapus');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error('Judul dan konten harus diisi');
      return;
    }

    setSaving(true);
    try {
      // Prepare data for API
      const postData = {
        ...formData,
        // Filter out blob URLs for actual submission
        // In real app, you would upload files and get actual URLs
        mediaUrls: uploadedFiles.map(file => file.url)
      };
      
      console.log('Updating post with data:', postData);
      await creatorAPI.updatePost(id, postData);
      toast.success('Post berhasil diperbarui!');
      navigate('/creator/posts');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Gagal memperbarui post');
    } finally {
      setSaving(false);
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
    } else if (fileType.includes('audio')) {
      return <DocumentIcon className="h-5 w-5 text-green-500" />;
    } else if (['doc', 'docx'].includes(extension)) {
      return <DocumentIcon className="h-5 w-5 text-blue-500" />;
    } else if (['xls', 'xlsx'].includes(extension)) {
      return <DocumentIcon className="h-5 w-5 text-green-500" />;
    } else if (['ppt', 'pptx'].includes(extension)) {
      return <DocumentIcon className="h-5 w-5 text-orange-500" />;
    } else {
      return <PaperClipIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Calculate total size of uploaded files
  const totalUploadedSize = uploadedFiles.reduce((sum, file) => sum + (file.file?.size || 0), 0);
  const totalUploadedSizeMB = (totalUploadedSize / (1024 * 1024)).toFixed(1);

  // Count existing vs new files
  const existingFileCount = uploadedFiles.filter(f => f.isExisting).length;
  const newFileCount = uploadedFiles.filter(f => f.isNew).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/creator/posts')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Kembali ke Post
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-gray-600 mt-2">Perbarui konten dan pengaturan Anda</p>
          <p className="text-sm text-blue-600 mt-1">ID Post: {id}</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            {/* Post Type Selection */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Tipe Post</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'article' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition duration-200 ${
                    formData.type === 'article'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <DocumentIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Artikel</span>
                  <span className="text-sm text-gray-500">Konten berbasis teks</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition duration-200 ${
                    formData.type === 'video'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <VideoCameraIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">Video</span>
                  <span className="text-sm text-gray-500">Konten video</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'file' }))}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition duration-200 ${
                    formData.type === 'file'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <PhotoIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="font-medium">File</span>
                  <span className="text-sm text-gray-500">PDF, gambar, dll</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Judul *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                placeholder="Masukkan judul yang menarik"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 karakter
              </p>
            </div>

            {/* Excerpt */}
            <div className="mb-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                Ringkasan (Opsional)
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows="2"
                value={formData.excerpt}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200"
                placeholder="Deskripsi singkat tentang post Anda"
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.excerpt.length}/300 karakter - Ini akan ditampilkan di preview post
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Konten *
                </label>
                <div className="text-sm text-gray-500">
                  {wordCount} kata • {charCount} karakter
                </div>
              </div>
              <textarea
                id="content"
                name="content"
                rows="12"
                required
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono transition duration-200"
                placeholder="Tulis konten Anda di sini..."
              />
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  File Media
                </label>
                <div className="flex items-center space-x-4">
                  {uploadedFiles.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                        {existingFileCount} file lama
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                        {newFileCount} file baru
                      </span>
                      <span className="text-gray-700">
                        {totalUploadedSizeMB}MB / 2GB
                      </span>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                      Upload File Baru
                    </button>
                  </div>
                </div>
              </div>
              
              {/* File Size Limits Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-1">Batas Ukuran File:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
                  <div>• Gambar: 20MB</div>
                  <div>• Video: 500MB</div>
                  <div>• Audio: 100MB</div>
                  <div>• PDF: 50MB</div>
                  <div>• Dokumen: 30MB</div>
                  <div>• Total: 2GB</div>
                </div>
              </div>
              
              {/* Upload Progress */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Mengupload...</span>
                    <span className="text-sm font-medium text-blue-600">{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 ? (
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={file.id} className={`flex items-center justify-between p-3 rounded-lg border transition duration-200 ${
                      file.isExisting 
                        ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' 
                        : file.isNew
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(file.type, file.extension)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                            {file.isExisting && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                File Lama
                              </span>
                            )}
                            {file.isNew && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                File Baru
                              </span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{file.size === '0' ? 'Ukuran tidak tersedia' : `${file.size} MB`}</span>
                            <span>•</span>
                            <span>{getFileTypeLabel(file.type.split('/')[0], file.extension)}</span>
                            <span>•</span>
                            <span className={`font-medium ${
                              file.isExisting ? 'text-yellow-600' : 
                              file.isNew ? 'text-green-600' : 
                              'text-gray-600'
                            }`}>
                              {file.isExisting ? '✓ File tersedia' : '✓ Uploaded'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {(file.type.startsWith('image/') || file.type.startsWith('video/')) && (
                          <button
                            type="button"
                            onClick={() => window.open(file.url, '_blank')}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition duration-200"
                          >
                            Preview
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition duration-200"
                          title="Hapus file"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Image Preview Grid */}
                  {uploadedFiles.some(f => f.type.startsWith('image/')) && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Gambar:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {uploadedFiles
                          .filter(f => f.type.startsWith('image/'))
                          .map((file, index) => (
                            <div key={file.id} className="relative group">
                              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="absolute top-2 left-2">
                                {file.isExisting ? (
                                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                                    Lama
                                  </span>
                                ) : file.isNew ? (
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                    Baru
                                  </span>
                                ) : null}
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition duration-200 rounded-lg flex items-center justify-center">
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition duration-200">
                                  <button
                                    type="button"
                                    onClick={() => window.open(file.url, '_blank')}
                                    className="text-white bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition duration-200"
                                    title="Preview"
                                  >
                                    <PhotoIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(uploadedFiles.findIndex(f => f.id === file.id))}
                                    className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full transition duration-200"
                                    title="Hapus"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
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
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Post ini belum memiliki file</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Klik untuk upload file baru atau tambahkan URL media
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <PhotoIcon className="h-3 w-3 mr-1" />
                      Gambar (20MB)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <VideoCameraIcon className="h-3 w-3 mr-1" />
                      Video (500MB)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <DocumentIcon className="h-3 w-3 mr-1" />
                      Audio (100MB)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <DocumentIcon className="h-3 w-3 mr-1" />
                      PDF (50MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Media URL Option */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Tambahkan Media URL (Opsional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt('Masukkan URL media (gambar, video, dll):');
                    if (url) {
                      const newFile = {
                        id: Date.now(),
                        name: url.split('/').pop() || 'Media URL',
                        size: '0',
                        type: getFileTypeFromUrl(url),
                        url: url,
                        file: null,
                        extension: getFileExtension(url),
                        isUrl: true
                      };
                      
                      setUploadedFiles(prev => [...prev, newFile]);
                      setFormData(prev => ({
                        ...prev,
                        mediaUrls: [...prev.mediaUrls, url]
                      }));
                      
                      toast.success('URL media berhasil ditambahkan');
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  + Tambah URL Media
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Gunakan opsi ini untuk menambahkan media dari URL eksternal jika file sudah dihosting di tempat lain
              </p>
            </div>

            {/* Visibility */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Visibilitas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                  className={`p-4 rounded-lg border-2 flex items-center transition duration-200 ${
                    formData.visibility === 'public'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-2 bg-green-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Publik</div>
                    <div className="text-sm text-gray-500">Terlihat oleh semua orang</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, visibility: 'subscribers_only' }))}
                  className={`p-4 rounded-lg border-2 flex items-center transition duration-200 ${
                    formData.visibility === 'subscribers_only'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Hanya Subscribers</div>
                    <div className="text-sm text-gray-500">Hanya untuk subscribers yang membayar</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {formData.visibility === 'subscribers_only' ? (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 text-purple-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Post ini akan terkunci untuk non-subscribers
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Post ini akan terlihat oleh semua orang
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/creator/posts')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Memperbarui...
                      </>
                    ) : (
                      'Perbarui Post'
                    )}
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

export default EditPost;