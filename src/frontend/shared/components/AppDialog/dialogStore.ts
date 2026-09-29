import { create } from 'zustand';

export type DialogType = 'success' | 'error' | 'warning' | 'info';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface DialogOptions {
  type?: DialogType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  buttons?: DialogButton[];
  allowOutsideClick?: boolean;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  open: (options: DialogOptions) => void;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  options: null,
  open: (options) => set({ isOpen: true, options }),
  close: () => set({ isOpen: false, options: null }),
}));
