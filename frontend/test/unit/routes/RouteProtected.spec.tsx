import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { useUserStore } from '@/store/useUserStore';
import RouteProtected from '@/routes/RouteProtected';

const { useProfileMock } = vi.hoisted(() => ({
  useProfileMock: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: useProfileMock,
}));

function renderRoute() {
  return renderWithProviders(
    <Routes>
      <Route element={<RouteProtected />}>
        <Route path="/private" element={<p>private patient area</p>} />
      </Route>
      <Route path="/sign-in" element={<p>sign in page</p>} />
      <Route path="/403" element={<p>forbidden page</p>} />
    </Routes>,
    { initialEntries: ['/private'] },
  );
}

describe('RouteProtected', () => {
  beforeEach(() => {
    useUserStore.getState().resetState();
  });

  it('redirects an unauthenticated visitor to sign in', () => {
    useProfileMock.mockReturnValue({ data: undefined, isLoading: false, isFetching: false });
    renderRoute();
    expect(screen.getByText('sign in page')).toBeInTheDocument();
  });

  it('rejects an authenticated non-patient account', () => {
    useProfileMock.mockReturnValue({
      data: { data: { id: 1, roles: [{ role_name: 'DOCTOR' }] } },
      isLoading: false,
      isFetching: false,
    });
    renderRoute();
    expect(screen.getByText('forbidden page')).toBeInTheDocument();
  });

  it('renders the protected outlet for a patient', () => {
    useProfileMock.mockReturnValue({
      data: { data: { id: 2, roles: [{ role_name: 'PATIENT' }] } },
      isLoading: false,
      isFetching: false,
    });
    renderRoute();
    expect(screen.getByText('private patient area')).toBeInTheDocument();
  });

  it('keeps rendering a cached patient while a refetch is in progress', () => {
    useUserStore.getState().setUserInfo({ id: 2, roles: [{ role_name: 'PATIENT' }] } as never);
    useProfileMock.mockReturnValue({ data: undefined, isLoading: false, isFetching: true });
    renderRoute();
    expect(screen.getByText('private patient area')).toBeInTheDocument();
  });
});
