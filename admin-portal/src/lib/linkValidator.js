/**
 * Tutorial Link Validator
 * Validates that tutorial content URLs match the selected content type.
 */

const YOUTUBE_PATTERNS = [
  /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)/i,
  /^(https?:\/\/)?(www\.)?(youtu\.be\/)/i,
  /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/)/i,
  /^(https?:\/\/)?(www\.)?(youtube\.com\/shorts\/)/i,
  /^(https?:\/\/)?(www\.)?(youtube\.com\/playlist\?)/i,
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv'];

/**
 * Validates a tutorial URL against the selected content type.
 * @param {string} type - The content type (youtube, video, link, text)
 * @param {string} url - The URL to validate
 * @returns {{ valid: boolean, message: string }}
 */
export function validateTutorialLink(type, url) {
  if (!url || !url.trim()) {
    return { valid: false, message: 'URL cannot be empty.' };
  }

  const trimmedUrl = url.trim().toLowerCase();

  switch (type) {
    case 'youtube': {
      const isYouTubeUrl = YOUTUBE_PATTERNS.some(pattern => pattern.test(url.trim()));
      if (!isYouTubeUrl) {
        // Check what it actually looks like
        const isImage = IMAGE_EXTENSIONS.some(ext => trimmedUrl.includes(ext));
        const isVideo = VIDEO_EXTENSIONS.some(ext => trimmedUrl.includes(ext));
        
        let hint = 'The URL does not appear to be a YouTube link.';
        if (isImage) hint = 'This looks like an image URL, not a YouTube link.';
        else if (isVideo) hint = 'This looks like a direct video URL. Select "Video" type instead, or use a YouTube link.';
        
        return {
          valid: false,
          message: `${hint} YouTube links should be from youtube.com or youtu.be.`,
        };
      }
      return { valid: true, message: '' };
    }

    case 'video': {
      const isImage = IMAGE_EXTENSIONS.some(ext => trimmedUrl.includes(ext));
      if (isImage) {
        return {
          valid: false,
          message: 'This looks like an image URL, not a video. Select "Link" type for images, or provide a video URL.',
        };
      }
      return { valid: true, message: '' };
    }

    case 'link': {
      // Any valid URL is fine for generic links
      try {
        new URL(url.trim());
        return { valid: true, message: '' };
      } catch {
        return {
          valid: false,
          message: 'This does not appear to be a valid URL. Make sure it starts with http:// or https://.',
        };
      }
    }

    case 'text':
      // Text content doesn't need URL validation
      return { valid: true, message: '' };

    default:
      return { valid: true, message: '' };
  }
}
