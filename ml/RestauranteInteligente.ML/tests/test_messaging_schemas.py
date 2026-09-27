from datetime import date
from decimal import Decimal
import json
from uuid import uuid4
import pytest
from app.schemas.messaging import (
    PrevisaoDemandaSolicitadaMessage,
    PrevisaoDemandaConcluidaMessage,
)


def test_previsao_demanda_solicitada_schema_parsing():
    solicitacao_id = uuid4()
    restaurante_id = uuid4()
    produto_id = uuid4()

    raw_json = json.dumps({
        "solicitacaoId": str(solicitacao_id),
        "restauranteId": str(restaurante_id),
        "produtoId": str(produto_id),
        "dataAlvo": "2026-09-28",
        "historicoVendasRecentes": [10.5, 12.0, 15.0, 8.0],
        "temperaturaPrevista": 26.5,
        "precipitacaoPrevista": 0.0
    })

    msg = PrevisaoDemandaSolicitadaMessage.model_validate_json(raw_json)

    assert msg.solicitacao_id == solicitacao_id
    assert msg.restaurante_id == restaurante_id
    assert msg.produto_id == produto_id
    assert msg.data_alvo == date(2026, 9, 28)
    assert len(msg.historico_vendas_recentes) == 4
    assert msg.temperatura_prevista == Decimal("26.5")
    assert msg.precipitacao_prevista == Decimal("0.0")


def test_previsao_demanda_concluida_serialization_camelcase():
    solicitacao_id = uuid4()
    restaurante_id = uuid4()
    produto_id = uuid4()

    msg = PrevisaoDemandaConcluidaMessage(
        solicitacaoId=solicitacao_id,
        restauranteId=restaurante_id,
        produtoId=produto_id,
        dataAlvo=date(2026, 9, 28),
        quantidadePrevista=Decimal("45.50"),
        modeloVersao="hgb-regressor-v1"
    )

    serialized = msg.model_dump_json(by_alias=True)
    parsed_dict = json.loads(serialized)

    assert "solicitacaoId" in parsed_dict
    assert "restauranteId" in parsed_dict
    assert "produtoId" in parsed_dict
    assert "dataAlvo" in parsed_dict
    assert "quantidadePrevista" in parsed_dict
    assert "modeloVersao" in parsed_dict
    assert parsed_dict["quantidadePrevista"] == "45.50" or parsed_dict["quantidadePrevista"] == 45.5
    assert parsed_dict["modeloVersao"] == "hgb-regressor-v1"
