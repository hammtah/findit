import axios from 'axios';

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

    const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
    const response = await axios.post(`${API_URL}/upload/image`, formData);
    return { url: response.data.url };
  },
};