# Asta Fantacalcio

Web app per gestire l'asta del fantacalcio: squadre, crediti, rose, e — soprattutto —
**quanto conviene davvero pagare ogni giocatore**.

Il listone (496 giocatori, 20 squadre di Serie A) è già dentro l'app, estratto dal PDF
di fantacalcio.it 2026/27.

## Avvio

```bash
npm install
npm run dev        # apre su http://localhost:5173
```

Altri comandi:

```bash
npm run build      # build di produzione in dist/
npm run preview    # serve la build
npm test           # test del modello statistico
```

Tutto gira nel browser: nessun server, nessun account. I dati dell'asta stanno nel
`localStorage`, con export/import JSON dalla scheda **Impostazioni** per il backup o per
passare da un dispositivo all'altro.

## Metterla online (GitHub Pages)

Il deploy è già configurato: `.github/workflows/deploy.yml` builda e pubblica a ogni
push. Resta **un solo passaggio da fare a mano, una volta sola**:

> Settings → Pages → *Build and deployment* → **Source: GitHub Actions**

Fatto questo, il primo push (o *Run workflow* dalla tab **Actions**) pubblica il sito su

```
https://lapocremonesi.github.io/fantacalcio/
```

Il workflow gira i test prima di pubblicare: se il modello si rompe, il deploy non parte.

Nota tecnica: in `vite.config.ts` il `base` è `'./'`, cioè i percorsi degli asset sono
relativi. Così il sito funziona sia sotto `/fantacalcio/` sia su un dominio custom sia
aperto da una sottocartella qualsiasi, senza dover cambiare configurazione.

## Come si usa

1. **Squadre** — con il pulsante **+** aggiungi tutte le squadre della lega. La prima
   diventa «la mia»: è quella per cui l'app calcola i consigli d'asta (puoi cambiarla
   con *È la mia*).
2. **Impostazioni** — imposti **una volta sola** quanti portieri, difensori,
   centrocampisti e attaccanti compongono la rosa: i numeri valgono per tutte le
   squadre. Qui imposti anche il budget, il regolamento bonus/malus e la formazione tipo.
3. **Asta** — durante l'asta: crediti residui, quanto ti serve per ruolo, chi conviene
   prendere adesso.
4. **Listone** — tutti i giocatori con prezzi, filtri e ricerca. Da qui (o dalla rosa di
   una squadra) assegni un giocatore e i crediti pagati.

Ogni acquisto registrato aggiorna i crediti residui di tutte le squadre e ricalcola i
prezzi consigliati.

> I nomi sono quelli del listone, quindi **cognomi**: Lautaro si cerca come
> `Martinez L.`, Vanja Milinkovic-Savic come `Milinkovic-Savic V.`.

## I due prezzi

Per ogni giocatore l'app mostra due numeri diversi, e la differenza fra i due è
l'informazione che serve davvero all'asta.

| | cosa dice |
|---|---|
| **Mercato** | quanto costerà: l'FVM del listone riscalato sul budget della tua lega |
| **Vale** | quanto rende secondo il modello |
| **Affare** | `Vale − Mercato`. Verde = il mercato lo sottovaluta, rosso = lo paga troppo |

Sui grandi attaccanti i due numeri quasi coincidono — il mercato li prezza bene. Le
differenze si aprono sui difensori e i centrocampisti che producono bonus: lì il
modello dice spesso che c'è margine.

## Come si calcola quanto vale un giocatore

### 1. Dal listone alla proiezione

Il listone dà solo FVM e quotazione, nessuna statistica. Ma l'FVM è il prezzo di
equilibrio del mercato, quindi è un buon indicatore sintetico del rendimento. Da lì,
per ruolo, ricaviamo presenze attese, gol e assist di stagione, voto base, cartellini e
(per i portieri) gol subiti.

Le curve sono leggi di potenza calibrate su due punti di ancoraggio per ruolo — un top
player e uno di fascia media — con rendimenti tipici di Serie A. Oltre l'ancoraggio alto
la curva viene compressa verso un asintoto: senza, un fuoriclasse fuori scala come
Dimarco (FVM 265 fra difensori che si fermano a 84) risulterebbe da 20 gol.

Tutti i parametri stanno in `DEFAULT_PROJECTION` (`src/model/projection.ts`).

