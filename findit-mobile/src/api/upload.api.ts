import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export interface UploadImageResponse { url: string }
export interface UploadApi { uploadImage: (localUri: string) => Promise<UploadImageResponse> }

export const uploadApi: UploadApi = {
  uploadImage: async (localUri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await axios.post(`${API_BASE_URL}/upload/image`, formData);
    return { url: response.data.url };
  },
};