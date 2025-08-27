import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface LoadingIndicatorProps {
  loading: boolean;
  text?: string;
  color?: string;
  size?: 'small' | 'large';
  style?: any;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  loading,
  text = "Loading...",
  color = "#8B5CF6",
  size = "large",
  style,
}) => {
  if (!loading) return null;

  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      <Text style={[styles.loadingText, { color }]}>{text}</Text>
    </View>
  );
};

interface ErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  style?: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  style,
}) => {
  if (!error) return null;

  return (
    <View style={[styles.errorContainer, style]}>
      <Text style={styles.errorText}>{error}</Text>
      {onRetry && (
        <Text style={styles.retryText} onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  );
};

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon = "📋",
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.emptyState, style]}>
      <Text style={styles.emptyStateIcon}>{icon}</Text>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
      )}
      {actionText && onAction && (
        <Text style={styles.emptyStateButton} onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryText: {
    fontSize: 12,
    color: '#8b5cf6',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    overflow: 'hidden',
  },
});

export default { LoadingIndicator, ErrorMessage, EmptyState };