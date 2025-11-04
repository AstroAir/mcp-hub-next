import { shouldNotify, clearNotify, buildErrorKey, getTroubleshootingTips } from './error-dedupe';

jest.useFakeTimers();

describe('error-dedupe', () => {
  it('shows only once within cooldown', () => {
    const key = 'k1';
    expect(shouldNotify(key, 1000)).toBe(true);
    expect(shouldNotify(key, 1000)).toBe(false);
    jest.advanceTimersByTime(1000);
    expect(shouldNotify(key, 1000)).toBe(true);
  });

  it('clearNotify resets cooldown', () => {
    const key = 'k2';
    expect(shouldNotify(key, 5000)).toBe(true);
    clearNotify(key);
    expect(shouldNotify(key, 5000)).toBe(true);
  });

  it('buildErrorKey composes stable key', () => {
    const key = buildErrorKey('p', 'id', 'message here');
    expect(key).toBe('p:id:message here');
    expect(buildErrorKey('p')).toBe('p');
  });

  it('getTroubleshootingTips returns category-specific hints', () => {
    expect(getTroubleshootingTips('network error')).toEqual(
      expect.arrayContaining(['Check your internet connection and retry.'])
    );
    expect(getTroubleshootingTips('npm')).toEqual(
      expect.arrayContaining(['Ensure Node.js and npm are installed and available in PATH.'])
    );
    expect(getTroubleshootingTips('github 404')).toEqual(
      expect.arrayContaining(['Verify the GitHub repository exists and is public or you have access.'])
    );
    expect(getTroubleshootingTips('EACCES')).toEqual(
      expect.arrayContaining(['Try running the app with sufficient permissions.'])
    );
  });
});
