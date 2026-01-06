import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    headers: {
      // 보안 헤더 추가
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
    // 개발 환경에서만 프록시 사용 (선택사항)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:4000',
    //     changeOrigin: true
    //   }
    // }
  },
});
