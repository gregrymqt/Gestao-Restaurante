import React from 'react';
import { ModalEntradaEstoque } from './ModalEntradaEstoque';
import { ModalBaixaEstoque } from './ModalBaixaEstoque';
import { ModalNovoInsumo } from './ModalNovoInsumo';
import { ModalFichaTecnica } from './ModalFichaTecnica';
import { ModalMarcarComprada } from './ModalMarcarComprada';
import {
  CadastrarInsumoInput,
  EntradaEstoqueInput,
  BaixaEstoqueInput,
  InsumoEstoque,
  FichaTecnicaInput,
  FichaTecnicaItem,
} from '../types';
import { OrdemCompraDetalhe } from '@/features/previsoes/types';

interface EstoqueModalsContainerProps {
  // Entrada
  isModalEntradaOpen: boolean;
  insumoSelecionado: InsumoEstoque | null;
  todosInsumos: InsumoEstoque[];
  onFecharModalEntrada: () => void;
  onConfirmarEntrada: (dados: EntradaEstoqueInput) => Promise<void>;
  isEnviandoEntrada: boolean;

  // Baixa
  isModalBaixaOpen: boolean;
  insumoBaixa: InsumoEstoque | null;
  onFecharModalBaixa: () => void;
  onConfirmarBaixa: (dados: BaixaEstoqueInput) => Promise<void>;
  isEnviandoBaixa: boolean;

  // Novo Insumo
  isModalNovoInsumoOpen: boolean;
  onFecharModalNovoInsumo: () => void;
  onConfirmarNovoInsumo: (dados: CadastrarInsumoInput) => Promise<void>;
  isEnviandoNovoInsumo: boolean;

  // Ficha Técnica
  isModalFichaOpen: boolean;
  fichaEdicao: FichaTecnicaItem | null;
  onFecharModalFicha: () => void;
  onConfirmarFicha: (dados: FichaTecnicaInput) => Promise<void>;
  isEnviandoFicha: boolean;

  // Marcar Comprada
  isModalCompradaOpen: boolean;
  ordemCompradaFoco: OrdemCompraDetalhe | null;
  onFecharModalComprada: () => void;
  onConfirmarComprada: (dados: { fornecedor?: string; observacao?: string }) => Promise<void>;
  isEnviandoComprada: boolean;
}

export function EstoqueModalsContainer({
  isModalEntradaOpen,
  insumoSelecionado,
  todosInsumos,
  onFecharModalEntrada,
  onConfirmarEntrada,
  isEnviandoEntrada,
  isModalBaixaOpen,
  insumoBaixa,
  onFecharModalBaixa,
  onConfirmarBaixa,
  isEnviandoBaixa,
  isModalNovoInsumoOpen,
  onFecharModalNovoInsumo,
  onConfirmarNovoInsumo,
  isEnviandoNovoInsumo,
  isModalFichaOpen,
  fichaEdicao,
  onFecharModalFicha,
  onConfirmarFicha,
  isEnviandoFicha,
  isModalCompradaOpen,
  ordemCompradaFoco,
  onFecharModalComprada,
  onConfirmarComprada,
  isEnviandoComprada,
}: EstoqueModalsContainerProps) {
  return (
    <>
      <ModalEntradaEstoque
        visible={isModalEntradaOpen}
        insumoInicial={insumoSelecionado}
        todosInsumos={todosInsumos}
        onClose={onFecharModalEntrada}
        onConfirmar={onConfirmarEntrada}
        isEnviando={isEnviandoEntrada}
      />

      <ModalBaixaEstoque
        visible={isModalBaixaOpen}
        insumo={insumoBaixa}
        onClose={onFecharModalBaixa}
        onConfirmar={onConfirmarBaixa}
        isEnviando={isEnviandoBaixa}
      />

      <ModalNovoInsumo
        visible={isModalNovoInsumoOpen}
        onClose={onFecharModalNovoInsumo}
        onConfirmar={onConfirmarNovoInsumo}
        isEnviando={isEnviandoNovoInsumo}
      />

      <ModalFichaTecnica
        visible={isModalFichaOpen}
        fichaEdicao={fichaEdicao}
        todosInsumos={todosInsumos}
        onClose={onFecharModalFicha}
        onSalvar={onConfirmarFicha}
        isEnviando={isEnviandoFicha}
      />

      <ModalMarcarComprada
        visible={isModalCompradaOpen && !!ordemCompradaFoco}
        protocolo={ordemCompradaFoco?.protocolo ?? ''}
        totalItens={ordemCompradaFoco?.itens.length ?? 0}
        valorTotalEstimado={ordemCompradaFoco?.valorTotalEstimado ?? 0}
        isSubmitting={isEnviandoComprada}
        onClose={onFecharModalComprada}
        onConfirmar={onConfirmarComprada}
      />
    </>
  );
}
