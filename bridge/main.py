"""Hello World plugin bridge — publishes a counter on plugins/hello/counter every 5 s."""
import json
import logging
import os
import signal
import sys
import time
from dataclasses import dataclass

import paho.mqtt.client as mqtt


TOPIC = "plugins/hello/counter"
TICK_INTERVAL_SEC = 5
MAX_BACKOFF_SEC = 30

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [hello-bridge] %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger(__name__)


@dataclass
class State:
    counter: int = 0


def build_payload(state: State) -> str:
    """Returns the next MQTT payload and mutates state. Pure-ish; testable."""
    state.counter += 1
    return json.dumps({"value": state.counter, "source": "bridge"})


def publish_tick(client: "mqtt.Client", state: State) -> None:
    """Drive one tick: build payload, publish. Testable via a mock client."""
    payload = build_payload(state)
    info = client.publish(TOPIC, payload)
    if hasattr(info, "rc") and info.rc != 0:
        log.warning("publish returned rc=%s", info.rc)


def next_backoff(previous: int) -> int:
    """Exponential backoff: 1, 2, 4, 8, 16, 30, 30, …"""
    if previous == 0:
        return 1
    return min(previous * 2, MAX_BACKOFF_SEC)


def connect_with_backoff(client: "mqtt.Client", host: str, port: int) -> None:
    """Block until the first successful connect. Log each retry."""
    delay = 0
    while True:
        try:
            client.connect(host, port, keepalive=30)
            log.info("connected to %s:%s", host, port)
            return
        except Exception as e:
            delay = next_backoff(delay)
            log.warning("connect to %s:%s failed (%s); retry in %ds", host, port, e, delay)
            time.sleep(delay)


def run(host: str, port: int) -> None:
    """Main loop: connect, publish every TICK_INTERVAL_SEC seconds, handle SIGTERM."""
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="dashkit-hello-bridge",
    )
    state = State()

    stop = {"requested": False}

    def handle_sigterm(_sig, _frame):
        log.info("SIGTERM received — stopping")
        stop["requested"] = True

    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigterm)

    connect_with_backoff(client, host, port)
    client.loop_start()
    try:
        while not stop["requested"]:
            publish_tick(client, state)
            for _ in range(TICK_INTERVAL_SEC):
                if stop["requested"]:
                    break
                time.sleep(1)
    finally:
        client.loop_stop()
        client.disconnect()
        log.info("disconnected, exiting")


def main() -> int:
    host = os.environ.get("MQTT_HOST", "127.0.0.1")
    port = int(os.environ.get("MQTT_PORT", "1883"))
    run(host, port)
    return 0


if __name__ == "__main__":
    sys.exit(main())
