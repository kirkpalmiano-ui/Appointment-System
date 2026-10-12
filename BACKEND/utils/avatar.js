import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import ApiError from './ApiError.js';

// Profile photos are stored on Cloudinary; MongoDB only keeps the image URL.
// Every user has one fixed public ID, so a new photo overwrites the old one
// and nothing is left behind on Cloudinary.

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const FOLDER = 'cliniquick/avatars';

const configured = Boolean(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
if (configured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

function assertConfigured() {
  if (!configured) throw new ApiError(503, "Profile photos aren't set up on this server yet.");
}

// The browser-supplied MIME type can be faked, so check the file's first bytes too.
function isAllowedImage(buffer) {
  const hex = buffer.subarray(0, 12).toString('hex');
  const isJpeg = hex.startsWith('ffd8ff');
  const isPng = hex.startsWith('89504e470d0a1a0a');
  const isWebp = hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TYPE_ERROR = 'Please choose a JPG, PNG or WebP image.';

// Parses the multipart upload (field "avatar") into memory; nothing touches the disk.
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
  fileFilter: (_req, file, callback) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return callback(null, true);
    callback(new ApiError(400, TYPE_ERROR));
  },
}).single('avatar');

export function parseAvatarUpload(req, res, next) {
  parser(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'That photo is too large. The limit is 2 MB.' : 'Please upload a single photo in the "avatar" field.';
      return next(new ApiError(400, message, [{ field: 'avatar', message }]));
    }
    next(err);
  });
}

const publicIdFor = (userId) => `${FOLDER}/user_${userId}`;

// Uploads a square, face-centred 400x400 version and returns its HTTPS URL.
export async function uploadAvatar(userId, file) {
  assertConfigured();
  if (!file) throw new ApiError(400, 'Choose a photo to upload.', [{ field: 'avatar', message: 'Choose a photo to upload.' }]);
  if (!isAllowedImage(file.buffer)) throw new ApiError(400, TYPE_ERROR, [{ field: 'avatar', message: TYPE_ERROR }]);

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicIdFor(userId),
        overwrite: true,
        invalidate: true, // refresh Cloudinary's CDN cache for the old photo
        resource_type: 'image',
        format: 'jpg',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto' }],
      },
      (error, uploaded) => (error ? reject(error) : resolve(uploaded))
    );
    stream.end(file.buffer);
  }).catch((error) => {
    console.error('Cloudinary upload failed:', error.message);
    throw new ApiError(502, "We couldn't save your photo right now. Please try again.");
  });

  // The URL includes the version number, so browsers fetch the new photo right away.
  return result.secure_url;
}

// Deletes the user's photo from Cloudinary. Never throws: a leftover image
// shouldn't block removing the photo from the profile or deleting the account.
export async function deleteAvatar(userId) {
  if (!configured) return;
  try {
    await cloudinary.uploader.destroy(publicIdFor(userId), { invalidate: true, resource_type: 'image' });
  } catch (error) {
    console.error('Cloudinary delete failed:', error.message);
  }
}
