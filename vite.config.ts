
import react from '@vitejs/plugin-react'

import { defineConfig } from "vite";
import path from "path";
import federation from "@originjs/vite-plugin-federation";

import type { SharedConfig } from "@originjs/vite-plugin-federation";
type SharedConfigWithSingleton = SharedConfig & {
    singleton?: boolean;
};
type SharedWithSingleton = Record<string, SharedConfigWithSingleton>;

export default defineConfig({
    server: {
        port: 3002,
        host: true,
    },
    plugins: [
        react(),
        federation({
            name: "contacts",
            filename: "remoteEntry.js",
            exposes: {
                "./ContactsPage": "./src/pages/ContactsPage.tsx",
            },
            shared: {
                react: {
                    singleton: true,
                    requiredVersion: "^18.3.1",
                },
                "react-dom": {
                    singleton: true,
                    requiredVersion: "^18.3.1",
                },
                "react-router-dom": {
                    singleton: true,
                    requiredVersion: "^6.30.1",
                },
            } as SharedWithSingleton,
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        target: "esnext",
        minify: false,
        cssCodeSplit: false,
    },
});
