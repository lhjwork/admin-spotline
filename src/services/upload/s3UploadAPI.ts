import axios from 'axios';
import { ApiResponseType } from '../base/types';

// 🖼️ S3 이미지 업로드 API (Live 시스템 - 메인 배너 이미지)
export const s3UploadAPI = {
  // 메인 배너 이미지 업로드 (Live 시스템)
  uploadMainBannerImage: async (storeId: string, file: File): ApiResponseType<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/live/stores/${storeId}/main-banner-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Main banner image upload error:', error);
      throw error;
    }
  },

  // 호환성을 위한 기존 메서드들 (새 API로 리다이렉트)
  uploadRepresentativeImage: async (storeId: string, file: File): ApiResponseType<{ url: string; key: string }> => {
    console.warn('uploadRepresentativeImage is deprecated. Use uploadMainBannerImage instead.');
    return s3UploadAPI.uploadMainBannerImage(storeId, file);
  },

  uploadGalleryImage: async (storeId: string, file: File): ApiResponseType<{ url: string; key: string }> => {
    console.warn('uploadGalleryImage is deprecated. Use uploadMainBannerImage instead.');
    return s3UploadAPI.uploadMainBannerImage(storeId, file);
  },
  
  // 메인 배너 이미지 삭제 (Live 시스템)
  deleteMainBannerImage: async (storeId: string, imageKey: string): ApiResponseType<void> => {
    const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:4000';
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/live/stores/${storeId}/main-banner-images/${encodeURIComponent(imageKey)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Main banner image delete error:', error);
      throw error;
    }
  },
  
  // 호환성을 위한 기존 메서드들 (새 API로 리다이렉트)
  deleteRepresentativeImage: async (storeId: string): ApiResponseType<void> => {
    console.warn('deleteRepresentativeImage is deprecated. Use deleteMainBannerImage instead.');
    throw new Error('Individual representative image deletion is no longer supported. Use deleteMainBannerImage with imageKey.');
  },
  
  deleteGalleryImage: async (imageKey: string): ApiResponseType<void> => {
    console.warn('deleteGalleryImage is deprecated. Use deleteMainBannerImage instead.');
    throw new Error('Gallery images are no longer supported. Use deleteMainBannerImage instead.');
  },
  
  // 진행률과 함께 업로드 (메인 배너 이미지)
  uploadMainBannerImageWithProgress: (storeId: string, file: File, onProgress: (progress: number) => void): Promise<string> => {
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
      
      xhr.open('POST', `${API_BASE_URL}/api/admin/live/stores/${storeId}/main-banner-images`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('admin_token')}`);
      xhr.send(formData);
    });
  },

  // 호환성을 위한 기존 메서드들 (새 API로 리다이렉트)
  uploadRepresentativeImageWithProgress: (storeId: string, file: File, onProgress: (progress: number) => void): Promise<string> => {
    console.warn('uploadRepresentativeImageWithProgress is deprecated. Use uploadMainBannerImageWithProgress instead.');
    return s3UploadAPI.uploadMainBannerImageWithProgress(storeId, file, onProgress);
  },

  uploadGalleryImageWithProgress: (storeId: string, file: File, onProgress: (progress: number) => void): Promise<string> => {
    console.warn('uploadGalleryImageWithProgress is deprecated. Use uploadMainBannerImageWithProgress instead.');
    return s3UploadAPI.uploadMainBannerImageWithProgress(storeId, file, onProgress);
  }
};