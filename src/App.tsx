import { useState, useCallback, useEffect, useRef } from 'react';
import { AuthScreen } from './ui/AuthButton';
import { SourceTabs } from './ui/SourceTabs';
import { FileList } from './ui/FileList';
import { PlayerBar } from './ui/PlayerBar';
import { PlayerFull } from './ui/PlayerFull';
import { Settings } from './ui/Settings';
import { OfflineBanner } from './ui/OfflineBanner';
import { SettingsIcon, RefreshIcon } from './ui/icons';
import { useApp } from './hooks/useApp';
import { usePlayer } from './hooks/usePlayer';
import { useOnline } from './hooks/useOnline';
import { getLocalPlaybackState } from './state/driveState';
import { getSettings } from './state/db';
import type { DriveFile } from './drive/types';

export default function App(): React.JSX.Element {
  const online = useOnline();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Ref to archiveFile so the player callback can access it without stale closure
  const archiveFileRef = useRef<
    (id: string, name: string, source: string, sourceFolderId: string) => Promise<void>
  >(() => Promise.resolve());

  const handleArchiveFromPlayer = useCallback(
    (fileId: string, fileName: string, sourceFolder: string) => {
      void archiveFileRef.current(fileId, fileName, sourceFolder, '');
    },
    [],
  );

  const { state: playerState, ...playerActions } = usePlayer(handleArchiveFromPlayer);

  const { state: appState, refresh, archiveFile, setActiveSource, refreshQueueCount } = useApp(online);

  // Keep ref in sync
  useEffect(() => {
    archiveFileRef.current = (fileId, fileName, sourceFolder, _sourceFolderId) => {
      const source = appState.sources.find(
        (s) => s.folder.name === sourceFolder || s.files.some((f) => f.id === fileId),
      );
      return archiveFile(fileId, fileName, source?.folder.name ?? sourceFolder, source?.folder.id ?? '');
    };
  }, [appState.sources, archiveFile]);

  const handlePlayFile = useCallback(async (file: DriveFile, index: number): Promise<void> => {
    const activeSource = appState.sources[appState.activeSourceIndex];
    if (!activeSource) return;

    const settings = await getSettings();
    playerActions.setQueue(activeSource.files, activeSource.folder.name, index);
    playerActions.setSpeed(settings.defaultSpeed);
    playerActions.setSkipSeconds(settings.skipForwardSeconds);

    const savedState = await getLocalPlaybackState(file.id);
    await playerActions.loadAndPlay(file, activeSource.folder.name, savedState?.position ?? 0);
  }, [appState.sources, appState.activeSourceIndex, playerActions]);

  const handleArchive = useCallback(async (file: DriveFile): Promise<void> => {
    const source = appState.sources.find((s) => s.files.some((f) => f.id === file.id));
    if (!source) return;
    await archiveFile(file.id, file.name, source.folder.name, source.folder.id);
    await refreshQueueCount();
  }, [appState.sources, archiveFile, refreshQueueCount]);

  const handleArchiveCurrentPlaying = useCallback(async (): Promise<void> => {
    const file = playerState.currentFile;
    if (!file) return;
    const source = appState.sources.find((s) => s.files.some((f) => f.id === file.id));
    const sourceFolderId = source?.folder.id ?? '';
    const sourceFolder = source?.folder.name ?? '';
    await archiveFile(file.id, file.name, sourceFolder, sourceFolderId);
    await playerActions.playNext();
    setPlayerOpen(false);
  }, [playerState.currentFile, appState.sources, archiveFile, playerActions]);

  if (appState.loading && !appState.authed) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appState.authed) {
    return <AuthScreen error={appState.error} />;
  }

  const activeSource = appState.sources[appState.activeSourceIndex];

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {!online && <OfflineBanner pendingCount={appState.pendingQueueCount} />}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-navy-800 border-b border-white/10">
        <h1 className="text-lg font-bold text-white">DrivePod</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            disabled={appState.loading}
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Actualiser"
          >
            <RefreshIcon size={20} className={appState.loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Source tabs */}
      <SourceTabs
        sources={appState.sources}
        activeIndex={appState.activeSourceIndex}
        onSelect={setActiveSource}
      />

      {/* File list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: playerState.currentFile ? '80px' : '0' }}
      >
        {appState.error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-sm">
            {appState.error}
          </div>
        )}
        {appState.loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeSource ? (
          <FileList
            files={activeSource.files}
            sourceFolder={activeSource.folder.name}
            sourceFolderId={activeSource.folder.id}
            currentFileId={playerState.currentFile?.id ?? null}
            onPlay={(file, index) => void handlePlayFile(file, index)}
            onArchive={(file) => void handleArchive(file)}
            isOnline={online}
            onRefresh={() => void refresh()}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-white/40">
            <p className="text-sm">Créez des sous-dossiers dans Audio/ sur Drive</p>
          </div>
        )}
      </div>

      {/* Mini player */}
      {playerState.currentFile && !playerOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <PlayerBar
            playerState={playerState}
            onPlayPause={() =>
              playerState.isPlaying ? playerActions.pause() : void playerActions.play()
            }
            onNext={() => void playerActions.playNext()}
            onExpand={() => setPlayerOpen(true)}
            skipSeconds={player_skipSeconds()}
          />
        </div>
      )}

      {/* Full player */}
      {playerOpen && playerState.currentFile && (
        <PlayerFull
          playerState={playerState}
          onPlayPause={() =>
            playerState.isPlaying ? playerActions.pause() : void playerActions.play()
          }
          onNext={() => playerActions.playNext()}
          onPrevious={() => playerActions.playPrevious()}
          onSeek={playerActions.seekTo}
          onSkipForward={playerActions.skipForward}
          onSkipBackward={playerActions.skipBackward}
          onSetSpeed={playerActions.setSpeed}
          onArchive={() => void handleArchiveCurrentPlaying()}
          onClose={() => setPlayerOpen(false)}
          skipSeconds={player_skipSeconds()}
        />
      )}

      {/* Settings */}
      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          audioFolderId={appState.audioFolderId}
          onResync={() => void refresh()}
          onSettingsChange={(key, value) => {
            if (key === 'autoRewindSeconds') playerActions.setAutoRewind(value as number);
            if (key === 'skipForwardSeconds' || key === 'skipBackwardSeconds') playerActions.setSkipSeconds(value as number);
          }}
        />
      )}
    </div>
  );
}

function player_skipSeconds(): number {
  return 30;
}
