"""Tests for the hello-plugin bridge.

Runs without a real MQTT broker — we mock paho's Client and drive the public
functions directly.
"""
import json
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Allow importing the sibling main.py
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import TOPIC, State, build_payload, next_backoff, publish_tick  # noqa: E402


def test_counter_increments_on_publish():
    state = State()
    client = MagicMock()

    publish_tick(client, state)
    publish_tick(client, state)
    publish_tick(client, state)

    assert state.counter == 3

    # Last publish call carries value 3
    last_call = client.publish.call_args_list[-1]
    topic_arg, payload_arg = last_call.args[:2]
    assert topic_arg == TOPIC
    body = json.loads(payload_arg)
    assert body == {"value": 3, "source": "bridge"}


def test_publish_topic_matches_manifest_permission():
    # The manifest declares plugins/hello/#; bridge uses plugins/hello/counter.
    assert TOPIC.startswith("plugins/hello/")


def test_backoff_sequence():
    # next_backoff doubles from 1, caps at 30
    seq = []
    cur = 0
    for _ in range(8):
        cur = next_backoff(cur)
        seq.append(cur)
    assert seq == [1, 2, 4, 8, 16, 30, 30, 30]


def test_build_payload_is_valid_json_with_expected_keys():
    state = State(counter=41)
    payload = build_payload(state)
    body = json.loads(payload)
    assert body["value"] == 42
    assert body["source"] == "bridge"
    assert state.counter == 42
