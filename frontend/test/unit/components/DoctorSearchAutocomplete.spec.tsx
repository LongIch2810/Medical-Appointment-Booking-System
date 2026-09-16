import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';

const axiosMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/configs/axios', () => ({ default: axiosMock }));

import DoctorSearchAutocomplete from '@/components/search/DoctorSearchAutocomplete';

function Harness({ onSubmit }: { onSubmit?: () => void } = {}) {
  const [value, setValue] = useState('');
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  return (
    <div>
      <DoctorSearchAutocomplete
        value={value}
        onChange={setValue}
        onSelectSpecialty={setSpecialtyId}
        onSubmit={onSubmit}
        placeholder="Tìm bác sĩ"
      />
      <span data-testid="value">{value}</span>
      <span data-testid="specialty-id">{specialtyId ?? ''}</span>
    </div>
  );
}

function mockSuggestions(doctors: unknown[] = [], specialties: unknown[] = []) {
  return {
    data: { success: true, data: { doctors, specialties } },
  };
}

describe('DoctorSearchAutocomplete', () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
  });

  it('debounces the suggestions request instead of firing on every keystroke', async () => {
    axiosMock.get.mockResolvedValue(mockSuggestions());
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'ti');

    expect(axiosMock.get).not.toHaveBeenCalled();

    await waitFor(() => expect(axiosMock.get).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    });
    expect(axiosMock.get).toHaveBeenCalledWith('/doctors/suggestions', {
      params: { search: 'ti' },
      signal: expect.anything(),
    });
  });

  it('renders doctor and specialty suggestion groups and lets a doctor selection fill the input', async () => {
    axiosMock.get.mockResolvedValue(
      mockSuggestions(
        [{ id: 1, fullname: 'Nguyễn Văn An', picture: null, specialty: 'Tim mạch' }],
        [{ id: 2, name: 'Tim mạch' }],
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'tim');

    const doctorItem = await screen.findByText('Nguyễn Văn An');
    // "Tim mạch" appears twice: as the doctor row's specialty subtext and as
    // the separate "Chuyên khoa" suggestion item.
    expect(screen.getAllByText('Tim mạch')).toHaveLength(2);

    await user.click(doctorItem);

    expect(screen.getByTestId('value')).toHaveTextContent('Nguyễn Văn An');
    expect(screen.getByTestId('specialty-id')).toHaveTextContent('');
  });

  it('selecting a specialty suggestion clears the free-text search and reports the specialty id', async () => {
    axiosMock.get.mockResolvedValue(
      mockSuggestions([], [{ id: 2, name: 'Tim mạch' }]),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'tim');

    const specialtyItem = await screen.findByText('Tim mạch');
    await user.click(specialtyItem);

    expect(screen.getByTestId('value')).toHaveTextContent('');
    expect(screen.getByTestId('specialty-id')).toHaveTextContent('2');
  });

  it('clears the previous selection state once the user edits the input again', async () => {
    axiosMock.get.mockResolvedValue(
      mockSuggestions([{ id: 1, fullname: 'Nguyễn Văn An', picture: null, specialty: null }]),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'nguyen');
    const doctorItem = await screen.findByText('Nguyễn Văn An');
    await user.click(doctorItem);
    expect(screen.getByTestId('value')).toHaveTextContent('Nguyễn Văn An');

    await user.type(input, ' anh');
    expect(screen.getByTestId('value')).toHaveTextContent('Nguyễn Văn An anh');
    await waitFor(() =>
      expect(axiosMock.get).toHaveBeenLastCalledWith('/doctors/suggestions', {
        params: { search: 'Nguyễn Văn An anh' },
        signal: expect.anything(),
      }),
    );
  });

  it('pressing Enter with no suggestion list open calls onSubmit like the search button would', async () => {
    axiosMock.get.mockResolvedValue(mockSuggestions());
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'a');
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('pressing Enter while suggestions are showing but unnavigated still submits the typed text as-is (does not silently pick a suggestion)', async () => {
    axiosMock.get.mockResolvedValue(
      mockSuggestions([{ id: 1, fullname: 'Nguyễn Văn An', picture: null, specialty: null }]),
    );
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'nguyen');
    await screen.findByText('Nguyễn Văn An');

    // No ArrowDown/ArrowUp pressed — the user just typed their own text and
    // hit Enter without ever intending to pick a suggestion.
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('value')).toHaveTextContent('nguyen');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('pressing ArrowDown to explicitly highlight a suggestion, then Enter, selects that suggestion', async () => {
    axiosMock.get.mockResolvedValue(
      mockSuggestions([{ id: 1, fullname: 'Nguyễn Văn An', picture: null, specialty: null }]),
    );
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'nguyen');
    await screen.findByText('Nguyễn Văn An');

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('value')).toHaveTextContent('Nguyễn Văn An');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('closes the dropdown on Escape', async () => {
    axiosMock.get.mockResolvedValue(
      mockSuggestions([{ id: 1, fullname: 'Nguyễn Văn An', picture: null, specialty: null }]),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'nguyen');
    await screen.findByText('Nguyễn Văn An');

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Nguyễn Văn An')).not.toBeInTheDocument();
  });

  it('shows a loading row while fetching and an empty row when nothing matches', async () => {
    let resolveFetch: (value: ReturnType<typeof mockSuggestions>) => void = () => {};
    axiosMock.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'zzz');

    expect(await screen.findByText('Đang tìm...')).toBeInTheDocument();

    resolveFetch(mockSuggestions([], []));

    expect(
      await screen.findByText('Không tìm thấy bác sĩ hoặc chuyên khoa phù hợp.'),
    ).toBeInTheDocument();
  });

  it('shows an inline error without throwing when the request fails', async () => {
    axiosMock.get.mockRejectedValue(new Error('network down'));
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'zzz');

    expect(
      await screen.findByText('Không thể tải gợi ý. Vui lòng thử lại.'),
    ).toBeInTheDocument();
    expect(input).toHaveValue('zzz');
  });

  it('does not let a stale in-flight response overwrite a newer query result', async () => {
    const deferred: Record<string, (value: ReturnType<typeof mockSuggestions>) => void> = {};
    axiosMock.get.mockImplementation(
      (_url: string, config: { params: { search: string } }) =>
        new Promise((resolve) => {
          deferred[config.params.search] = resolve;
        }),
    );
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    const input = screen.getByPlaceholderText('Tìm bác sĩ');
    await user.type(input, 'ti');
    await waitFor(() => expect(deferred['ti']).toBeDefined());

    await user.type(input, 'm');
    await waitFor(() => expect(deferred['tim']).toBeDefined());

    // Newer query ("tim") resolves first.
    deferred['tim'](
      mockSuggestions([{ id: 2, fullname: 'Trần Thị Tím', picture: null, specialty: null }]),
    );
    await screen.findByText('Trần Thị Tím');

    // Older, now-stale query ("ti") resolves after — must not clobber the UI.
    deferred['ti'](
      mockSuggestions([{ id: 1, fullname: 'Old Stale Doctor', picture: null, specialty: null }]),
    );

    await waitFor(() => {
      expect(screen.queryByText('Old Stale Doctor')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Trần Thị Tím')).toBeInTheDocument();
  });
});
