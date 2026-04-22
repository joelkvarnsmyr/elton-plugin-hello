# elton-plugin-hello

A minimal reference plugin for the [ELTON Dashboard](https://github.com/joelkvarnsmyr/ELTON-Dashboard-Project) — shows how the pieces fit together and serves as a template for your own plugins.

## What it does

- **Widget** — a small card that shows a counter and the current battery state-of-charge.
  - Counter is local (React state). Clicking "+1" publishes `plugins/hello/counter` on MQTT via `useMqttPublish`.
  - Battery SoC is read from the host system store via `usePluginData('battery.soc')`.
- **Bridge** — a Python process that publishes `plugins/hello/counter` every 5 seconds, independently of the widget.

Both publishers use the topic `plugins/hello/counter`. They don't coordinate — they're deliberately independent to show each SDK capability in isolation.

## Install it

Three ways, in order of speed:

### 1. Companion UI (recommended)

On the Pi's companion app:

1. `Settings → Plugins → [+] (FAB) → Från URL`
2. Paste `https://github.com/joelkvarnsmyr/elton-plugin-hello.git`
3. `Installera`
4. Wait ~15 s → plugin appears in the list
5. Toggle on → allow permissions → watch the widget preview render in the details page

### 2. SSH (for ad-hoc testing)

```bash
ssh elton@elton.local "cd ~/elton-plugins && git clone https://github.com/joelkvarnsmyr/elton-plugin-hello.git hello && bash ~/elton/scripts/elton-plugin-registry.sh"
```

Then enable from the UI as above.

### 3. Development symlink (iterate fast)

On your laptop:

```bash
cd ~/Projects
git clone https://github.com/joelkvarnsmyr/elton-plugin-hello.git
cd elton-plugin-hello
pnpm install
pnpm build
# edit src/HelloWidget.tsx, re-run pnpm build, rsync ui/ to the Pi
```

## Try it

After installing + enabling:

1. Open `Settings → Plugins → Hello World` in the companion app.
2. The **Widget preview** section renders the widget.
3. Click `+1` — check `mosquitto_sub -t 'plugins/hello/#' -v` on the Pi. You'll see:
   ```
   plugins/hello/counter {"value":1,"source":"widget"}
   plugins/hello/counter {"value":17,"source":"bridge"}
   ```
   The bridge is publishing its own ticks every 5 s; they arrive interleaved.
4. The battery readout updates as the host's SoC changes.
5. The **Loggar** section on the details page shows the bridge's stderr output.

## How it's built

### `manifest.json`

The manifest is the plugin's contract with the host:

```json
{
  "id": "hello",
  "contributes": {
    "widget": { "file": "ui/HelloWidget.js", "size": "small", "label": "Hello" },
    "bridge": { "file": "main.py", "service": "hello" }
  },
  "permissions": {
    "mqtt_publish": ["plugins/hello/#"],
    "mqtt_subscribe": [],
    "store_read": ["battery"]
  }
}
```

Permissions are enforced at SDK runtime. If your widget tries to publish a topic outside `mqtt_publish`, the SDK throws and your widget renders its error fallback.

### Bridge

`bridge/main.py` uses `paho-mqtt` and publishes a counter every 5 seconds. Key points:

- Testable — the `publish_tick(client, state)` function takes an injected client, so `test_bridge.py` drives it with a `MagicMock`.
- Handles SIGTERM cleanly so systemd can restart it without leaving zombies.
- Reconnect backoff: 1s → 2s → 4s … capped at 30s.
- `bridge/service.template` is the systemd unit; SP2's `dashkit-plugin-api` substitutes `{{PLUGIN_ID}}` / `{{PLUGIN_DIR}}` / `{{BRIDGE_ENTRY}}` at install time.

Run the bridge tests locally:

```bash
cd bridge
python -m venv venv
venv/Scripts/pip install -r requirements.txt pytest   # venv/bin/pip on Linux/macOS
venv/Scripts/python -m pytest tests -v
```

Expected: 4 tests pass.

### Widget

`src/HelloWidget.tsx` is ~80 lines of React. The SDK hooks it uses:

- `useMqttPublish()` → a function `(topic, payload) => void`; throws on unauthorized topic.
- `usePluginData<T>(path)` → synchronous read from the host store; returns `null` until the store is populated.

### Build

Vite library mode produces `ui/HelloWidget.js`:

```bash
pnpm install
pnpm build
```

`vite.config.ts` externalizes `react`, `react/jsx-runtime`, and `@elton/plugin-sdk` so the runtime instances come from the host. The build output is a single unminified ES module (~1.7 KB) — readable source is more useful than a tiny bundle for a reference.

### SDK dependency

This plugin depends on `@elton/plugin-sdk` via a pnpm git-subdirectory URL (points at a subdir inside the ELTON monorepo):

```json
"@elton/plugin-sdk": "github:joelkvarnsmyr/ELTON-Dashboard-Project#feat/sp4-plugin-hello&path:/packages/plugin-sdk"
```

After the monorepo's `feat/sp4-plugin-hello` branch merges to `main`, update the dep to `#main`. When the SDK is eventually published to npm, switch to `^0.1.0` instead.

## Make your own plugin

1. `gh repo create <your-user>/elton-plugin-<name> --public`
2. Copy this repo's files into the new one.
3. Rename in `manifest.json`: `id`, `name`, `description`, `homepage`, `contributes.bridge.service`, and the `permissions.mqtt_publish` patterns.
4. Replace `bridge/main.py` with your own logic.
5. Replace `src/HelloWidget.tsx` with your own widget.
6. `pnpm install && pnpm build` → commit → push.
7. Install via the companion's UI.

## Troubleshooting

**"Plugin not found" when installing** — make sure the repo is public (`gh repo view --json visibility`).

**Widget preview is blank** — check the browser console for an error. Common causes: the built file's imports reference deps the host doesn't provide, or `manifest.contributes.widget.file` points at the wrong path.

**Bridge doesn't tick** — check `journalctl -u dashkit-hello -n 50 --no-pager` on the Pi. Most common failure: MQTT broker unreachable.

**Battery readout stays `—`** — the host store hasn't received `battery.soc` yet. Check MQTT traffic on `N/elton/system/0/Dc/Battery/Soc`.

## SDK reference

See [`@elton/plugin-sdk`](https://github.com/joelkvarnsmyr/ELTON-Dashboard-Project/tree/main/packages/plugin-sdk) in the monorepo. Hook docs are in that package's README.

## License

MIT — do whatever you want.