### 2. Gol e assist come variabili aleatorie

Il rendimento ha due fonti di incertezza: **quante partite gioca** e **quanto produce
quando gioca**.

La seconda è un processo di Poisson — i gol sono eventi rari e quasi indipendenti,
quindi i gol in N partite con tasso λ sono `Poisson(Nλ)`. È questo che rende 15 gol
molto più probabile di 25 anche quando la media è 18.

La prima la trattiamo mescolando: la frazione di stagione giocata `A` è una Beta con
media pari alle presenze attese su 38.

```
G | A ~ Poisson(38 · A · λ),    A ~ Beta(a, b)
```

Marginalizzando su `A` si ottiene una miscela di Poisson, cioè una distribuzione
**sovradispersa** (varianza > media): è ciò che si osserva davvero, perché la Poisson
pura sottostima quanto spesso un giocatore sparisce per infortunio o esplode.

I bonus totali sono poi la convoluzione esatta delle componenti (gol × 3, assist × 1,
meno i malus) su una griglia discreta a passo 0,5 — il passo serve alle ammonizioni.

La scheda di ogni giocatore mostra la distribuzione completa: la probabilità di **ogni**
numero di gol, il valore singolo più probabile (la moda, che sta sotto la media perché
la distribuzione è asimmetrica) e i percentili 10/50/90 dei bonus. Quell'intervallo, non
la media, è il rischio che ti prendi pagandolo.

### 3. Dal rendimento al prezzo

Il valore di un giocatore non è il suo rendimento assoluto, ma **il rendimento in più
rispetto a chi puoi avere gratis**. Se prendi il 5° portiere della lega, il tuo guadagno
non è la sua fantamedia: è la differenza fra lui e il primo portiere che resterebbe
svincolato. Questo è il *valore sul rimpiazzo* (VOR), ed è il modo corretto di
confrontare ruoli diversi.

Il rimpiazzo si misura sui **titolari**, non sulla profondità della rosa: il terzo
portiere occupa uno slot e non gioca mai, quindi non è lui il metro di paragone.

Poi si converte il VOR in crediti. In un'asta i crediti sono a somma zero: la lega
spende esattamente `squadre × budget`, e ogni slot di rosa costa almeno 1 credito.
Quindi

```
surplus = squadre × budget − slot totali
prezzo  = 1 + VOR · (surplus / Σ VOR)
```

cioè la quota di surplus che spetta a quel giocatore.

### 4. L'asta si muove, i prezzi anche

Il calcolo si aggiorna a ogni acquisto registrato. Se la lega ha già bruciato i crediti
sui big, quello che resta si sgonfia e conviene aspettare; se stanno tutti risparmiando,
i prezzi si gonfiano. È il fattore di **inflazione**, ricalcolato sui crediti e sui
giocatori ancora disponibili, visibile nella scheda **Asta**.

Sopra il prezzo di equilibrio c'è comunque un tetto: non puoi spendere tanto da non
poterti permettere almeno 1 credito per ogni slot che ti resta. Il consiglio operativo è
sempre il minimo fra i due.

### Due manopole

In **Impostazioni**:

- **Avversione al rischio** — a 0 conta solo la media. Alzandola, a parità di media
  preferisci il giocatore con esito più prevedibile e paghi meno le scommesse.
- **Incertezza sulle presenze** — quanto sei sicuro che giocherà. Valori bassi allargano
  le distribuzioni.

Anche il regolamento conta: con l'assist a 1 punto un rifinitore vale meno che con
l'assist a 3, e i prezzi si aggiornano di conseguenza.

## Struttura

```
src/
  data/players.ts        listone estratto dal PDF (496 giocatori)
  model/
    types.ts             ruoli, impostazioni lega, regolamento
    projection.ts        FVM → presenze, gol, assist, voto
    distribution.ts      Poisson, miscela Beta-Poisson, convoluzioni
    fantapunti.ts        proiezione + regolamento → fantamedia e distribuzioni
    valuation.ts         VOR, prezzi di equilibrio, inflazione, consigli
    model.test.ts        37 test sul modello
  components/            interfaccia
  store.ts               stato dell'asta + localStorage
```

Per aggiornare il listone a una nuova stagione basta sostituire l'array in
`src/data/players.ts`.
