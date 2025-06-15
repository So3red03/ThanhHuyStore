import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

// Extract MongoDB URI from DATABASE_URL (remove prisma-specific params)
const MONGODB_URI = process.env.DATABASE_URL?.split('?')[0] || process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'thanhhuystore';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export interface PDFDocument {
  _id?: ObjectId;
  orderId: string;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
  metadata: {
    orderPaymentIntentId: string;
    userId: string;
    type: 'invoice' | 'receipt';
  };
}

export class MongoService {
  private static async getClient(): Promise<MongoClient> {
    return clientPromise;
  }

  private static async getGridFSBucket(): Promise<GridFSBucket> {
    const client = await this.getClient();
    const db = client.db(DB_NAME);
    return new GridFSBucket(db, { bucketName: 'pdfs' });
  }

  /**
   * Lưu PDF buffer vào MongoDB GridFS
   */
  static async savePDF(
    pdfBuffer: Buffer,
    orderId: string,
    orderPaymentIntentId: string,
    userId: string,
    type: 'invoice' | 'receipt' = 'invoice'
  ): Promise<ObjectId> {
    try {
      const bucket = await this.getGridFSBucket();
      
      const filename = `${type}_${orderPaymentIntentId}_${Date.now()}.pdf`;
      
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          orderId,
          orderPaymentIntentId,
          userId,
          type,
        },
      });

      return new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
          resolve(uploadStream.id as ObjectId);
        });

        uploadStream.end(pdfBuffer);
      });
    } catch (error) {
      console.error('Error saving PDF to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Lấy PDF từ MongoDB GridFS
   */
  static async getPDF(fileId: string): Promise<{ buffer: Buffer; metadata: any }> {
    try {
      const bucket = await this.getGridFSBucket();
      const objectId = new ObjectId(fileId);

      // Get file info
      const fileInfo = await bucket.find({ _id: objectId }).toArray();
      if (fileInfo.length === 0) {
        throw new Error('PDF not found');
      }

      // Get file buffer
      const downloadStream = bucket.openDownloadStream(objectId);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('error', reject);
        downloadStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            metadata: fileInfo[0],
          });
        });
      });
    } catch (error) {
      console.error('Error getting PDF from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách PDF theo orderId
   */
  static async getPDFsByOrderId(orderId: string): Promise<PDFDocument[]> {
    try {
      const bucket = await this.getGridFSBucket();
      
      const files = await bucket.find({ 'metadata.orderId': orderId }).toArray();
      
      return files.map(file => ({
        _id: file._id as ObjectId,
        orderId: file.metadata?.orderId,
        filename: file.filename,
        contentType: 'application/pdf',
        size: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata as {
          orderPaymentIntentId: string;
          userId: string;
          type: 'invoice' | 'receipt';
        },
      }));
    } catch (error) {
      console.error('Error getting PDFs by order ID:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách PDF theo userId
   */
  static async getPDFsByUserId(userId: string): Promise<PDFDocument[]> {
    try {
      const bucket = await this.getGridFSBucket();
      
      const files = await bucket.find({ 'metadata.userId': userId }).toArray();
      
      return files.map(file => ({
        _id: file._id as ObjectId,
        orderId: file.metadata?.orderId,
        filename: file.filename,
        contentType: 'application/pdf',
        size: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata as {
          orderPaymentIntentId: string;
          userId: string;
          type: 'invoice' | 'receipt';
        },
      }));
    } catch (error) {
      console.error('Error getting PDFs by user ID:', error);
      throw error;
    }
  }

  /**
   * Xóa PDF
   */
  static async deletePDF(fileId: string): Promise<void> {
    try {
      const bucket = await this.getGridFSBucket();
      const objectId = new ObjectId(fileId);
      
      await bucket.delete(objectId);
    } catch (error) {
      console.error('Error deleting PDF:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra PDF có tồn tại không
   */
  static async pdfExists(orderId: string, type: 'invoice' | 'receipt' = 'invoice'): Promise<boolean> {
    try {
      const bucket = await this.getGridFSBucket();
      
      const files = await bucket.find({ 
        'metadata.orderId': orderId,
        'metadata.type': type 
      }).toArray();
      
      return files.length > 0;
    } catch (error) {
      console.error('Error checking PDF existence:', error);
      return false;
    }
  }
}

export default MongoService;
