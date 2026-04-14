export interface UploadImageResponse { url: string }
export interface UploadApi { uploadImage: (localUri: string) => Promise<UploadImageResponse> }

export const uploadApi: UploadApi = {
  uploadImage: async () => { throw new Error('uploadApi.uploadImage is not implemented yet.'); },
};
