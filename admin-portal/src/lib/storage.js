/**
 * Firebase Storage Helpers
 * Handles file uploads for images, videos, and code files.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - Storage path (e.g., 'bootcamps/abc123/tasks/task1/image.png')
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL
 */
export function uploadFile(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files, basePath, onProgress) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = `${basePath}/${Date.now()}_${file.name}`;
    const url = await uploadFile(file, path, (progress) => {
      if (onProgress) {
        const overall = ((i + progress / 100) / files.length) * 100;
        onProgress(overall);
      }
    });
    urls.push({ name: file.name, url, type: file.type, size: file.size });
  }
  return urls;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(url) {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Generate a storage path for bootcamp files
 */
export function getStoragePath(bootcampId, category, fileName) {
  return `bootcamps/${bootcampId}/${category}/${Date.now()}_${fileName}`;
}
