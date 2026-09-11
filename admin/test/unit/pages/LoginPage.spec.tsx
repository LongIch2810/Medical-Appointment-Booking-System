import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { LoginPage } from '@/pages/LoginPage';

const loginMutation = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => loginMutation,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginMutation.mutate.mockClear();
    loginMutation.isPending = false;
  });

  it('submits trimmed credentials through the real form flow', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginPage />);
    await user.type(container.querySelector('#usernameOrEmail')!, '  doctor@example.com  ');
    await user.type(container.querySelector('#password')!, 'secret123');
    await user.click(container.querySelector('button[type="submit"]')!);
    expect(loginMutation.mutate).toHaveBeenCalledWith({
      usernameOrEmail: 'doctor@example.com',
      password: 'secret123',
    });
  });

  it('does not submit incomplete credentials', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginPage />);
    await user.type(container.querySelector('#usernameOrEmail')!, 'doctor@example.com');
    container.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    expect(loginMutation.mutate).not.toHaveBeenCalled();
  });

  it('disables form controls while authentication is pending', () => {
    loginMutation.isPending = true;
    const { container } = renderWithProviders(<LoginPage />);
    expect(container.querySelector('#usernameOrEmail')).toBeDisabled();
    expect(container.querySelector('#password')).toBeDisabled();
    expect(container.querySelector('button[type="submit"]')).toBeDisabled();
  });
});
