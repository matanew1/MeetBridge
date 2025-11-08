// Export all UI components
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as EmptyState } from './EmptyState';
export { default as Badge } from './Badge';
export { default as EnhancedEmptyState } from './EnhancedEmptyState';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as ErrorRetry } from './ErrorRetry';

// Default export (required for expo-router)
export default function UIComponents() {
  return null;
}
export {
  default as Skeleton,
  SkeletonAvatar,
  SkeletonText,
  SkeletonCard,
  SkeletonProfileCard,
} from './Skeleton';
export {
  ProfileCardSkeleton,
  ChatListItemSkeleton,
  ConnectionCardSkeleton,
  MessageSkeleton,
  ProfileDetailSkeleton,
  DiscoveryScreenSkeleton,
  ChatScreenSkeleton,
  ConnectionsGridSkeleton,
} from './SkeletonLoaders';

// Re-export types
export type { ButtonVariant, ButtonSize } from './Button';
export type { CardVariant } from './Card';
export type {
  EmptyStateType,
  EnhancedEmptyStateProps,
} from './EnhancedEmptyState';
export type { LoadingOverlayProps } from './LoadingOverlay';
export type { ErrorRetryProps } from './ErrorRetry';
