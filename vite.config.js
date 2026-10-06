import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function serveAnswerPage() {
  const rewrite = (req, res, next) => {
    const path = req.url?.split("?")[0] ?? "";
    if (path === "/answer") {
      res.statusCode = 302;
      res.setHeader("Location", "/answer/");
      res.end();
      return;
    }
    if (path === "/answer/") {
      req.url = "/answer/index.html";
    }
    next();
  };
  return {
    name: "serve-answer-page",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), serveAnswerPage()],
  test: {
    environment: "node",
  },
});
