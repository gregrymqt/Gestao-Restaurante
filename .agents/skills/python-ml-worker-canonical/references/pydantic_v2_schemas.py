# ==============================================================================
# Manual Canónico de Machine Learning: Python 3.12
# Schemas Estruturais Rigorosos de Mensageria (Pydantic V2)
# ==============================================================================

from datetime import date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class SchemaBase(BaseModel):
    """
    Configuração base estrita para todos os contratos de mensageria:
    - extra="forbid": rejeita qualquer propriedade não mapeada (anti-injeção).
    - frozen=True: instâncias imutáveis após inicialização.
    - populate_by_name=True: aceita tanto o nome do atributo Python quanto o alias camelCase do C#.
    """
    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        populate_by_name=True
    )


class ProdutoPrevisaoItemPayload(SchemaBase):
    produto_id: UUID = Field(..., alias="produtoId", description="Identificador único do produto.")
    preco_venda: Decimal = Field(..., ge=0, alias="precoVenda", description="Preço unitário de venda.")


class ParametroMeteorologicoPayload(SchemaBase):
    temperatura: Decimal = Field(..., alias="temperatura", description="Temperatura média prevista em graus Celsius.")
    precipitacao: Decimal = Field(..., ge=0, alias="precipitacao", description="Precipitação acumulada em mm.")
    umidade: Decimal = Field(..., ge=0, le=100, alias="umidade", description="Umidade relativa do ar em percentagem.")


class HistoricoVendaPontoPayload(SchemaBase):
    data: date = Field(..., alias="data", description="Data do histórico de venda.")
    quantidade: int = Field(..., ge=0, alias="quantidade", description="Volume de vendas consolidado no dia.")


class PrevisaoDemandaSolicitadaEvent(SchemaBase):
    correlation_id: UUID = Field(..., alias="correlationId")
    restaurante_id: UUID = Field(..., alias="restauranteId")
    data_alvo: date = Field(..., alias="dataAlvo")
    produtos: list[ProdutoPrevisaoItemPayload] = Field(..., min_length=1, alias="produtos")
    clima: ParametroMeteorologicoPayload = Field(..., alias="clima")
    historico_vendas: list[HistoricoVendaPontoPayload] = Field(
        ..., min_length=7, alias="historicoVendas", 
        description="Histórico cronológico diário. Mínimo de 7 dias para baseline e 14 dias para regressão ML."
    )


class PrevisaoProdutoResultado(SchemaBase):
    produto_id: UUID = Field(..., alias="produtoId")
    demanda_prevista: Decimal = Field(..., ge=0, alias="demandaPrevista")


class PrevisaoDemandaCalculadaEvent(SchemaBase):
    correlation_id: UUID = Field(..., alias="correlationId")
    restaurante_id: UUID = Field(..., alias="restauranteId")
    data_previsao: date = Field(..., alias="dataPrevisao")
    modelo_versao: str = Field(..., alias="modeloVersao")
    baseline_demanda: Decimal = Field(..., alias="baselineDemanda")
    previsoes: list[PrevisaoProdutoResultado] = Field(..., min_length=1, alias="previsoes")


class HistoricoTreinamentoPontoPayload(SchemaBase):
    data: date = Field(..., alias="data")
    produto_id: UUID = Field(..., alias="produtoId")
    quantidade: int = Field(..., ge=0, alias="quantidade")
    preco_venda: Decimal = Field(..., ge=0, alias="precoVenda")
    temperatura: Decimal = Field(..., alias="temperatura")
    precipitacao: Decimal = Field(..., ge=0, alias="precipitacao")
    umidade: Decimal = Field(..., ge=0, le=100, alias="umidade")


class RetreinoModeloSolicitadoEvent(SchemaBase):
    correlation_id: UUID = Field(..., alias="correlationId")
    restaurante_id: UUID = Field(..., alias="restauranteId")
    nova_versao: str = Field(..., alias="novaVersao")
    dados_treinamento: list[HistoricoTreinamentoPontoPayload] = Field(
        ..., min_length=30, alias="dadosTreinamento"
    )
