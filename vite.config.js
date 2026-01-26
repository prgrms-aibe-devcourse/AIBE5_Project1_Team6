import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/tourapi": {
        target: "https://apis.data.go.kr",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tourapi/, ""),
      },

      // ✅ MOFA API Proxy
      "/api/mofa": {
        // 문서상 요청주소가 http로 표기되는 케이스가 많아서 http로 맞추는 게 안전
        target: "http://apis.data.go.kr/1262000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/mofa/, ""),
      },
    },
  },
});