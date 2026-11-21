import { apiClient, extractErrorMessage, isCancel } from '@/shared/services/api';
import { PedidoKds, StatusPreparoKds } from '../types';

export const kdsService = {
  async listarPedidosAtivos(signal?: AbortSignal): Promise<PedidoKds[]> {
    const res = await apiClient.get<PedidoKds[]>('/kds/pedidos', { signal });
    return Array.isArray(res.data) ? res.data : [];
  },

  async atualizarStatusPedido(
    vendaId: string,
    statusPreparo: StatusPreparoKds,
    signal?: AbortSignal
  ): Promise<PedidoKds> {
    try {
      const res = await apiClient.patch<PedidoKds>(
        `/kds/pedidos/${vendaId}/status`,
        { statusPreparo },
        { signal }
      );
      return res.data;
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível atualizar o status do pedido no KDS.'));
    }
  },
};
