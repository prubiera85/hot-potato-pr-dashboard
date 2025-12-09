/**
 * Environment detection utilities
 */

export const isDevelopmentBuild = (): boolean => {
  // Check if we're on development branch or local development
  const branch = typeof __BRANCH__ !== 'undefined' ? __BRANCH__ : 'local';
  const context = typeof __CONTEXT__ !== 'undefined' ? __CONTEXT__ : 'local';

  // Return true if:
  // 1. Branch is 'development'
  // 2. Context is 'branch-deploy' and not production
  // 3. Running locally (for testing)
  return (
    branch === 'development' ||
    branch === 'local' ||
    (context === 'branch-deploy' && branch !== 'main')
  );
};

export const getBranchName = (): string => {
  return typeof __BRANCH__ !== 'undefined' ? __BRANCH__ : 'local';
};

export const getBuildContext = (): string => {
  return typeof __CONTEXT__ !== 'undefined' ? __CONTEXT__ : 'local';
};
