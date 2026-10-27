const test = require("node:test");
const assert = require("node:assert/strict");
const { DEFAULT_CHANNEL, normalizeChannel, parsePrivmsg } = require("../.relay/server");

test("channel names are normalized for Twitch IRC", () => {
  assert.equal(normalizeChannel("#SomeChannel "), "somechannel");
});

test("uses the configured Twitch channel fallback for miwca", () => {
  assert.equal(DEFAULT_CHANNEL, "miwca");
  assert.equal(normalizeChannel(DEFAULT_CHANNEL), "miwca");
});

test("parses read-only Twitch chat messages and display names", () => {
  const message = parsePrivmsg(
    "@display-name=TestUser;id=abc :testuser!testuser@test.tmi.twitch.tv PRIVMSG #channel :hello chat"
  );
  assert.deepEqual(message, { user: "TestUser", text: "hello chat" });
});

test("ignores non-chat IRC messages", () => {
  assert.equal(parsePrivmsg("PING :tmi.twitch.tv"), null);
  assert.equal(parsePrivmsg(":server 001 nick :Welcome"), null);
});
