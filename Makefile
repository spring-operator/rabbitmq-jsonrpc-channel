PACKAGE=rabbitmq-jsonrpc-channel
DEPS=rabbitmq-server erlang-rfc4627 rabbitmq-mochiweb rabbitmq-jsonrpc
TEST_APPS=mochiweb rabbit_mochiweb rfc4627_jsonrpc rabbit_jsonrpc rabbit_jsonrpc_channel
START_RABBIT_IN_TESTS=true

include ../include.mk
