import { onRequest as __api_logs_js_onRequest } from "E:\\hs\\blog\\hsblog\\functions\\api\\logs.js"
import { onRequest as __api_notes_js_onRequest } from "E:\\hs\\blog\\hsblog\\functions\\api\\notes.js"

export const routes = [
    {
      routePath: "/api/logs",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_logs_js_onRequest],
    },
  {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_notes_js_onRequest],
    },
  ]