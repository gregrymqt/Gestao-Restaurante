import { apiClient } from '@/shared/services/api';
import { PedidoKds, StatusPreparoKds } from '../types';

export const kdsService = {
  async listarPedidosAtivos(): Promise<PedidoKds[]> {
    const res = await apiClient.get<PedidoKds[]>('/kds/pedidos');
    return Array.isArray(res.data) ? res.data : [];
  },

  async atualizarStatusPedido(vendaId: string, statusPreparo: StatusPreparoKds): Promise<PedidoKds> {
    const res = await apiClient.patch<PedidoKds>(`/kds/pedidos/${vendaId}/status`, {
      statusPreparo,
    });
    return res.data;
  },
};
