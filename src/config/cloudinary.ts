import { v2 as cloudinary } from "cloudinary";

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

class CloudinaryService {
  private static instance: CloudinaryService;

  private constructor(private readonly config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    });

    console.log("Cloudinary Connection Established!");
  }

  static getInstance(config: CloudinaryConfig): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService(config);
    }
    return CloudinaryService.instance;
  }
}

export default CloudinaryService;
