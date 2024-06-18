// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: {enabled: true},
    nitro: {
        preset: "cloudflare-pages"
    },
    modules: ["nitro-cloudflare-dev", "@nuxt/ui", "nuxt-lodash", "@vite-pwa/nuxt"],
    pwa: {
        manifest: {
            name: "Verity Universal",
            short_name: "Verity",
            description: "The toolkits for Verity encounter from Salvation's Edge.",
            theme_color: "#ffffff",
            icons: [
                {
                    src: "icons/Verity.png",
                    sizes: "500x500",
                    type: "image/png",
                }
            ]
        },
        workbox: {
            navigateFallback: "/",
        },
        devOptions: {
            enabled: true,
            type: "module",
        }
    }
})