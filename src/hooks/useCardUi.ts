import { useCallback, useState } from 'react';
import type { MenuRequest } from '@/components/cards/types';

/** Context-menu and inline-rename state that every card space needs. */
export const useCardUi = () => {
  const [menu, setMenu] = useState<MenuRequest | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = useCallback((request: MenuRequest) => {
    setMenu((previous) =>
      request.toggle && previous?.key === request.key ? null : request,
    );
  }, []);

  const cancelRename = useCallback(
    (id: string) => setRenamingId((current) => (current === id ? null : current)),
    [],
  );

  return { menu, openMenu, closeMenu, renamingId, setRenamingId, cancelRename };
};
