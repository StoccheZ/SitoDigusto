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
```

## Vedere il sito in locale

Apri `index.html` nel browser, oppure avvia un server locale:

```
python -m http.server 8000
```

e visita http://localhost:8000.

## Pubblicazione

Il repository è collegato a Vercel: ogni push su `main` aggiorna il sito online.

Indirizzo: https://digusto-lac.vercel.app/
Non serve alcun passaggio di build, Vercel pubblica i file statici così come sono.

Se cambi dominio, aggiorna in `index.html` `og:url`, `og:image` e `canonical`
(servono per le anteprime dei link su WhatsApp e social).

## Modificare i contenuti

- **Orari**: tabella `.hours` in `index.html` (il giorno corrente si evidenzia da solo).
- **Telefono**: cerca `tel:+390733474364` in `index.html`.
- **Foto**: in `assets/img/`, in formato JPEG (larghezza massima consigliata 1800px).
