'use client';

import { ImageLoaderProps } from 'next/image';

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  const cdnEnabled = process.env.NEXT_PUBLIC_CDN_ENABLED === 'true';
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_URL || '';
  
  if (cdnEnabled && cdnDomain) {
    return `${cdnDomain}/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
  }
  
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
