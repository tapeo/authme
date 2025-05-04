import { Storage } from "@google-cloud/storage";
import fs from "fs";
import { appConfig } from "..";

export class GoogleStorageExtension {
  private storage: Storage;
  private bucketName: string;
  private projectId: string;

  constructor() {
    this.projectId = appConfig.google_storage!.project_id;
    this.bucketName = appConfig.google_storage!.bucket_name;

    const privateKey = appConfig.google_storage!.private_key;
    const clientEmail = appConfig.google_storage!.client_email;

    if (
      !this.projectId ||
      !this.bucketName ||
      !privateKey ||
      !clientEmail
    ) {
      throw new Error(
        "Missing required Google Cloud Storage configuration in environment variables"
      );
    }

    const privateKeyParsed = privateKey.replace(/\\n/g, "\n");

    this.storage = new Storage({
      credentials: {
        private_key: privateKeyParsed,
        client_email: clientEmail,
      },
    });
  }

  async uploadFile(
    multerFile: Express.Multer.File,
    destination: string
  ): Promise<string> {
    const contentType: string = multerFile.mimetype;
    const contentLength: number = multerFile.size;
    const fileBuffer = fs.readFileSync(multerFile.path);

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(destination);

    // Set Content-Disposition to inline for PDFs
    const isPdf = contentType === "application/pdf";
    const metadata: any = { contentType, contentLength };
    if (isPdf) {
      metadata.contentDisposition = "inline";
    }

    const blobStream = file.createWriteStream({
      contentType,
      metadata,
    });

    return new Promise<string>((resolve, reject) => {
      blobStream.on("error", (err) => {
        console.error("Upload error:", err);
        reject(err);
      });

      blobStream.on("finish", async () => {
        // Ensure metadata is set after upload (for some GCS configs)
        if (isPdf) {
          await file.setMetadata({ contentDisposition: "inline" });
        }
        const publicUrl = file.publicUrl();
        resolve(publicUrl);
      });

      blobStream.end(fileBuffer);
    });
  }

  async deleteFile(path: string) {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(path);
    await file.delete();
  }
}
