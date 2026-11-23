import { useEffect, useRef } from 'react';
import { loadAccessRequests } from '../services/accessRequests/mockAccessRequestStore';
import { AccessRequest } from '../types/sharing';
import { DocumentRequest } from '../types/request';
import {
  LiveNotification,
  RoleLiveBoard,
  RoleLiveIdentity,
  fetchRoleLive,
  runLiveTask,
  subscribeRoleLive,
  syncRoleLive
} from '../services/live/roleLive';

interface RoleLiveInput {
  role: string;
  userId: string;
  email: string;
  documentRequests: DocumentRequest[];
  notifications: LiveNotification[];
  accessRequests: AccessRequest[];
  fileGrants: RoleLiveBoard['fileGrants'];
  onBoard: (board: RoleLiveBoard) => void;
}

function snapshotKey(
  role: string,
  userId: string,
  documentRequests: DocumentRequest[],
  notifications: LiveNotification[],
  accessRequests: AccessRequest[],
  technicalReviews: RoleLiveBoard['technicalReviews']
) {
  return JSON.stringify({ role, userId, documentRequests, notifications, accessRequests, technicalReviews });
}

/**
 * Keeps this browser on the shared board. Local edits are merged on the server,
 * and other browsers receive the copy filtered for their role.
 */
export function useRoleLive(input: RoleLiveInput) {
  const inputRef = useRef(input);
  inputRef.current = input;
  const syncedKey = useRef('');
  const knownNotificationIds = useRef<Set<string>>(new Set(input.notifications.map((item) => item.id)));

  const identity = (): RoleLiveIdentity => ({
    role: inputRef.current.role,
    userId: inputRef.current.userId,
    email: inputRef.current.email
  });

  const remember = (board: RoleLiveBoard) => {
    const who = identity();
    syncedKey.current = snapshotKey(
      who.role,
      who.userId,
      board.documentRequests,
      board.notifications,
      board.accessRequests,
      board.technicalReviews
    );
    knownNotificationIds.current = new Set(board.notifications.map((item) => item.id));
    const current = inputRef.current;
    const currentKey = snapshotKey(
      current.role,
      current.userId,
      current.documentRequests,
      current.notifications,
      current.accessRequests,
      loadAccessRequests()
    );
    const grantsDiffer = JSON.stringify(board.fileGrants ?? []) !== JSON.stringify(current.fileGrants ?? []);
    if (currentKey !== syncedKey.current || grantsDiffer) current.onBoard(board);
  };

  useEffect(() => {
    let cancelled = false;
    const pull = () =>
      runLiveTask(async () => {
        if (cancelled) return;
        const current = inputRef.current;
        const dirtyKey = snapshotKey(
          current.role,
          current.userId,
          current.documentRequests,
          current.notifications,
          current.accessRequests,
          loadAccessRequests()
        );
        if (!syncedKey.current || syncedKey.current !== dirtyKey) return;
        const board = await fetchRoleLive(identity());
        if (!board || cancelled) return;
        remember(board);
      });

    const stop = subscribeRoleLive(() => {
      void pull();
    });
    const accessChanged = () => {void runLiveTask(async () => {
      const board = await fetchRoleLive(identity());
      if (board && !cancelled) remember(board);
    });};
    window.addEventListener('accrevia-area-access-changed', accessChanged);
    return () => {
      cancelled = true;
      stop();
      window.removeEventListener('accrevia-area-access-changed', accessChanged);
    };
    // Reconnect when the signed-in person changes so the stream follows that role.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.role, input.userId, input.email]);

  const localKey = snapshotKey(
    input.role,
    input.userId,
    input.documentRequests,
    input.notifications,
    input.accessRequests,
    loadAccessRequests()
  );

  useEffect(() => {
    if (localKey === syncedKey.current) {
      knownNotificationIds.current = new Set(input.notifications.map((item) => item.id));
      return;
    }
    const currentIds = new Set(input.notifications.map((item) => item.id));
    const dismissedNotificationIds = [...knownNotificationIds.current].filter((id) => !currentIds.has(id));
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void runLiveTask(async () => {
        if (cancelled) return;
        const board = await syncRoleLive(
          {
            documentRequests: inputRef.current.documentRequests,
            notifications: inputRef.current.notifications,
            dismissedNotificationIds,
            accessRequests: inputRef.current.accessRequests,
            technicalReviews: loadAccessRequests()
          },
          identity()
        );
        if (!board || cancelled) return;
        remember(board);
      });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
    // localKey already covers the lists and the signed-in role.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKey]);
}
