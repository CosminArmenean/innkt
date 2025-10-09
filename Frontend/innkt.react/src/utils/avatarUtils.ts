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
    console.log(`🔗 Converting avatar URL: ${avatarUrl} → ${fullUrl}`);
    return fullUrl;
  }
  
  return avatarUrl;
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
