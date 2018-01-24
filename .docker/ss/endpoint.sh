#!/bin/bash

RUST_LOG=secretstore=trace,secretstore_net=trace /parity --config config.toml --jsonrpc-apis web3,eth,pubsub,net,parity,parity_pubsub,parity_set,parity_accounts,traces,rpc,secretstore,personal &