import { X } from "lucide-react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export default function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-bg-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
