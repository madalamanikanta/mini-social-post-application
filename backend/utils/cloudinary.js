import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

console.log('Cloudinary enabled =', hasCloudinaryConfig);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    console.log('Cloudinary upload started');
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'mini_social_post_application',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload failed', error);
          reject(error);
          return;
        }
        console.log('Cloudinary upload success', result?.secure_url);
        resolve(result);
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });

export const uploadImage = async (buffer) => {
  if (!hasCloudinaryConfig) {
    throw new Error('Cloudinary configuration is not available. Image uploads are disabled.');
  }

  const result = await uploadFromBuffer(buffer);
  if (!result?.secure_url) {
    throw new Error('Cloudinary did not return a secure URL.');
  }

  return result.secure_url;
};

export const isCloudinaryEnabled = () => hasCloudinaryConfig;
