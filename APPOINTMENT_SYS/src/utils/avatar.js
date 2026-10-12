import api from '../api/axios';

export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // must match the backend limit
const MAX_SIDE = 800; // the server crops to 400x400, so this keeps enough detail

// Phone photos are often several MB. Scale them down in the browser first,
// so the upload is quick and stays under the 2 MB limit.
async function shrink(file) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    return blob ?? file;
  } catch {
    return file; // the browser couldn't decode it; let the server decide
  }
}

// Returns an error message for files we know the server will refuse, or ''.
export function checkAvatarFile(file) {
  if (!AVATAR_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or WebP image.';
  return '';
}

// Uploads a new profile photo and returns the updated user.
export async function uploadAvatar(file) {
  const image = await shrink(file);
  if (image.size > MAX_BYTES) throw new Error('That photo is too large. The limit is 2 MB.');
  const form = new FormData();
  form.append('avatar', image, 'avatar.jpg');
  const { data } = await api.put('/users/me/avatar', form);
  return data.user;
}

export async function removeAvatar() {
  const { data } = await api.delete('/users/me/avatar');
  return data.user;
}
