import { useState, useCallback, useEffect, useMemo } from 'react';
import { AuthScreen } from './ui/AuthButton';
import { SourceTabs, type View } from './ui/SourceTabs';
import { FileList, type LivePlayback } from './ui/FileList';
import { QueueList } from './ui/QueueList';
import { ArchiveList } from './ui/ArchiveList';
import { SynthesisPanel } from './ui/SynthesisPanel';
import { SearchBar } from './ui/SearchBar';
import { CapturesList } from './ui/CapturesList';
import { PlayerBar } from './ui/PlayerBar';
import { PlayerFull } from './ui/PlayerFull';
import { Settings } from './ui/Settings';
import { OfflineBanner } from './ui/OfflineBanner';
import { SettingsIcon, RefreshIcon, SearchIcon, SunIcon, MoonIcon } from './ui/icons';
import { Wordmark } from './ui/Wordmark';
import { Dashboard } from './ui/Dashboard';
import { Spinner, CenteredSpinner, ErrorBox, EmptyState, IconButton } from './ui/primitives';
import { useTheme } from './hooks/useTheme';
import { useApp } from './hooks/useApp';
import { usePlayer } from './hooks/usePlayer';
import { useOnline } from './hooks/useOnline';
import { fetchMarkdownContent } from './drive/api';
import { extractPassage } from './lib/markdown';
import { appendCapture } from './state/captures';
import { normalizeFolderName } from './state/archiveRules';
import { ARCHIVE_FOLDER_NAME } from './drive/archive';
import type { DriveFile, Source, AppSettings } from './drive/types';

// La ligne active de la liste avance par pas de 5 s : assez fluide pour
// l'oeil, sans re-rendre la liste à chaque timeupdate (4 fois par seconde)
const LIST_PROGRESS_STEP_S = 5;

type Overlay = 'none' | 'player' | 'settings' | 'search' | 'captures';

