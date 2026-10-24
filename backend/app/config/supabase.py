from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from supabase import Client

# conexão: falha em 3 s (rede caída) em vez de travar a requisição; leitura: até 5 s
POSTGREST_TIMEOUT_SECONDS = 5
CONNECT_TIMEOUT_SECONDS = 3
# mantém a conexão TLS aberta entre consultas espaçadas (o padrão do httpx fecha após 5 s)
KEEPALIVE_SECONDS = 60


def create_supabase_client(url: str, key: str) -> "Client":
    import httpx
    from supabase import ClientOptions, create_client

    # O cliente padrão do postgrest usa HTTP/2 numa conexão única, que falha (WinError 10035)
    # quando as threads do Flask consultam ao mesmo tempo; o pool HTTP/1.1 é seguro entre threads.
    http_client = httpx.Client(
        http2=False,
        timeout=httpx.Timeout(POSTGREST_TIMEOUT_SECONDS, connect=CONNECT_TIMEOUT_SECONDS),
        limits=httpx.Limits(
            max_connections=20, max_keepalive_connections=10, keepalive_expiry=KEEPALIVE_SECONDS
        ),
        follow_redirects=True,
    )
    options = ClientOptions(
        postgrest_client_timeout=POSTGREST_TIMEOUT_SECONDS,
        auto_refresh_token=False,
        persist_session=False,
        httpx_client=http_client,
    )
    client = create_client(url, key, options)
    # cria o cliente do postgrest agora: a criação preguiçosa não tem trava entre threads
    _ = client.postgrest
    return client
