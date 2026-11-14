import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { usePortal } from '../../contexts/PortalContext';
import { initials } from '../../utils/format';
import { endSession } from '../../utils/auth';

export function LogoutConfirmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = usePortal();
  const navigate = useNavigate();

  const confirm = () => {
    onClose();
    endSession();
    toast.success('You have been logged out.');
    navigate('/', { replace: true });
  };

  return createPortal(
    <Modal
      open={open}
      onClose={onClose}
      title="Log out?"
      description="You will be signed out of Accrevia on this device."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button type="button" onClick={confirm} className="btn btn-danger btn-sm">
            <LogOutIcon className="h-3.5 w-3.5" /> Log out
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/60 p-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white" aria-hidden="true">
          {initials(currentUser.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{currentUser.name}</p>
          <p className="truncate text-[12px] text-ink-muted">
            {currentUser.role} · {currentUser.email}
          </p>
        </div>
      </div>
    </Modal>,
    document.body
  );
}
