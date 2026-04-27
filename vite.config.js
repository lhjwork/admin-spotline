import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 3004,
        headers: {
            // 보안 헤더 추가
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom", "react-router-dom"],
                    charts: ["recharts"],
                    query: ["@tanstack/react-query"],
                    supabase: ["@supabase/supabase-js"],
                    dnd: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
                },
            },
        },
    },
});
