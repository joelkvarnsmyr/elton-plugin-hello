import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useMqttPublish, usePluginData } from "@elton/plugin-sdk";
function HelloWidget() {
  const [count, setCount] = useState(0);
  const publish = useMqttPublish();
  const soc = usePluginData("battery.soc");
  const handleClick = () => {
    const next = count + 1;
    setCount(next);
    publish(
      "plugins/hello/counter",
      JSON.stringify({ value: next, source: "widget" })
    );
  };
  return /* @__PURE__ */ jsxs("div", { style: cardStyle, children: [
    /* @__PURE__ */ jsx("div", { style: labelStyle, children: "Hello World" }),
    /* @__PURE__ */ jsxs("div", { style: counterStyle, children: [
      "Counter: ",
      count
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: handleClick, style: btnStyle, children: "+1" }),
    /* @__PURE__ */ jsxs("div", { style: batteryStyle, children: [
      "Battery: ",
      soc !== null ? `${Math.round(soc)}%` : "—"
    ] })
  ] });
}
const cardStyle = {
  width: 200,
  padding: 16,
  background: "#0f0f0f",
  border: "1px solid #1a1a1a",
  borderRadius: 10,
  fontFamily: "system-ui, sans-serif"
};
const labelStyle = {
  color: "#D4A84B",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: 0.5
};
const counterStyle = {
  fontSize: "1.4rem",
  color: "#fff",
  margin: "6px 0 10px 0"
};
const btnStyle = {
  background: "#D4A84B",
  color: "#000",
  border: "none",
  borderRadius: 6,
  padding: "6px 14px",
  fontSize: "0.9rem",
  fontWeight: 500,
  cursor: "pointer"
};
const batteryStyle = {
  color: "#888",
  fontSize: "0.8rem",
  marginTop: 12
};
export {
  HelloWidget as default
};
