# Di Gusto Macerata

Sito one-page del Ristorante Di Gusto, Via XX Settembre 12, Macerata.

HTML, CSS e JavaScript puri: nessuna dipendenza e nessun passaggio di build.

## Struttura

```
index.html        pagina
styles.css        stili (tema scuro, mobile-first)
script.js         animazioni allo scroll, menu mobile, orari
assets/           foto, favicon e icone
robots.txt
.github/workflows/deploy.yml   pubblicazione su GitHub Pages
```

## Vedere il sito in locale

Apri `index.html` nel browser, oppure avvia un server locale:

```
python -m http.server 8000
```

e visita http://localhost:8000.

## Pubblicazione

Ogni push su `main` pubblica il sito su GitHub Pages tramite il workflow in `.github/workflows/deploy.yml`.

Configurazione una tantum: nel repository vai su **Settings → Pages** e in **Build and deployment → Source** scegli **GitHub Actions**.

Indirizzo: https://stocchez.github.io/SitoDigusto/

Se in futuro usi un dominio personalizzato, aggiorna `og:url` e `og:image` in `index.html`.

## Modificare i contenuti

- **Orari**: tabella `.hours` in `index.html` (il giorno corrente si evidenzia da solo).
- **Telefono**: cerca `tel:+390733474364` in `index.html`.
- **Foto**: in `assets/img/`, in formato JPEG (larghezza massima consigliata 1800px).
