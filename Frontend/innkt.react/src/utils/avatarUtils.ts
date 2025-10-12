/**
 * Convert relative avatar URLs to full URLs pointing to Officer service
 */
export const convertToFullAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }
  
  if (avatarUrl.startsWith('/')) {
    const fullUrl = `http://localhost:5001${avatarUrl}`;
    // console.log(`🔗 Converting avatar URL: ${avatarUrl} → ${fullUrl}`); // Commented out to reduce console noise
    return fullUrl;
  }
  
  return avatarUrl;
};

/**
 * Convert relative group image URLs to full URLs pointing to Groups service
 */
export const convertToFullGroupImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('/')) {
    const fullUrl = `http://localhost:5002${imageUrl}`;
    // console.log(`🔗 Converting group image URL: ${imageUrl} → ${fullUrl}`); // Commented out to reduce console noise
    return fullUrl;
  }
  
  return imageUrl;
};

/**
 * Get user display name with fallback
 */
export const getUserDisplayName = (user?: { displayName?: string; username?: string; id?: string }): string => {
  if (!user) return 'Unknown User';
  return user.displayName || user.username || `User ${user.id?.substring(0, 8) || 'Unknown'}`;
};

/**
 * Get user initial for avatar fallback
 */
export const getUserInitial = (user?: { displayName?: string; username?: string; id?: string }): string => {
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
};
