import { exportReportCsv } from '@/lib/exportReportCsv';

describe('exportReportCsv', () => {
  it('does nothing without columns or rows', () => {
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    exportReportCsv('empty.csv', [], [{ id: 1 }]);
    exportReportCsv('empty.csv', [{ key: 'id', label: 'ID' }], []);
    expect(createUrl).not.toHaveBeenCalled();
  });

  it('downloads escaped UTF-8 CSV data and revokes the object URL', async () => {
    let blob: Blob | undefined;
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      blob = value as Blob;
      return 'blob:test';
    });
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    exportReportCsv(
      'report.csv',
      [{ key: 'name', label: 'Patient name' }, { key: 'note', label: 'Note' }],
      [{ name: 'Doe, Jane', note: 'said "hello"' }],
    );

    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith('blob:test');
    expect(await blob!.text()).toContain('"Doe, Jane","said ""hello"""');
  });
});
