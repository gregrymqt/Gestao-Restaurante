import { useDialogStore, DialogOptions, DialogType, DialogButton } from './dialogStore';

export const AppDialog = {
  fire: (options: DialogOptions) => {
    useDialogStore.getState().open(options);
  },

  success: (title: string, message?: string, onConfirm?: () => void) => {
    useDialogStore.getState().open({
      type: 'success',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
      allowOutsideClick: true,
    });
  },

  error: (title: string, message?: string, onConfirm?: () => void) => {
    useDialogStore.getState().open({
      type: 'error',
      title,
      message,
      confirmText: 'Entendido',
      onConfirm,
      allowOutsideClick: false,
    });
  },

  warning: (title: string, message?: string, onConfirm?: () => void) => {
    useDialogStore.getState().open({
      type: 'warning',
      title,
      message,
      confirmText: 'Entendido',
      onConfirm,
      allowOutsideClick: true,
    });
  },

  info: (title: string, message?: string, onConfirm?: () => void) => {
    useDialogStore.getState().open({
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      onConfirm,
      allowOutsideClick: true,
    });
  },

  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ) => {
    useDialogStore.getState().open({
      type: 'warning',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      allowOutsideClick: false,
    });
  },

  // Adaptador inteligente drop-in compatível com a assinatura de Alert.alert do React Native
  alert: (
    title: string,
    message?: string,
    buttons?: DialogButton[],
    options?: { cancelable?: boolean }
  ) => {
    const fullText = `${title} ${message || ''}`.toLowerCase();
    let type: DialogType = 'info';

    if (
      fullText.includes('sucesso') ||
      fullText.includes('concluíd') ||
      fullText.includes('emitida') ||
      fullText.includes('atualizado') ||
      fullText.includes('salvo') ||
      fullText.includes('cadastrado') ||
      fullText.includes('✅')
    ) {
      type = 'success';
    } else if (
      fullText.includes('erro') ||
      fullText.includes('falha') ||
      fullText.includes('inválid') ||
      fullText.includes('negad') ||
      fullText.includes('offline') ||
      fullText.includes('bloquead') ||
      fullText.includes('não foi possível') ||
      fullText.includes('limite') ||
      fullText.includes('insuficiente')
    ) {
      type = 'error';
    } else if (
      fullText.includes('atenção') ||
      fullText.includes('aviso') ||
      fullText.includes('fechad') ||
      fullText.includes('confirma') ||
      fullText.includes('deseja') ||
      fullText.includes('sem insumos') ||
      fullText.includes('campo obrigatório') ||
      fullText.includes('⚠️')
    ) {
      type = 'warning';
    }

    useDialogStore.getState().open({
      type,
      title,
      message,
      buttons,
      allowOutsideClick: options?.cancelable ?? !(buttons && buttons.length > 1),
    });
  },
};
