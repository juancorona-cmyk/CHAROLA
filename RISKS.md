# Riesgos — charolas

| # | Riesgo | Severidad | Probabilidad | Mitigacion |
|---|---|---|---|---|
| 1 | Variables de entorno expuestas | Alta | Baja | Verificar .gitignore, nunca commitear .env |
| 2 | Puppeteer en Netlify — compatibilidad | Media | Media | Verificar layer de chromium en build |
