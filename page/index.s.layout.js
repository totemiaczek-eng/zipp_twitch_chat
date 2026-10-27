import { align, text_style } from "@zos/ui";
import { px } from "@zos/utils";

export const TITLE = {
  x: px(24),
  y: px(28),
  w: px(342),
  h: px(40),
  color: 0xffffff,
  text_size: px(30),
  text: "TWITCH CHAT",
};

export const STATUS = {
  x: px(24),
  y: px(76),
  w: px(342),
  h: px(28),
  color: 0x43d17d,
  text_size: px(18),
  text: "Connecting",
};

export const CHAT = {
  x: px(24),
  y: px(116),
  w: px(342),
  h: px(240),
  color: 0xe9e9e9,
  text_size: px(18),
  align_h: align.LEFT,
  align_v: align.TOP,
  text_style: text_style.WRAP,
};

export const OLDER_BUTTON = {
  x: px(24),
  y: px(382),
  w: px(160),
  h: px(52),
  radius: px(8),
  text_size: px(19),
  normal_color: 0x292d30,
  press_color: 0x42484d,
  text: "OLDER",
};

export const REFRESH_BUTTON = {
  x: px(206),
  y: px(382),
  w: px(160),
  h: px(52),
  radius: px(8),
  text_size: px(19),
  normal_color: 0xe94d7a,
  press_color: 0xb83c61,
  text: "REFRESH",
};
