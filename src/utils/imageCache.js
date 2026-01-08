// Simple image preloading cache
const imageCache = new Map();

export const preloadImage = (src) => {
  if (!src || imageCache.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, true);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = (images) => {
  return Promise.allSettled(images.map(src => preloadImage(src)));
};

export const isImageCached = (src) => {
  return imageCache.has(src);
};
