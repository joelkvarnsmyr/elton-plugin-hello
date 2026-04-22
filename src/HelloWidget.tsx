import { useState } from 'react';
import { useMqttPublish, usePluginData } from '@elton/plugin-sdk';

/**
 * Hello World widget
 *
 * - Local counter + "+1" button → publishes plugins/hello/counter
 *   (uses useMqttPublish — permission declared in manifest.json)
 * - Reads battery.soc from the host system store (via usePluginData)
 *
 * The bridge runs independently and publishes its own ticks on the same topic
 * every 5s — so the widget's button is not the only source.
 */
export default function HelloWidget() {
  const [count, setCount] = useState(0);
  const publish = useMqttPublish();
  const soc = usePluginData<number>('battery.soc');

  const handleClick = () => {
    const next = count + 1;
    setCount(next);
    publish(
      'plugins/hello/counter',
      JSON.stringify({ value: next, source: 'widget' }),
    );
  };

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Hello World</div>
      <div style={counterStyle}>Counter: {count}</div>
      <button onClick={handleClick} style={btnStyle}>
        +1
      </button>
      <div style={batteryStyle}>
        Battery: {soc !== null ? `${Math.round(soc)}%` : '—'}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  width: 200,
  padding: 16,
  background: '#0f0f0f',
  border: '1px solid #1a1a1a',
  borderRadius: 10,
  fontFamily: 'system-ui, sans-serif',
};

const labelStyle: React.CSSProperties = {
  color: '#D4A84B',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const counterStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  color: '#fff',
  margin: '6px 0 10px 0',
};

const btnStyle: React.CSSProperties = {
  background: '#D4A84B',
  color: '#000',
  border: 'none',
  borderRadius: 6,
  padding: '6px 14px',
  fontSize: '0.9rem',
  fontWeight: 500,
  cursor: 'pointer',
};

const batteryStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '0.8rem',
  marginTop: 12,
};
