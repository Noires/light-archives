import SharedConstants from '@app/shared/SharedConstants';

function formatMiB(bytes: number): string {
  const mib = bytes / (1024 * 1024);

  if (Number.isInteger(mib)) {
    return `${mib}`;
  }

  return mib.toFixed(1);
}

export function getMaxUploadSizeMiBLabel(): string {
  return formatMiB(SharedConstants.MAX_UPLOAD_SIZE);
}

export function formatAspectRatioHint(minAspectRatio: number): string {
  if (minAspectRatio === SharedConstants.MIN_BANNER_ASPECT_RATIO) {
    return '4:1';
  }

  if (minAspectRatio === SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
    return '5:2';
  }

  return `${minAspectRatio.toFixed(2)}:1`;
}

export function getRecommendedBannerSize(minAspectRatio: number): string {
  if (minAspectRatio === SharedConstants.MIN_BANNER_ASPECT_RATIO) {
    return `${SharedConstants.RECOMMENDED_BANNER_WIDTH}x${SharedConstants.RECOMMENDED_BANNER_HEIGHT}`;
  }

  if (minAspectRatio === SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
    return `${SharedConstants.RECOMMENDED_DISCORD_BANNER_WIDTH}x${SharedConstants.RECOMMENDED_DISCORD_BANNER_HEIGHT}`;
  }

  const width = SharedConstants.RECOMMENDED_BANNER_WIDTH;
  const height = Math.round(width / minAspectRatio);
  return `${width}x${height}`;
}

export function getImageUploadRequirementsMessage(minAspectRatio: number): string {
  const ratioHint = formatAspectRatioHint(minAspectRatio);
  const recommendedSize = getRecommendedBannerSize(minAspectRatio);
  const maxSizeMiB = getMaxUploadSizeMiBLabel();

  return `Required: minimum aspect ratio ${ratioHint} (width:height), recommended size ${recommendedSize}, formats JPG or PNG, max file size ${maxSizeMiB} MiB.`;
}

export function getBannerAspectRatioErrorMessage(
  bannerType: string,
  width: number,
  height: number,
  minAspectRatio: number,
): string {
  return `${bannerType} has an invalid aspect ratio (${width}x${height}). ${getImageUploadRequirementsMessage(minAspectRatio)}`;
}
