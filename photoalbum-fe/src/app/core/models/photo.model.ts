export interface Photo {
  id: number;
  name: string;
  uploadedAt: string;
  imageUrl: string;
  userId?: string;
  userName?: string;
}
