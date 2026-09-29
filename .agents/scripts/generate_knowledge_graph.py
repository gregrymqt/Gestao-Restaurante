#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
Sistema Restaurante Inteligente - Extrator Canônico de Grafo de Conhecimento
==============================================================================
Varre deterministicamente os 5 pilares arquiteturais do monorepo:
1. PostgreSQL 16 & Políticas RLS (Scripts DDL e Seeds)
2. Backend Central .NET 9 (Controllers, UseCases, Repositories, Redis, MassTransit)
3. Python ML Worker (FastAPI, RabbitConsumer aio-pika, Pipelines ML)
4. Frontend Mobile Expo SDK 54+ (App Routes, Features, Hooks, Services, Shared SSE)
5. Docker Compose & Orquestração de Containers

Gera:
- .agents/graph.json: Grafo topológico tipado e indexado
- .agents/GRAPH_REPORT.md: Sumário executivo e matriz de fluxos críticos E2E
==============================================================================
"""

import ast
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Raiz do projeto
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
AGENTS_DIR = ROOT_DIR / ".agents"


class KnowledgeGraphBuilder:
    def __init__(self, root_dir: Path) -> None:
        self.root_dir = root_dir
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: Set[Tuple[str, str, str, str]] = set()  # (source, target, relation, props_json)
        self.endpoints_catalog: List[Dict[str, Any]] = []

    def add_node(
        self,
        node_id: str,
        node_type: str,
        label: str,
        file_path: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Adiciona ou atualiza um nó no grafo com deduplicação segura."""
        clean_file = ""
        if file_path:
            try:
                clean_file = str(Path(file_path).relative_to(self.root_dir)).replace("\\", "/")
            except ValueError:
                clean_file = str(file_path).replace("\\", "/")

        if node_id not in self.nodes:
            self.nodes[node_id] = {
                "id": node_id,
                "type": node_type,
                "label": label,
                "file": clean_file,
                "metadata": metadata or {},
            }
        else:
            if metadata:
                self.nodes[node_id]["metadata"].update(metadata)
            if clean_file and not self.nodes[node_id]["file"]:
                self.nodes[node_id]["file"] = clean_file

    def add_edge(
        self,
        source_id: str,
        target_id: str,
        relationship: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Registra uma aresta orientada deduplicada."""
        props_str = json.dumps(metadata or {}, sort_keys=True)
        self.edges.add((source_id, target_id, relationship, props_str))

    # =========================================================================
    # 1. PARSING POSTGRESQL & RLS
    # =========================================================================
    def parse_postgres_scripts(self) -> None:
        scripts_dir = (
            self.root_dir
            / "src"
            / "RestauranteInteligente.Infrastructure"
            / "Persistence"
            / "Scripts"
        )
        if not scripts_dir.exists():
            return

        schema_file = scripts_dir / "01_init_schema_rls.sql"
        if not schema_file.exists():
            return

        content = schema_file.read_text(encoding="utf-8", errors="replace")

        # Mapeia CREATE TABLE
        table_pattern = re.compile(
            r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s*\((.*?)\);',
            re.DOTALL | re.IGNORECASE,
        )
        for match in table_pattern.finditer(content):
            table_name = match.group(1)
            table_body = match.group(2)

            is_tenant = '"RestauranteId"' in table_body or "RestauranteId" in table_body
            is_append_only = table_name == "MovimentacoesEstoque"

            self.add_node(
                node_id=f"table:{table_name}",
                node_type="DatabaseTable",
                label=table_name,
                file_path=str(schema_file),
                metadata={
                    "multi_tenant": is_tenant,
                    "append_only": is_append_only,
                    "pillar": "PostgreSQL 16",
                },
            )

            # Relações de Foreign Key
            fk_matches = re.findall(
                r'REFERENCES\s+"?(\w+)"?\s*\("?(\w+)"?\)', table_body, re.IGNORECASE
            )
            for fk_table, fk_col in fk_matches:
                self.add_edge(
                    source_id=f"table:{table_name}",
                    target_id=f"table:{fk_table}",
                    relationship="references",
                    metadata={"foreign_key": fk_col},
                )

        # Mapeia Políticas RLS
        policy_pattern = re.compile(
            r'CREATE\s+POLICY\s+(\w+)\s+ON\s+"?(\w+)"?\s+FOR\s+(\w+)',
            re.IGNORECASE,
        )
        for match in policy_pattern.finditer(content):
            pol_name = match.group(1)
            target_table = match.group(2)
            for_command = match.group(3)

            pol_id = f"policy:{pol_name}"
            self.add_node(
                node_id=pol_id,
                node_type="SecurityPolicy",
                label=pol_name,
                file_path=str(schema_file),
                metadata={
                    "scope": "Row-Level Security",
                    "target_table": target_table,
                    "command": for_command,
                    "enforcement": "FORCE ROW LEVEL SECURITY",
                },
            )
            self.add_edge(
                source_id=pol_id,
                target_id=f"table:{target_table}",
                relationship="protects",
                metadata={"command": for_command},
            )

        # Mapeia Interceptor C# que ativa o RLS
        interceptor_file = (
            self.root_dir
            / "src"
            / "RestauranteInteligente.Infrastructure"
            / "Persistence"
            / "Interceptors"
            / "PostgresRlsTransactionInterceptor.cs"
        )
        if interceptor_file.exists():
            self.add_node(
                node_id="interceptor:PostgresRlsTransactionInterceptor",
                node_type="SecurityPolicy",
                label="PostgresRlsTransactionInterceptor",
                file_path=str(interceptor_file),
                metadata={
                    "scope": "C# EF Core Connection Interceptor",
                    "command": "SET LOCAL app.current_restaurante_id",
                },
            )
            # Protege todas as tabelas de tenant
            for node_id, data in list(self.nodes.items()):
                if data["type"] == "DatabaseTable" and data["metadata"].get("multi_tenant"):
                    self.add_edge(
                        source_id="interceptor:PostgresRlsTransactionInterceptor",
                        target_id=node_id,
                        relationship="protects",
                        metadata={"mechanism": "Session Context Injection"},
                    )

    # =========================================================================
    # 2. PARSING BACKEND C# (.NET 9)
    # =========================================================================
    def parse_dotnet_backend(self) -> None:
        # Fila RabbitMQ canônicas
        self.add_node(
            node_id="queue:previsao.demanda.solicitada",
            node_type="MessageQueue",
            label="previsao.demanda.solicitada",
            metadata={"exchange": "previsao.demanda.solicitada", "type": "fanout"},
        )
        self.add_node(
            node_id="queue:previsao.demanda.concluida",
            node_type="MessageQueue",
            label="previsao.demanda.concluida",
            metadata={"exchange": "previsao.demanda.concluida", "type": "fanout"},
        )
        self.add_node(
            node_id="queue:dlq.previsao.demanda.solicitada",
            node_type="MessageQueue",
            label="dlq.previsao.demanda.solicitada",
            metadata={"dlx": "dlx.restaurante", "type": "direct"},
        )

        # 2.1 Repositórios C#
        repos_dir = (
            self.root_dir
            / "src"
            / "RestauranteInteligente.Infrastructure"
            / "Persistence"
            / "Repositories"
        )
        if repos_dir.exists():
            for repo_file in repos_dir.glob("*.cs"):
                repo_name = repo_file.stem
                repo_id = f"repo:{repo_name}"
                self.add_node(
                    node_id=repo_id,
                    node_type="CoreRepository",
                    label=repo_name,
                    file_path=str(repo_file),
                    metadata={"layer": "Infrastructure.Persistence"},
                )

                content = repo_file.read_text(encoding="utf-8", errors="replace")
                # Detecta tabelas manipuladas via DbSet
                for table_id, data in self.nodes.items():
                    if data["type"] == "DatabaseTable":
                        tbl = data["label"]
                        if re.search(rf"\b{tbl}\b", content):
                            self.add_edge(
                                source_id=repo_id,
                                target_id=table_id,
                                relationship="queries",
                            )
                            if (
                                "Add" in content
                                or "Update" in content
                                or "SaveChangesAsync" in content
                                or "ExecuteUpdate" in content
                            ):
                                self.add_edge(
                                    source_id=repo_id,
                                    target_id=table_id,
                                    relationship="writes_to",
                                )

        # 2.2 Redis Services
        redis_dir = self.root_dir / "src" / "RestauranteInteligente.Infrastructure" / "Redis"
        if redis_dir.exists():
            for redis_file in redis_dir.glob("*Service.cs"):
                srv_name = redis_file.stem
                srv_id = f"redis_service:{srv_name}"
                self.add_node(
                    node_id=srv_id,
                    node_type="RedisService",
                    label=srv_name,
                    file_path=str(redis_file),
                    metadata={"provider": "StackExchange.Redis"},
                )

        # 2.3 Use Cases
        app_dir = self.root_dir / "src" / "RestauranteInteligente.Application"
        if app_dir.exists():
            for uc_file in app_dir.rglob("*.cs"):
                if uc_file.stem.endswith("UseCase") or uc_file.stem.endswith("Service"):
                    uc_name = uc_file.stem
                    uc_id = f"usecase:{uc_name}"
                    self.add_node(
                        node_id=uc_id,
                        node_type="UseCase",
                        label=uc_name,
                        file_path=str(uc_file),
                        metadata={"layer": "Application"},
                    )

                    content = uc_file.read_text(encoding="utf-8", errors="replace")

                    # Conexão com Repositórios
                    for repo_id in list(self.nodes.keys()):
                        if self.nodes[repo_id]["type"] == "CoreRepository":
                            repo_class = self.nodes[repo_id]["label"]
                            repo_interface = f"I{repo_class}"
                            if repo_interface in content or repo_class in content:
                                self.add_edge(
                                    source_id=uc_id,
                                    target_id=repo_id,
                                    relationship="invokes",
                                )

                    # Publicação de Mensageria / Eventos
                    if (
                        "PrevisaoDemandaSolicitadaEvent" in content
                        or "previsao.demanda.solicitada" in content
                    ):
                        self.add_edge(
                            source_id=uc_id,
                            target_id="queue:previsao.demanda.solicitada",
                            relationship="publishes_to",
                            metadata={"event": "PrevisaoDemandaSolicitadaEvent_v1"},
                        )

        # 2.4 MassTransit Consumers
        consumers_dir = (
            self.root_dir
            / "src"
            / "RestauranteInteligente.Infrastructure"
            / "Messaging"
            / "Consumers"
        )
        if consumers_dir.exists():
            for c_file in consumers_dir.glob("*.cs"):
                c_name = c_file.stem
                c_id = f"consumer:{c_name}"
                self.add_node(
                    node_id=c_id,
                    node_type="MassTransitConsumer",
                    label=c_name,
                    file_path=str(c_file),
                    metadata={"framework": "MassTransit Raw AMQP"},
                )
                self.add_edge(
                    source_id=c_id,
                    target_id="queue:previsao.demanda.concluida",
                    relationship="consumes_from",
                )
                if "PrevisaoRepository" in c_file.read_text(
                    encoding="utf-8", errors="replace"
                ):
                    self.add_edge(
                        source_id=c_id,
                        target_id="repo:PrevisaoRepository",
                        relationship="invokes",
                    )
                    self.add_edge(
                        source_id=c_id,
                        target_id="table:Previsoes",
                        relationship="writes_to",
                        metadata={"operation": "Upsert Forecast"},
                    )

        # 2.5 Controllers e Endpoints
        controllers_dir = (
            self.root_dir / "src" / "RestauranteInteligente.Api" / "Controllers"
        )
        if controllers_dir.exists():
            for ctrl_file in controllers_dir.glob("*Controller.cs"):
                ctrl_name = ctrl_file.stem
                ctrl_id = f"controller:{ctrl_name}"

                content = ctrl_file.read_text(encoding="utf-8", errors="replace")

                # Detecta Rota Base
                route_match = re.search(r'\[Route\("([^"]+)"\)\]', content)
                base_route = route_match.group(1) if route_match else "api/v1"
                base_route = base_route.replace("[controller]", ctrl_name.replace("Controller", "").lower())
                if not base_route.startswith("/"):
                    base_route = "/" + base_route

                endpoints = []
                # Suporta atributos intermediários (como [ProducesResponseType(...)], [AllowAnonymous])
                method_pattern = re.compile(
                    r'\[Http(Get|Post|Put|Delete|Patch)(?:\("([^"]*)"\))?\](?:\s*\[[^\]]+\])*\s*(?:public|private|protected)?\s*(?:async)?\s*Task(?:<[^>]+>)?\s+(\w+)',
                    re.MULTILINE,
                )
                for m in method_pattern.finditer(content):
                    http_verb = m.group(1).upper()
                    sub_route = m.group(2) or ""
                    action_name = m.group(3)

                    full_path = base_route
                    if sub_route:
                        if not sub_route.startswith("/"):
                            full_path = f"{base_route}/{sub_route}"
                        else:
                            full_path = sub_route

                    normalized_path = re.sub(r'\{([^:]+)(:[^}]+)?\}', r':\1', full_path)

                    ep_info = {
                        "verb": http_verb,
                        "raw_route": full_path,
                        "normalized_route": normalized_path,
                        "action": action_name,
                        "controller": ctrl_name,
                    }
                    endpoints.append(ep_info)
                    self.endpoints_catalog.append(ep_info)

                self.add_node(
                    node_id=ctrl_id,
                    node_type="ApiController",
                    label=ctrl_name,
                    file_path=str(ctrl_file),
                    metadata={
                        "base_route": base_route,
                        "endpoints": endpoints,
                        "layer": "Api",
                    },
                )

                # UseCases invocados pela Controller
                for uc_id, uc_data in list(self.nodes.items()):
                    if uc_data["type"] == "UseCase":
                        uc_label = uc_data["label"]
                        if uc_label in content:
                            self.add_edge(
                                source_id=ctrl_id,
                                target_id=uc_id,
                                relationship="invokes",
                            )

    # =========================================================================
    # 3. PARSING PYTHON ML WORKER
    # =========================================================================
    def parse_python_ml(self) -> None:
        ml_dir = self.root_dir / "ml" / "RestauranteInteligente.ML"
        if not ml_dir.exists():
            return

        # FastAPI
        fastapi_main = ml_dir / "app" / "main.py"
        if fastapi_main.exists():
            self.add_node(
                node_id="fastapi:ml_service",
                node_type="FastAPIService",
                label="RestauranteInteligente.ML",
                file_path=str(fastapi_main),
                metadata={
                    "endpoints": [{"verb": "GET", "route": "/health", "purpose": "Liveness/Readiness"}],
                    "port": 8000,
                },
            )

        # Worker RabbitConsumer
        worker_file = ml_dir / "app" / "services" / "rabbit_consumer.py"
        if worker_file.exists():
            self.add_node(
                node_id="worker:RabbitConsumer",
                node_type="PythonWorker",
                label="RabbitConsumer",
                file_path=str(worker_file),
                metadata={
                    "client": "aio-pika",
                    "manual_ack": True,
                    "sql_free": True,
                },
            )
            self.add_edge(
                source_id="worker:RabbitConsumer",
                target_id="queue:previsao.demanda.solicitada",
                relationship="consumes_from",
                metadata={"qos": 10},
            )
            self.add_edge(
                source_id="worker:RabbitConsumer",
                target_id="queue:previsao.demanda.concluida",
                relationship="publishes_to",
                metadata={"format": "Raw JSON"},
            )
            self.add_edge(
                source_id="worker:RabbitConsumer",
                target_id="queue:dlq.previsao.demanda.solicitada",
                relationship="publishes_to",
                metadata={"on_error": "Dead Lettering"},
            )

        # ML Prediction Engine
        ml_service_file = ml_dir / "app" / "services" / "ml_service.py"
        if ml_service_file.exists():
            self.add_node(
                node_id="service:MLPredictionService",
                node_type="MLPipeline",
                label="MLPredictionService",
                file_path=str(ml_service_file),
                metadata={
                    "algorithm": "HistGradientBoostingRegressor",
                    "feature_engineering": ["day_of_week", "month", "lag_1", "rolling_mean_7"],
                },
            )
            self.add_edge(
                source_id="worker:RabbitConsumer",
                target_id="service:MLPredictionService",
                relationship="invokes",
            )

    # =========================================================================
    # 4. PARSING FRONTEND REACT NATIVE (EXPO SDK 54+)
    # =========================================================================
    def parse_frontend(self) -> None:
        frontend_dir = self.root_dir / "src" / "frontend"
        if not frontend_dir.exists():
            return

        # 4.1 Bounded Context Features
        features_dir = frontend_dir / "features"
        if features_dir.exists():
            for feat_dir in features_dir.iterdir():
                if not feat_dir.is_dir():
                    continue
                feat_name = feat_dir.name
                feat_id = f"feature:{feat_name}"
                self.add_node(
                    node_id=feat_id,
                    node_type="FrontendFeature",
                    label=feat_name,
                    file_path=str(feat_dir / "index.ts" if (feat_dir / "index.ts").exists() else feat_dir),
                    metadata={"bounded_context": feat_name},
                )

                # Hooks da Feature
                hooks_dir = feat_dir / "hooks"
                if hooks_dir.exists():
                    for hook_file in hooks_dir.glob("*.ts"):
                        hook_name = hook_file.stem
                        hook_id = f"hook:{hook_name}"
                        self.add_node(
                            node_id=hook_id,
                            node_type="FrontendHook",
                            label=hook_name,
                            file_path=str(hook_file),
                            metadata={"feature": feat_name},
                        )
                        self.add_edge(
                            source_id=feat_id,
                            target_id=hook_id,
                            relationship="invokes",
                        )

                # Services da Feature
                services_dir = feat_dir / "services"
                if services_dir.exists():
                    for srv_file in services_dir.glob("*.ts"):
                        srv_name = srv_file.stem
                        srv_id = f"frontend_service:{srv_name}"
                        self.add_node(
                            node_id=srv_id,
                            node_type="FrontendService",
                            label=srv_name,
                            file_path=str(srv_file),
                            metadata={"feature": feat_name},
                        )
                        self.add_edge(
                            source_id=feat_id,
                            target_id=srv_id,
                            relationship="invokes",
                        )

                        # Vincula Hooks aos Services
                        if hooks_dir.exists():
                            for hook_file in hooks_dir.glob("*.ts"):
                                h_content = hook_file.read_text(encoding="utf-8", errors="replace")
                                if srv_name in h_content:
                                    self.add_edge(
                                        source_id=f"hook:{hook_file.stem}",
                                        target_id=srv_id,
                                        relationship="invokes",
                                    )

                        # Analisa chamadas de API do Service (calls_endpoint)
                        srv_content = srv_file.read_text(encoding="utf-8", errors="replace")
                        client_calls = self._extract_api_client_calls(srv_content)

                        for http_verb, raw_path in client_calls:
                            # Normaliza template literals: `/api/v1/insumos/${id}` -> `/api/v1/insumos/:id`
                            norm_path = re.sub(r'\$\{[^}]+\}', r':param', raw_path)
                            if not norm_path.startswith("/api/v1"):
                                if norm_path.startswith("/"):
                                    norm_path = "/api/v1" + norm_path
                                else:
                                    norm_path = "/api/v1/" + norm_path

                            # Busca Controller correspondente
                            target_controller = self._match_endpoint_to_controller(http_verb, norm_path)
                            if target_controller:
                                self.add_edge(
                                    source_id=srv_id,
                                    target_id=target_controller,
                                    relationship="calls_endpoint",
                                    metadata={
                                        "verb": http_verb,
                                        "path": raw_path,
                                        "normalized": norm_path,
                                    },
                                )

        # 4.2 Shared Services & Hooks
        shared_dir = frontend_dir / "shared"
        if shared_dir.exists():
            sse_hook = shared_dir / "hooks" / "useRealtimeEvents.ts"
            if sse_hook.exists():
                self.add_node(
                    node_id="hook:useRealtimeEvents",
                    node_type="FrontendHook",
                    label="useRealtimeEvents",
                    file_path=str(sse_hook),
                    metadata={"type": "SSE Subscriber"},
                )
                self.add_edge(
                    source_id="hook:useRealtimeEvents",
                    target_id="controller:EventsController",
                    relationship="subscribes_sse",
                    metadata={"channel": "Redis SSE Stream"},
                )

            storage_service = shared_dir / "services" / "storage.ts"
            if storage_service.exists():
                self.add_node(
                    node_id="frontend_service:storage",
                    node_type="FrontendService",
                    label="storage (MMKV)",
                    file_path=str(storage_service),
                    metadata={"provider": "react-native-mmkv", "fast_kv": True},
                )

        # 4.3 App Routes (Pages)
        app_dir = frontend_dir / "app"
        if app_dir.exists():
            for page_file in app_dir.rglob("*.tsx"):
                if page_file.name.startswith("_"):
                    continue  # ignora _layout
                rel_route = str(page_file.relative_to(app_dir)).replace("\\", "/")
                page_id = f"page:{rel_route}"
                self.add_node(
                    node_id=page_id,
                    node_type="FrontendPage",
                    label=rel_route,
                    file_path=str(page_file),
                    metadata={"router": "expo-router", "native_stack": True},
                )

                # Mapeia qual feature a página referencia
                content = page_file.read_text(encoding="utf-8", errors="replace")
                for feat_node_id, feat_data in list(self.nodes.items()):
                    if feat_data["type"] == "FrontendFeature":
                        feat_kw = f"features/{feat_data['label']}"
                        if feat_kw in content:
                            self.add_edge(
                                source_id=page_id,
                                target_id=feat_node_id,
                                relationship="references",
                            )

    def _extract_api_client_calls(self, content: str) -> List[Tuple[str, str]]:
        """Extrai chamadas apiClient de forma resiliente a TypeScript Generics complexos."""
        calls = []
        for m in re.finditer(r'apiClient\.(get|post|put|delete|patch)\b', content, re.IGNORECASE):
            verb = m.group(1).upper()
            sub = content[m.end():m.end() + 600]
            str_match = re.search(r'\(\s*[`\'"]([^`\'"]+)[`\'"]', sub)
            if str_match:
                path = str_match.group(1)
                calls.append((verb, path))
        return calls

    def _match_endpoint_to_controller(self, verb: str, normalized_path: str) -> Optional[str]:
        """Localiza a Controller compatível via matching normalizado de rotas."""
        segments = [s for s in normalized_path.strip("/").split("/") if s]
        if not segments:
            return None

        # Procura correspondência exata nos endpoints catalogados
        for ep in self.endpoints_catalog:
            ep_verb = ep["verb"]
            ep_norm = ep["normalized_route"]

            if ep_verb != verb:
                continue

            ep_segments = [s for s in ep_norm.strip("/").split("/") if s]
            if len(ep_segments) != len(segments):
                continue

            match = True
            for s1, s2 in zip(segments, ep_segments):
                if s1.startswith(":") or s2.startswith(":"):
                    continue
                if s1.lower() != s2.lower():
                    match = False
                    break

            if match:
                return f"controller:{ep['controller']}"

        # Fallback de correspondência pelo prefixo de recurso
        if len(segments) >= 3 and segments[0] == "api" and segments[1] == "v1":
            resource = segments[2].lower()
            for ep in self.endpoints_catalog:
                ctrl = ep["controller"].lower()
                if resource in ctrl or (resource == "caixa" and "fechamento" in ctrl):
                    return f"controller:{ep['controller']}"

        return None

    # =========================================================================
    # 5. PARSING DOCKER COMPOSE
    # =========================================================================
    def parse_docker_compose(self) -> None:
        compose_file = self.root_dir / "docker-compose.yml"
        if not compose_file.exists():
            return

        content = compose_file.read_text(encoding="utf-8", errors="replace")

        # Isola estritamente a seção 'services:'
        services_section_match = re.search(
            r'^services:\s*\n(.*?)(?=^(?:volumes|networks):\s*|\Z)',
            content,
            re.MULTILINE | re.DOTALL,
        )
        if not services_section_match:
            return

        services_content = services_section_match.group(1)
        service_pattern = re.compile(r"^\s{2}([a-zA-Z0-9_\-]+):\s*$", re.MULTILINE)

        containers = []
        for match in service_pattern.finditer(services_content):
            srv_name = match.group(1)
            containers.append(srv_name)

            self.add_node(
                node_id=f"container:{srv_name}",
                node_type="DockerContainer",
                label=srv_name,
                file_path=str(compose_file),
                metadata={"orchestration": "docker-compose"},
            )

        # Mapeia depends_on
        dep_block_pattern = re.compile(
            r"^\s{2}([a-zA-Z0-9_\-]+):.*?(?=^\s{2}[a-zA-Z0-9_\-]+:|\Z)",
            re.DOTALL | re.MULTILINE,
        )
        for match in dep_block_pattern.finditer(services_content):
            parent_svc = match.group(1)
            block = match.group(0)
            if "depends_on:" in block:
                deps = re.findall(r"^\s{6,8}([a-zA-Z0-9_\-]+):", block, re.MULTILINE)
                for dep in deps:
                    if dep in containers:
                        self.add_edge(
                            source_id=f"container:{parent_svc}",
                            target_id=f"container:{dep}",
                            relationship="references",
                            metadata={"type": "depends_on"},
                        )

    # =========================================================================
    # EXPORTAÇÃO (.agents/graph.json e .agents/GRAPH_REPORT.md)
    # =========================================================================
    def export(self) -> Tuple[int, int]:
        AGENTS_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Serializa graph.json
        formatted_edges = []
        for src, tgt, rel, props_json in sorted(self.edges):
            props = json.loads(props_json)
            formatted_edges.append({
                "source": src,
                "target": tgt,
                "relationship": rel,
                "metadata": props,
            })

        graph_payload = {
            "metadata": {
                "system": "Restaurante Inteligente",
                "generator": "generate_knowledge_graph.py",
                "node_count": len(self.nodes),
                "edge_count": len(formatted_edges),
            },
            "nodes": list(self.nodes.values()),
            "edges": formatted_edges,
        }

        graph_json_path = AGENTS_DIR / "graph.json"
        graph_json_path.write_text(
            json.dumps(graph_payload, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        # 2. Serializa GRAPH_REPORT.md (Teto rigoroso de 350 linhas)
        report_md_path = AGENTS_DIR / "GRAPH_REPORT.md"
        report_content = self._generate_report_markdown(graph_payload)
        report_md_path.write_text(report_content, encoding="utf-8")

        return len(self.nodes), len(formatted_edges)

    def _generate_report_markdown(self, graph_data: Dict[str, Any]) -> str:
        type_counts: Dict[str, int] = {}
        for n in graph_data["nodes"]:
            t = n["type"]
            type_counts[t] = type_counts.get(t, 0) + 1

        rel_counts: Dict[str, int] = {}
        for e in graph_data["edges"]:
            r = e["relationship"]
            rel_counts[r] = rel_counts.get(r, 0) + 1

        lines = [
            "# Topologia e Grafo de Conhecimento - Restaurante Inteligente",
            "",
            "> **Sumário Executivo para Agentes de IA**: Este documento consolida a arquitetura física e lógica",
            "> do monorepo, mapeando fluxos críticos, contratos de mensageria, segurança RLS e rotas consumidas.",
            "> Consulte este índice antes de explorar diretórios cegamente.",
            "",
            "## 1. Métricas do Grafo de Conhecimento",
            "",
            f"- **Total de Nós Mapeados**: `{len(graph_data['nodes'])}`",
            f"- **Total de Arestas Semânticas**: `{len(graph_data['edges'])}`",
            "",
            "### Distribuição por Tipo de Nó",
            "| Tipo de Nó | Quantidade | Descrição / Camada |",
            "| :--- | :---: | :--- |",
        ]

        descriptions = {
            "DatabaseTable": "Tabelas PostgreSQL 16 (Ledger, Vendas, RLS)",
            "SecurityPolicy": "Políticas RLS nativas e Interceptor C#",
            "ApiController": "Controllers ASP.NET Core (.NET 9)",
            "UseCase": "Regras de negócio e handlers (Application)",
            "CoreRepository": "Repositórios de persistência EF Core",
            "RedisService": "Cache, Distributed Lock, Streams e Rate Limit",
            "MassTransitConsumer": "Consumidores assíncronos RabbitMQ no C#",
            "MessageQueue": "Filas e Exchanges RabbitMQ (Raw JSON)",
            "FastAPIService": "API Python ML Worker (Health/Liveness)",
            "PythonWorker": "Worker assíncrono aio-pika (Zero SQL)",
            "MLPipeline": "Modelo Scikit-Learn HistGradientBoosting",
            "FrontendPage": "Telas e rotas nativas expo-router",
            "FrontendFeature": "Bounded Contexts (Feature-First)",
            "FrontendHook": "Hooks de orquestração de estado e UI",
            "FrontendService": "Camada de rede e transporte (Axios/MMKV)",
            "DockerContainer": "Serviços locais no docker-compose.yml",
        }

        for t, count in sorted(type_counts.items(), key=lambda x: -x[1]):
            desc = descriptions.get(t, "Componente do ecossistema")
            lines.append(f"| `{t}` | {count} | {desc} |")

        lines.extend([
            "",
            "---",
            "",
            "## 2. Matriz de Fluxos Críticos de Ponta a Ponta",
            "",
            "### Fluxo 1: Venda PDV -> Baixa BOM Pessimista -> Alerta SSE",
            "1. **Trigger**: Operador confirma venda no terminal mobile (`useRegistrarVenda` -> `vendasService.ts`).",
            "2. **Transporte**: `POST /api/v1/vendas` atendido por `VendasController.RegistrarVenda`.",
            "3. **Orquestração**: `RegistrarVendaUseCase` abre transação explícita (`IDbContextTransaction`).",
            "4. **Disciplina Anti-Deadlock**: `BaixaEstoqueService` expande itens da ficha técnica (BOM), agrupa por insumo e ordena por `InsumoId ASC` antes de `SELECT ... FOR UPDATE`.",
            "5. **Ledger Imutável**: Grava em `Vendas`, `ItensVenda` e insere registros append-only em `MovimentacoesEstoque` (`Tipo = 'SAIDA_VENDA'`). Atualiza saldo em `Insumos`.",
            "6. **Streaming**: Se saldo < estoque mínimo, publica em canal Redis Stream. `EventsController` transmite evento `EstoqueCritico` via SSE para `useRealtimeEvents` no mobile.",
            "",
            "### Fluxo 2: Fechamento de Caixa -> RabbitMQ -> ML Worker -> Predição",
            "1. **Trigger**: Fechamento do turno no mobile (`useFecharCaixa` -> `caixaService.ts`).",
            "2. **Transporte**: `POST /api/v1/caixa/fechar` atendido por `FechamentosController.FecharCaixa`.",
            "3. **Transação**: `FecharCaixaUseCase` consolida valores, fecha caixa e publica `PrevisaoDemandaSolicitadaEvent_v1` no RabbitMQ (`previsao.demanda.solicitada`).",
            "4. **Worker Python (Zero-SQL)**: `RabbitConsumer` (`aio-pika`) consome a mensagem com confirmação manual (`manual ack`), computa lags temporais e executa inferência (`HistGradientBoostingRegressor`).",
            "5. **Retorno Assíncrono**: Publica predição em `previsao.demanda.concluida`. Em caso de erro irrecuperável, envia à `dlq.previsao.demanda.solicitada`.",
            "6. **Persistência Segura**: `PrevisaoDemandaConcluidaConsumer` (.NET) consome evento e executa upsert em `Previsoes` sob o contexto RLS do restaurante.",
            "",
            "---",
            "",
            "## 3. Topologia de Mensageria e Streaming",
            "",
            "```mermaid",
            "flowchart LR",
            "    subgraph DotNet [Backend C# .NET 9]",
            "        FC[FecharCaixaUseCase] -->|Pub Raw JSON| EX_SOL[previsao.demanda.solicitada]",
            "        CONS_NET[PrevisaoDemandaConcluidaConsumer] -->|Upsert RLS| DB[(PostgreSQL)]",
            "        EVT_CTRL[EventsController SSE] -->|Stream| SSE_CLI[Mobile useRealtimeEvents]",
            "    end",
            "    subgraph RabbitMQ [RabbitMQ Topology]",
            "        EX_SOL --> Q_SOL[Fila Solicitada]",
            "        EX_SOL -.->|Erro / Nack| DLQ[dlq.previsao.demanda.solicitada]",
            "        Q_CONC[previsao.demanda.concluida] --> CONS_NET",
            "    end",
            "    subgraph PythonML [Worker Python 3.12 (Zero-SQL)]",
            "        Q_SOL --> PY_WORKER[RabbitConsumer aio-pika]",
            "        PY_WORKER --> ML_ENG[HistGradientBoosting]",
            "        ML_ENG -->|Pub Raw JSON| Q_CONC",
            "    end",
            "```",
            "",
            "---",
            "",
            "## 4. Catálogo de Conexão Frontend vs Controllers C#",
            "",
            "| Feature Mobile | Service Frontend | Endpoint C# / Rota | Verbo | Controller C# |",
            "| :--- | :--- | :--- | :---: | :--- |",
        ])

        # Relações calls_endpoint ordenadas
        frontend_calls = []
        for e in graph_data["edges"]:
            if e["relationship"] == "calls_endpoint":
                src = e["source"]
                tgt = e["target"]
                meta = e.get("metadata", {})
                src_node = self.nodes.get(src, {})
                tgt_node = self.nodes.get(tgt, {})
                feature = src_node.get("metadata", {}).get("feature", "shared")
                service = src_node.get("label", src)
                controller = tgt_node.get("label", tgt)
                verb = meta.get("verb", "HTTP")
                path = meta.get("path", "")
                frontend_calls.append((feature, service, path, verb, controller))

        for feat, srv, path, verb, ctrl in sorted(frontend_calls):
            lines.append(f"| `{feat}` | `{srv}` | `{path}` | **{verb}** | `{ctrl}` |")

        lines.extend([
            "",
            "---",
            "",
            "## 5. Diretrizes de Navegação Fail-Closed para Agentes",
            "",
            "1. **Segregação do Python**: Jamais sugira ou escreva `import psycopg2/asyncpg/sqlalchemy` no Worker Python. O Python comunica-se exclusivamente via AMQP (`aio-pika`).",
            "2. **Multi-Tenancy Obrigatório**: Qualquer nova entidade deve implementar `IRestauranteEntity` e ser registrada com `HasQueryFilter` e política RLS correspondente.",
            "3. **Estoque Append-Only**: Nunca gere comandos de `UPDATE` ou `DELETE` na tabela `MovimentacoesEstoque`.",
            "4. **Mobile Native First**: Toda UI mobile deve adotar estritamente `expo-router` e subcomponentes modulares com teto de 350 linhas por arquivo `.tsx`.",
            "",
            "*(Relatório gerado automaticamente por `.agents/scripts/generate_knowledge_graph.py`)*",
        ])

        return "\n".join(lines[:350])


def main() -> None:
    print(f"[*] Iniciando extração do Grafo de Conhecimento em: {ROOT_DIR}")
    builder = KnowledgeGraphBuilder(ROOT_DIR)

    print("[1/5] Mapeando PostgreSQL DDL e Políticas RLS...")
    builder.parse_postgres_scripts()

    print("[2/5] Mapeando Backend .NET 9 (Controllers, UseCases, Repositories, Redis, MassTransit)...")
    builder.parse_dotnet_backend()

    print("[3/5] Mapeando Python ML Worker (FastAPI, RabbitConsumer, Pipelines)...")
    builder.parse_python_ml()

    print("[4/5] Mapeando Frontend Mobile Expo (Routes, Features, Hooks, Services, Shared)...")
    builder.parse_frontend()

    print("[5/5] Mapeando Docker Compose e Infraestrutura de Containers...")
    builder.parse_docker_compose()

    node_count, edge_count = builder.export()

    print("\n[+] Grafo de Conhecimento e Topologia gerados com sucesso!")
    print(f"    - Arquivo JSON:     {AGENTS_DIR / 'graph.json'}")
    print(f"    - Relatório MD:     {AGENTS_DIR / 'GRAPH_REPORT.md'}")
    print(f"    - Total de Nós:     {node_count}")
    print(f"    - Total de Arestas: {edge_count}\n")


if __name__ == "__main__":
    main()