export default function App(): React.JSX.Element {
  const online = useOnline();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>('source');
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [activeRestTime, setActiveRestTime] = useState<string | null>(null);

  const { state: appState, actions: app } = useApp(online);
  const { sources } = appState;

  const findSourceOf = useCallback(
    (file: DriveFile, folderName?: string): Source | undefined =>
      sources.find((s) => s.files.some((f) => f.id === file.id))
      ?? (folderName ? sources.find((s) => s.folder.name === folderName) : undefined),
    [sources],
  );

  // Archivage automatique à 95 % (déclenché par le player)
  const handleAutoArchive = useCallback((file: DriveFile, sourceFolder: string) => {
    // Un fichier déjà archivé (lecture depuis l'onglet Archive) ne doit pas
    // être re-déplacé vers la semaine courante
    if (sourceFolder === ARCHIVE_FOLDER_NAME) return;
    const source = findSourceOf(file, sourceFolder);
    void app.archiveFile(file, source?.folder ?? { id: '', name: sourceFolder });
  }, [findSourceOf, app]);

  const { state: playerState, actions: player } = usePlayer(handleAutoArchive);
  const { currentFile } = playerState;

  // L'onglet File disparaît quand la file se vide
  useEffect(() => {
    if (playerState.customQueue.length === 0) setView((v) => (v === 'queue' ? 'source' : v));
  }, [playerState.customQueue.length]);

  const closeOverlay = useCallback(() => setOverlay('none'), []);

  // ── Lecture ───────────────────────────────────────────────────────────────

  const handlePlayFile = useCallback((file: DriveFile, index: number): void => {
    const activeSource = sources[appState.activeSourceIndex];
    if (!activeSource) return;
    void player.startPlayback(file, activeSource.folder.name, { files: activeSource.files, index });
  }, [sources, appState.activeSourceIndex, player]);

  const handlePlayArchived = useCallback((file: DriveFile, queue: DriveFile[], index: number): void => {
    void player.startPlayback(file, ARCHIVE_FOLDER_NAME, { files: queue, index });
  }, [player]);

  const handlePlayFromSearch = useCallback((file: DriveFile, source: Source, fileIndex: number): void => {
    const sourceIndex = sources.indexOf(source);
    if (sourceIndex >= 0) app.setActiveSource(sourceIndex);
    setView('source');
    void player.startPlayback(file, source.folder.name, { files: source.files, index: fileIndex });
  }, [sources, player, app]);

  // ── Archivage ─────────────────────────────────────────────────────────────

  const handleArchive = useCallback(async (file: DriveFile): Promise<void> => {
    const source = findSourceOf(file);
    if (!source) return;
    await app.archiveFile(file, source.folder);
  }, [findSourceOf, app]);

  // Le fichier suivant démarre tout de suite ; le déplacement Drive se fait
  // en arrière-plan (la liste est déjà mise à jour de façon optimiste)
  const handleArchiveCurrentPlaying = useCallback((): void => {
    if (!currentFile) return;
    // Déjà dans l'archive (lecture depuis l'onglet Archive) : on passe juste au suivant
    if (playerState.sourceFolder !== ARCHIVE_FOLDER_NAME) {
      const source = findSourceOf(currentFile, playerState.sourceFolder);
      void app.archiveFile(currentFile, source?.folder ?? { id: '', name: playerState.sourceFolder });
    }
    void player.playNext();
    setOverlay('none');
  }, [currentFile, playerState.sourceFolder, findSourceOf, app, player]);

  // ── Captures ──────────────────────────────────────────────────────────────

  const handleCapture = useCallback(async (): Promise<boolean> => {
    const audioFolderId = appState.audioFolderId;
    if (!currentFile || !audioFolderId) return false;

    const { position, duration } = playerState;
    const source = findSourceOf(currentFile);
    try {
      const md = source ? await fetchMarkdownContent(source.folder.id, currentFile.name) : null;
      await appendCapture(audioFolderId, {
        id: `${currentFile.id}-${Date.now()}`,
        fileId: currentFile.id,
        fileName: currentFile.name,
        sourceFolder: source?.folder.name ?? playerState.sourceFolder,
        audioPosition: position,
        audioDuration: duration,
        capturedAt: Date.now(),
        passage: md ? extractPassage(md, position, duration) : '',
      });
      return true;
    } catch (err) {
      console.error('Capture failed', err);
      return false;
    }
  }, [currentFile, playerState, appState.audioFolderId, findSourceOf]);

  const handleSettingsChange = useCallback((patch: Partial<AppSettings>): void => {
    if (patch.autoRewindSeconds !== undefined) player.setAutoRewind(patch.autoRewindSeconds);
    if (patch.skipForwardSeconds !== undefined) player.setSkipSeconds(patch.skipForwardSeconds);
    if (patch.voiceBoost !== undefined) player.setVoiceBoost(patch.voiceBoost);
  }, [player]);

  const handleAddToQueue = useCallback((file: DriveFile): void => {
    const source = findSourceOf(file);
    player.addToCustomQueue(file, source?.folder.name ?? '');
  }, [findSourceOf, player]);

  const handleSelectSource = useCallback((i: number): void => {
    setView('source');
    setActiveRestTime(null);
    app.setActiveSource(i);
  }, [app]);

  const handleRefresh = useCallback((): void => { void app.refresh(); }, [app]);

  // ── Dérivés ───────────────────────────────────────────────────────────────

  const activeSource = sources[appState.activeSourceIndex];
  const currentFileSource = useMemo(
    () => (currentFile ? findSourceOf(currentFile, playerState.sourceFolder) : undefined),
    [currentFile, playerState.sourceFolder, findSourceOf],
  );

  const quantizedPosition = Math.floor(playerState.position / LIST_PROGRESS_STEP_S) * LIST_PROGRESS_STEP_S;
  const livePlayback = useMemo<LivePlayback | null>(
    () => (currentFile ? { fileId: currentFile.id, position: quantizedPosition, duration: playerState.duration } : null),
    [currentFile, quantizedPosition, playerState.duration],
  );

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (appState.loading && !appState.authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!appState.authed) {
    return <AuthScreen error={appState.error} />;
  }

  const renderContent = (): React.ReactNode => {
    if (appState.loading) return <CenteredSpinner />;

    switch (view) {
      case 'archive':
        return appState.audioFolderId ? (
          <ArchiveList
            audioFolderId={appState.audioFolderId}
            online={online}
            onPlay={handlePlayArchived}
            onUnarchived={handleRefresh}
          />
        ) : (
          <EmptyState title="Archive indisponible hors-ligne" />
        );
      case 'stats':
        return <Dashboard />;
      case 'queue':
        return (
          <QueueList
            queue={playerState.customQueue}
            onRemove={player.removeFromCustomQueue}
            onClear={() => { player.clearCustomQueue(); setView('source'); }}
            onPlayNow={(item, index) => {
              player.removeFromCustomQueue(index);
              void player.startPlayback(item.file, item.sourceFolder);
            }}
          />
        );
      case 'source':
        if (!activeSource) return <EmptyState title="Créez des sous-dossiers dans Audio/ sur Drive" />;
        return (
          <>
            {normalizeFolderName(activeSource.folder.name).startsWith('synthese') && (
              <SynthesisPanel
                sources={sources}
                online={online}
                onArchiveMany={async (items, weekKey) => {
                  const result = await app.archiveMany(items, weekKey);
                  await app.refreshQueueCount();
                  return result;
                }}
              />
            )}
            <FileList
              files={activeSource.files}
              sourceFolder={activeSource.folder.name}
              sourceFolderId={activeSource.folder.id}
              currentFileId={currentFile?.id ?? null}
              livePlayback={livePlayback}
              onPlay={handlePlayFile}
              onArchive={handleArchive}
              onAddToQueue={handleAddToQueue}
              isOnline={online}
              onRefresh={handleRefresh}
              onRestTimeChange={setActiveRestTime}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-1" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {!online && <OfflineBanner pendingCount={appState.pendingQueueCount} />}

      {/* Colonne centrée : pleine largeur sur mobile, 640px max sur desktop */}
      <div className="mx-auto flex flex-col lg:border-x lg:border-border-1" style={{ maxWidth: 640, minHeight: '100dvh' }}>

        <header
          className="flex items-center justify-between bg-surface-1 border-b border-border-1 px-4"
          style={{ minHeight: 48, paddingBottom: 12, paddingTop: 8 }}
        >
          <div className="flex items-center gap-2.5">
            <img src="/drivepod/Logo-Drixs.png" alt="" width={64} height={64} className="flex-shrink-0" style={{ borderRadius: 12 }} />
            <Wordmark size={18} />
          </div>

          <div className="flex items-center">
            <IconButton label="Rechercher" onClick={() => setOverlay('search')}>
              <SearchIcon size={20} />
            </IconButton>
            <IconButton label={theme === 'dark' ? 'Thème clair' : 'Thème sombre'} onClick={toggleTheme}>
              {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
            </IconButton>
            <IconButton label="Actualiser" onClick={handleRefresh} disabled={appState.refreshing || !online} aria-busy={appState.refreshing}>
              <RefreshIcon size={20} className={appState.refreshing ? 'animate-spin' : ''} />
            </IconButton>
            <div className="relative">
              <IconButton label="Paramètres" onClick={() => setOverlay('settings')}>
                <SettingsIcon size={20} />
              </IconButton>
              {appState.pendingQueueCount > 0 && (
                <span
                  aria-hidden
                  className="absolute rounded-full bg-accent pointer-events-none"
                  style={{ width: 8, height: 8, top: 8, right: 8, boxShadow: '0 0 0 2px var(--surface-1)' }}
                />
              )}
            </div>
          </div>
        </header>

        <SourceTabs
          sources={sources}
          activeIndex={appState.activeSourceIndex}
          view={view}
          onSelectSource={handleSelectSource}
          onSelectView={setView}
          queueCount={playerState.customQueue.length}
          activeRestTime={activeRestTime}
        />

        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: currentFile ? 'calc(80px + env(safe-area-inset-bottom))' : '0' }}
        >
          {appState.error && <ErrorBox>{appState.error}</ErrorBox>}
          {renderContent()}
        </main>
      </div>

      {currentFile && overlay !== 'player' && (
        <PlayerBar
          file={currentFile}
          sourceFolder={playerState.sourceFolder}
          isPlaying={playerState.isPlaying}
          position={playerState.position}
          duration={playerState.duration}
          onPlayPause={player.togglePlay}
          onExpand={() => setOverlay('player')}
        />
      )}

      {overlay === 'player' && currentFile && (
        <PlayerFull
          playerState={playerState}
          actions={player}
          onArchive={handleArchiveCurrentPlaying}
          onCapture={handleCapture}
          onClose={closeOverlay}
          sourceFolderId={currentFileSource?.folder.id}
        />
      )}

      {overlay === 'captures' && appState.audioFolderId && (
        <CapturesList audioFolderId={appState.audioFolderId} onClose={closeOverlay} />
      )}

      {overlay === 'search' && (
        <SearchBar sources={sources} onPlay={handlePlayFromSearch} onClose={closeOverlay} />
      )}

      {overlay === 'settings' && (
        <Settings
          onClose={closeOverlay}
          audioFolderId={appState.audioFolderId}
          onResync={handleRefresh}
          onShowCaptures={() => setOverlay('captures')}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  );
}
