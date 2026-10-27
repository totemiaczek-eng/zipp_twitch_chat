import { BaseSideService } from "@zeppos/zml/zml-side";
import { RELAY_URL } from "./settings";

async function getChat(before) {
  const cursor = before ? `?before=${before}` : "";
  const response = await fetch({
    url: `${RELAY_URL}/chat${cursor}`,
    method: "GET",
  });
  const body = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
  return body;
}

AppSideService(
  BaseSideService({
    onInit() {},
    async onRequest(request, response) {
      if (request.method !== "GET_CHAT") return;
      try {
        response(null, await getChat(request.params && request.params.before));
      } catch (error) {
        response(null, { error: "Relay unavailable", messages: [] });
      }
    },
    onRun() {},
    onDestroy() {},
  })
);
