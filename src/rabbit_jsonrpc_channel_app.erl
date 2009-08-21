-module(rabbit_jsonrpc_channel_app).

-behaviour(application).
-export([start/2,stop/1]).

start(_Type, _StartArgs) ->
    ContextRoot = case application:get_env(rabbit_jsonrpc_channel, js_root) of
        {ok, Root} -> Root;
        undefined  -> "rabbitmq_lib"
    end,
    rabbit_mochiweb:register_static_context(ContextRoot, ?MODULE, "priv/www"),
    rabbit_jsonrpc_channel_app_sup:start_link().

stop(_State) ->
    ok.