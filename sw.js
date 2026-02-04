const CACHE_NAME = "ev-tracker-v1";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./css/styles.css",
    "./js/app.js",
    "./js/services/supabase.js",
    "./js/utils/utils.js",
    "./js/utils/stats.js",
    "./js/components/ui.js",
    "./js/components/charts.js",
    "./js/components/analysis.js",
    "./js/components/forms.js",
    "https://cdn.tailwindcss.com",
    "https://unpkg.com/react@18/umd/react.development.js",
    "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
    "https://unpkg.com/@babel/standalone/babel.min.js",
    "https://cdn.jsdelivr.net/npm/chart.js",
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js"
];

// Installazione: scarica e salva i file
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Attivazione: usa i file salvati
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});