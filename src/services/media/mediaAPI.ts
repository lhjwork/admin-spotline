import apiClient from "../base/apiClient";

export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  contentLength: number;
  durationSec?: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
  mediaType: "IMAGE" | "VIDEO";
}

export const mediaAPI = {
  getPresignedUrl(req: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return apiClient
      .post<PresignedUrlResponse>("/api/v2/media/presigned-url", req)
      .then((res) => res.data);
  },

  uploadToS3(
    uploadUrl: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 업로드 실패: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("네트워크 오류"));
      xhr.send(file);
    });
  },

  deleteMedia(s3Key: string): Promise<void> {
    return apiClient
      .delete("/api/v2/media", { params: { s3Key } })
      .then(() => undefined);
  },
};
