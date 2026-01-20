import axios from 'axios';
import { ApiResponseType } from '../base/types';

// 🖼️ S3 이미지 업로드 API
export const s3UploadAPI = {
  // 대표 이미지 업로드
  uploadRepresentativeImage: async (storeId: string, file: File): ApiResponseType<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/stores/${storeId}/representative-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Representative image upload error:', error);
      throw error;
    }
  },

  // 갤러리 이미지 업로드
  uploadGalleryImage: async (storeId: string, file: File): ApiResponseType<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/stores/${storeId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Gallery image upload error:', error);
      throw error;
    }
  },

  // 호환성을 위한 기존 메서드 (deprecated)
  uploadImage: async (file: File, type: string = 'store'): ApiResponseType<{ url: string; key: string }> => {
    console.warn('uploadImage is deprecated. Use uploadRepresentativeImage or uploadGalleryImage instead.');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const S3_API_BASE_URL = import.meta.env['VITE_S3_API_URL'] || 'http://localhost:4001/api';
    
    try {
      const response = await axios.post(`${S3_API_BASE_URL}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  },
  
  deleteImage: async (imageKey: string): ApiResponseType<void> => {
    const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/images/${encodeURIComponent(imageKey)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Image delete error:', error);
      throw error;
    }
  },
  
  // 진행률과 함께 업로드 (대표 이미지)
  uploadRepresentativeImageWithProgress: (storeId: string, file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data.url);
            } else {
              reject(new Error(response.message || '업로드에 실패했습니다.'));
            }
          } catch (error) {
            reject(new Error('서버 응답을 처리할 수 없습니다.'));
          }
        } else {
          reject(new Error(`업로드 실패: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });
      
      xhr.open('POST', `${API_BASE_URL}/api/admin/stores/${storeId}/representative-image`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
      xhr.send(formData);
    });
  },

  // 진행률과 함께 업로드 (갤러리 이미지)
  uploadGalleryImageWithProgress: (storeId: string, file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data.url);
            } else {
              reject(new Error(response.message || '업로드에 실패했습니다.'));
            }
          } catch (error) {
            reject(new Error('서버 응답을 처리할 수 없습니다.'));
          }
        } else {
          reject(new Error(`업로드 실패: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });
      
      xhr.open('POST', `${API_BASE_URL}/api/admin/stores/${storeId}/images`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
      xhr.send(formData);
    });
  },
  
  // 호환성을 위한 기존 메서드 (deprecated)
  getUploadProgress: (file: File, onProgress: (progress: number) => void): Promise<string> => {
    console.warn('getUploadProgress is deprecated. Use uploadRepresentativeImageWithProgress or uploadGalleryImageWithProgress instead.');
    
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'store');
      
      const xhr = new XMLHttpRequest();
      const S3_API_BASE_URL = import.meta.env['VITE_S3_API_URL'] || 'http://localhost:4001/api';
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.data.url);
            } else {
              reject(new Error(response.message || '업로드에 실패했습니다.'));
            }
          } catch (error) {
            reject(new Error('서버 응답을 처리할 수 없습니다.'));
          }
        } else {
          reject(new Error(`업로드 실패: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });
      
      xhr.open('POST', `${S3_API_BASE_URL}/upload/image`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
      xhr.send(formData);
    });
  }
};