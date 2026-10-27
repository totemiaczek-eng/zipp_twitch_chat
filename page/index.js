import { BasePage } from "@zeppos/zml/zml-page";
import { createWidget, widget, prop, setStatusBarVisible } from "@zos/ui";
import { px } from "@zos/utils";
import { createSysTimer, stopTimer } from "@zos/timer";
import * as layout from "zosLoader:./index.[pf].layout.js";

const MAX_MESSAGES = 6;

Page(
  BasePage({
    state: {
      messages: [],
      cursor: null,
      timerId: null,
      isLoading: false,
      chatWidget: null,
      statusWidget: null,
    },
    build() {
      setStatusBarVisible(false);
      createWidget(widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: px(390),
        h: px(450),
        color: 0x101214,
      });
      createWidget(widget.TEXT, layout.TITLE);
      this.state.statusWidget = createWidget(widget.TEXT, layout.STATUS);
      this.state.chatWidget = createWidget(widget.TEXT, {
        ...layout.CHAT,
        text: "Waiting for chat...",
      });
      createWidget(widget.BUTTON, {
        ...layout.OLDER_BUTTON,
        click_func: () => this.loadOlder(),
      });
      createWidget(widget.BUTTON, {
        ...layout.REFRESH_BUTTON,
        click_func: () => this.refresh(false),
      });
      this.refresh(false);
      this.state.timerId = createSysTimer(true, 8000, () => this.refresh(false));
    },
    onDestroy() {
      if (this.state.timerId !== null) stopTimer(this.state.timerId);
    },
    async refresh(older) {
      if (this.state.isLoading) return;
      this.state.isLoading = true;
      this.setStatus("Connecting");
      try {
        const params = older && this.state.messages.length
          ? { before: this.state.messages[0].id }
          : {};
        const result = await this.request({ method: "GET_CHAT", params });
        if (result.error) throw new Error(result.error);
        const incoming = Array.isArray(result.messages) ? result.messages : [];
        this.state.messages = older
          ? incoming.concat(this.state.messages).slice(0, MAX_MESSAGES)
          : mergeMessages(this.state.messages, incoming).slice(-MAX_MESSAGES);
        this.state.cursor = this.state.messages.length
          ? this.state.messages[this.state.messages.length - 1].id
          : null;
        this.state.chatWidget.setProperty(prop.TEXT, formatMessages(this.state.messages));
        this.setStatus(`${result.channel || "Twitch"}  |  LIVE`);
      } catch (error) {
        this.setStatus("Phone / relay offline");
        if (!this.state.messages.length) {
          this.state.chatWidget.setProperty(prop.TEXT, "Open the relay and set a live channel.");
        }
      } finally {
        this.state.isLoading = false;
      }
    },
    loadOlder() {
      this.refresh(true);
    },
    setStatus(text) {
      this.state.statusWidget.setProperty(prop.TEXT, text);
    },
  })
);

function mergeMessages(existing, incoming) {
  const messages = new Map();
  existing.concat(incoming).forEach((message) => messages.set(message.id, message));
  return Array.from(messages.values()).sort((left, right) => left.id - right.id);
}

function formatMessages(messages) {
  if (!messages.length) return "No chat messages yet.";
  return messages.slice().reverse().map((message) => `${message.user}: ${message.text}`.slice(0, 42)).join("\n\n");
}
