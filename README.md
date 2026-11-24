# L'Eco del Fantacalcio

Il quotidiano della lega: ogni giornata diventa una prima pagina, con risultati,
classifica, pagelle ai presidenti, il migliore e il peggiore, i pettegolezzi della chat
e le voci di mercato. Semi-serio, volutamente fazioso.

> **Stato attuale:** è pronta la UI. I dati in `src/data/league.ts` sono **segnaposto
> inventati** (8 squadre, 12 giornate) e vanno sostituiti con quelli veri.

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build di produzione in dist/
```

## Sezioni

| Sezione | Cosa mostra |
| --- | --- |
| **Prima pagina** | Apertura, risultati, classifica compatta, top & flop, i numeri, la frase della settimana, editoriale, cronache, Bar dello Sport, mercato, brevi, pagelle, prossimo turno |
| **Classifica** | Tabella completa con forma e variazioni, curiosità (miglior attacco, il più sfortunato…), grafico dell'andamento |
| **Risultati** | Tutte le giornate con gol e fantapunti |
| **Squadre** | Scheda di ogni squadra: presidente, motto, media, record, andamento |
| **Archivio** | Tutte le prime pagine della stagione |

In alto si può sfogliare qualsiasi giornata: classifica e statistiche vengono ricalcolate
a quella data. C'è anche l'«edizione della sera» (tema scuro).

## I dati

Tutto parte da un unico oggetto `League` (tipi in `src/types.ts`):

- **squadre**: nome, sigla, presidente, colori sociali, motto;
- **giornate**: data e risultati in **fantapunti**. I gol si calcolano da soli
  (soglia 66, +1 gol ogni 6 punti, configurabile) ma si possono anche indicare a mano;
- **contenuti facoltativi** per giornata: articoli, ultim'ora, pagelle, top/flop, la frase.

Classifica, forma, variazioni di posizione e statistiche sono **calcolate** dai risultati.
Se una giornata non ha articoli, il giornale genera da solo apertura e titoli a partire
dai risultati.

## Pubblicazione

`.github/workflows/deploy.yml` builda e pubblica su GitHub Pages a ogni push
(serve una volta sola: *Settings → Pages → Source: GitHub Actions*).
