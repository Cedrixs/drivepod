import { describe, it, expect, vi, beforeEach } from 'vitest';

const findOrCreateFolder = vi.fn<(name: string, parentId: string) => Promise<string>>();
const moveFile = vi.fn<(fileId: string, from: string, to: string) => Promise<void>>();
const removeFromStateAndSync = vi.fn<(fileId: string) => Promise<void>>();

vi.mock('../drive/api', () => ({
  findOrCreateFolder: (name: string, parentId: string) => findOrCreateFolder(name, parentId),
  moveFile: (fileId: string, from: string, to: string) => moveFile(fileId, from, to),
}));
vi.mock('../state/driveState', () => ({
  removeFromStateAndSync: (fileId: string) => removeFromStateAndSync(fileId),
}));

const { createArchiveResolver, archiveOne } = await import('../drive/archive');

describe('archive resolver', () => {
  beforeEach(() => {
    findOrCreateFolder.mockReset();
    moveFile.mockReset().mockResolvedValue(undefined);
    removeFromStateAndSync.mockReset().mockResolvedValue(undefined);
    findOrCreateFolder.mockImplementation(async (name, parentId) => `${parentId}/${name}`);
  });

  it('builds Audio/Archive/<week>/<source> and moves the file', async () => {
    const resolver = createArchiveResolver('audio');
    await archiveOne(resolver, { fileId: 'f1', sourceFolder: 'Articles', sourceFolderId: 'src', weekKey: '2026-S28' });

    expect(findOrCreateFolder.mock.calls).toEqual([
      ['Archive', 'audio'],
      ['2026-S28', 'audio/Archive'],
      ['Articles', 'audio/Archive/2026-S28'],
    ]);
    expect(moveFile).toHaveBeenCalledWith('f1', 'src', 'audio/Archive/2026-S28/Articles');
    expect(removeFromStateAndSync).toHaveBeenCalledWith('f1');
  });

  it('resolves each folder level once for a batch', async () => {
    const resolver = createArchiveResolver('audio');
    await Promise.all([
      archiveOne(resolver, { fileId: 'f1', sourceFolder: 'Articles', sourceFolderId: 's1', weekKey: '2026-S28' }),
      archiveOne(resolver, { fileId: 'f2', sourceFolder: 'Articles', sourceFolderId: 's1', weekKey: '2026-S28' }),
      archiveOne(resolver, { fileId: 'f3', sourceFolder: 'Audio', sourceFolderId: 's2', weekKey: '2026-S28' }),
    ]);

    // Archive + semaine + deux sources = 4 résolutions, pas 9
    expect(findOrCreateFolder).toHaveBeenCalledTimes(4);
    expect(moveFile).toHaveBeenCalledTimes(3);
  });

  it('forgets a failed resolution so the next call can retry', async () => {
    findOrCreateFolder
      .mockRejectedValueOnce(new Error('network'))
      .mockImplementation(async (name, parentId) => `${parentId}/${name}`);
    const resolver = createArchiveResolver('audio');

    await expect(resolver.destination('2026-S28', 'Articles')).rejects.toThrow('network');
    await expect(resolver.destination('2026-S28', 'Articles')).resolves.toBe('audio/Archive/2026-S28/Articles');
  });
});
