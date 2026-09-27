from datetime import date
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class PrevisaoDemandaSolicitadaMessage(BaseModel):
    """
    Contrato da mensagem de solicitação de previsão de demanda por produto
    recebida do backend C# (.NET 9) em Raw JSON via fila previsao.demanda.solicitada.
    """
    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )

    solicitacao_id: UUID = Field(..., alias="solicitacaoId")
    restaurante_id: UUID = Field(..., alias="restauranteId")
    produto_id: UUID = Field(..., alias="produtoId")
    data_alvo: date = Field(..., alias="dataAlvo")
    historico_vendas_recentes: list[Decimal] = Field(default_factory=list, alias="historicoVendasRecentes")
    temperatura_prevista: Decimal = Field(default=Decimal("25.0"), alias="temperaturaPrevista")
    precipitacao_prevista: Decimal = Field(default=Decimal("0.0"), alias="precipitacaoPrevista")


class PrevisaoDemandaConcluidaMessage(BaseModel):
    """
    Contrato da mensagem de conclusão de previsão de demanda publicada pelo
    Worker Python ML na fila previsao.demanda.concluida para consumo e persistência pelo backend C#.
    """
    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore"
    )

    solicitacao_id: UUID = Field(..., alias="solicitacaoId")
    restaurante_id: UUID = Field(..., alias="restauranteId")
    produto_id: UUID = Field(..., alias="produtoId")
    data_alvo: date = Field(..., alias="dataAlvo")
    quantidade_prevista: Decimal = Field(..., alias="quantidadePrevista")
    modelo_versao: str = Field(..., alias="modeloVersao")
