import cloudinary from "cloudinary";

export const uploadImg = async (
  dataArray: any[],
  folder: string
): Promise<void> => {
  try {
    for (let i = 0; i < dataArray.length; i++) {
      const data = dataArray[i];
      if (data.thumbnail) {
        const myCloud: cloudinary.UploadApiResponse =
          await cloudinary.v2.uploader.upload(data.thumbnail as string, {
            folder,
          });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

export const deleteImg = async (url: string): Promise<void> => {
  try {
    await cloudinary.v2.uploader.destroy(url);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};
