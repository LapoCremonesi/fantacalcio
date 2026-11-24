import type { League, MatchResult } from '../types'

/*
 * ────────────────────────────────────────────────────────────────────────────
 *  DATI SEGNAPOSTO
 *  Squadre, risultati e articoli qui sotto sono inventati, servono solo a
 *  far vedere la UI. Vanno sostituiti con i dati veri della lega.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** Scorciatoia per scrivere i risultati: [casa, trasferta, fantapunti casa, fantapunti trasferta] */
type Row = [string, string, number, number]
const r = (rows: Row[]): MatchResult[] =>
  rows.map(([home, away, homePoints, awayPoints]) => ({ home, away, homePoints, awayPoints }))

export const league: League = {
  name: 'Lega dei Cugini',
  newspaper: "L'Eco del Fantacalcio",
  tagline: 'Quotidiano indipendente di fantapolitica sportiva · Fondato al bar',
  season: '2026/27',
  pointsFor: { win: 3, draw: 1, loss: 0 },
  goals: { threshold: 66, step: 6 },

  teams: [
    { id: 'rma', name: 'Real Mandrogna', short: 'RMA', manager: 'Marco', colors: ['#f4f1e8', '#6d28d9'], motto: 'Vincere è l’unica cosa che conta (anche a briscola)' },
    { id: 'int', name: 'Inter Nos', short: 'INT', manager: 'Giulia', colors: ['#1e3a8a', '#111827'], motto: 'Detto tra noi, lo scudetto è nostro' },
    { id: 'psg', name: 'Paris Saint-Gennaro', short: 'PSG', manager: 'Ciro', colors: ['#1d4ed8', '#dc2626'], motto: 'Ricchi, belli e un po’ scaramantici' },
    { id: 'bor', name: 'Borussia Birrmund', short: 'BOR', manager: 'Luca', colors: ['#facc15', '#111827'], motto: 'Una media chiara e via' },
    { id: 'atl', name: 'Atletico Ma Non Troppo', short: 'ATL', manager: 'Sara', colors: ['#dc2626', '#f4f1e8'], motto: 'Corriamo, ma con calma' },
    { id: 'din', name: 'Dinamo Spritz', short: 'DIN', manager: 'Andrea', colors: ['#f97316', '#0f766e'], motto: 'Si gioca alle 18, l’aperitivo alle 18:05' },
    { id: 'spo', name: 'Sporting Divano', short: 'SPO', manager: 'Fede', colors: ['#16a34a', '#f4f1e8'], motto: 'La formazione si mette sdraiati' },
    { id: 'vod', name: 'Vodka Juniors', short: 'VOD', manager: 'Paolo', colors: ['#0ea5e9', '#f4f1e8'], motto: 'Ghiacciati in campo, caldi al fantamercato' },
  ],

  matchdays: [
    { number: 1, date: '2026-08-23', results: r([['rma', 'vod', 77, 64], ['atl', 'psg', 68, 71.5], ['spo', 'din', 69.5, 65.5], ['int', 'bor', 72, 71]]) },
    { number: 2, date: '2026-08-30', results: r([['psg', 'rma', 64.5, 73.5], ['din', 'vod', 66, 70], ['bor', 'atl', 65.5, 64.5], ['int', 'spo', 72.5, 64.5]]) },
    { number: 3, date: '2026-09-13', results: r([['rma', 'din', 74, 66], ['psg', 'bor', 76, 66], ['vod', 'int', 64.5, 75.5], ['atl', 'spo', 63.5, 67.5]]) },
    { number: 4, date: '2026-09-20', results: r([['bor', 'rma', 70.5, 70.5], ['int', 'din', 66.5, 61.5], ['spo', 'psg', 66, 72], ['atl', 'vod', 70, 67.5]]) },
    { number: 5, date: '2026-09-27', results: r([['rma', 'int', 73, 72], ['bor', 'spo', 67.5, 58.5], ['din', 'atl', 64, 69], ['psg', 'vod', 65.5, 67]]) },
    { number: 6, date: '2026-10-04', results: r([['spo', 'rma', 63.5, 72], ['atl', 'int', 72, 67], ['vod', 'bor', 64, 68], ['psg', 'din', 74.5, 69.5]]) },
    { number: 7, date: '2026-10-18', results: r([['rma', 'atl', 74, 66], ['spo', 'vod', 69.5, 67.5], ['int', 'psg', 74.5, 68.5], ['bor', 'din', 68.5, 64.5]]) },
    { number: 8, date: '2026-10-25', results: r([['vod', 'rma', 66, 71], ['psg', 'atl', 73, 68], ['din', 'spo', 69, 65.5], ['bor', 'int', 68.5, 73]]) },
    { number: 9, date: '2026-10-29', results: r([['rma', 'psg', 76.5, 65], ['vod', 'din', 71.5, 72], ['atl', 'bor', 66.5, 71.5], ['spo', 'int', 71, 72]]) },
    { number: 10, date: '2026-11-01', results: r([['din', 'rma', 67, 74.5], ['bor', 'psg', 74, 68], ['int', 'vod', 75, 65], ['spo', 'atl', 61.5, 61.5]]) },
    {
      number: 11,
      date: '2026-11-08',
      results: r([['rma', 'bor', 77, 74], ['din', 'int', 73.5, 69], ['psg', 'spo', 69, 65], ['vod', 'atl', 71.5, 73]]),
      ticker: [
        'La Dinamo Spritz batte la capolista Inter Nos: festeggiamenti fino alle 3, il vicinato presenta esposto',
        'Real Mandrogna fermato sul 2-2 dal Borussia Birrmund, ma torna in vetta grazie ai fantapunti',
        'Vodka Juniors ultimo da solo. Il presidente Paolo: «È un progetto a lungo termine»',
      ],
      articles: [
        {
          id: 'g11-apertura',
          kind: 'apertura',
          kicker: 'Lo sgambetto',
          title: 'Lo Spritz è servito: la Dinamo stende l’Inter Nos',
          subtitle: 'Andrea vince 2-1 contro la capolista. Il Real Mandrogna pareggia, aggancia Giulia a quota 25 e la scavalca per fantapunti.',
          author: 'La Redazione',
          teams: ['din', 'int'],
          body: [
            'Nessuno ci credeva, tranne Andrea, che già venerdì aveva prenotato il tavolo al bar «per sicurezza». La Dinamo Spritz chiude a 73,5 e manda al tappeto un’Inter Nos sorprendentemente spenta, ferma a 69.',
            'La capolista frena così proprio nel momento più delicato. Il Real Mandrogna ne approfitta solo a metà: il Borussia Birrmund gli strappa un 2-2 rocambolesco, 77 a 74, i due punteggi più alti della giornata.',
            'Risultato: Real Mandrogna e Inter Nos appaiati a quota 25, con Marco davanti per fantapunti. E alla prossima c’è lo scontro diretto.',
          ],
          quote: { text: 'Avevo detto che l’aperitivo lo offrivo io. Non avevo detto a chi.', by: 'Andrea, presidente Dinamo Spritz' },
        },
        {
          id: 'g11-breve-1',
          kind: 'breve',
          title: 'Vodka Juniors, la panchina scricchiola',
          author: 'Red. Sport',
          teams: ['vod'],
          body: ['Sesta sconfitta stagionale per Paolo, che però giura fiducia a sé stesso: «Non mi esonero, non mi conviene».'],
        },
      ],
    },
    {
      number: 12,
      date: '2026-11-22',
      results: r([['int', 'rma', 74, 78], ['spo', 'bor', 69.5, 67], ['atl', 'din', 70.5, 65.5], ['vod', 'psg', 70.5, 71.5]]),
      ticker: [
        'ULTIM’ORA · Il Real Mandrogna espugna il campo dell’Inter Nos: 3-2 e fuga a +3',
        'Tre squadre a quota 17 per il terzo posto: Paris Saint-Gennaro, Borussia e Atletico',
        'Vodka Juniors, mezzo punto di troppo: perde 1-1… no, pareggia. La redazione chiede scusa',
        'Sporting Divano, pareggio casalingo: Fede festeggia senza alzarsi',
        'Fantamercato di riparazione: si apre il 2 gennaio, Ciro ha già venduto la macchina',
      ],
      top: { player: 'Ezequiel Tarantini', team: 'rma', score: 14.5, note: 'Doppietta, assist e un rigore procurato. Marco lo aveva pagato 3 crediti all’asta.' },
      flop: { player: 'Mattia Freddezza', team: 'int', score: 3.5, note: 'Autogol, rosso e un’espressione che ha fatto il giro della chat.' },
      quote: { text: 'Quello non era un fallo, era un’opinione.', by: 'Giulia, in chat, alle 23:47' },
      grades: [
        { team: 'rma', grade: 9, comment: 'Vince lo scontro diretto con il miglior punteggio di giornata. Panchina gestita da cinico.' },
        { team: 'atl', grade: 7.5, comment: 'Sara non sbaglia una mossa, il terzo posto è a portata di mano.' },
        { team: 'spo', grade: 7, comment: 'Fede si alza dal divano e ferma il Borussia. Storico.' },
        { team: 'psg', grade: 6.5, comment: 'Pareggia 1-1 ma vince di mezzo punto la sfida dei fantapunti. Ciro dirà che è merito del corno rosso.' },
        { team: 'vod', grade: 6, comment: 'Prestazione dignitosa, punto in più in classifica. Piccoli passi.' },
        { team: 'int', grade: 5.5, comment: 'Gioca bene e perde. Fa 74, ma il problema è Freddezza.' },
        { team: 'bor', grade: 5, comment: 'Pareggio contro l’ultima della classe. La birra era calda?' },
        { team: 'din', grade: 4.5, comment: 'Dopo la festa della settimana scorsa, l’hangover. 65,5 e zero gol.' },
      ],
      articles: [
        {
          id: 'g12-apertura',
          kind: 'apertura',
          kicker: 'Lo scontro diretto',
          title: 'Mandrogna, colpo da capolista: Inter Nos ko e fuga a +3',
          subtitle: 'Al vertice finisce 3-2 per Marco: 78 fantapunti, il miglior punteggio di giornata. Giulia recrimina, la chat esplode.',
          author: 'Il Direttore',
          teams: ['rma', 'int'],
          body: [
            'Doveva essere la partita dell’anno e lo è stata. L’Inter Nos parte forte, chiude con un rispettabilissimo 74, ma dall’altra parte c’è un Real Mandrogna che sembra costruito in laboratorio: 78 fantapunti, tre gol, e la sensazione che Marco sapesse già tutto da giovedì.',
            'Il protagonista è Ezequiel Tarantini, pagato tre crediti all’asta tra le risate generali. Doppietta, assist, rigore procurato: 14,5 di fantavoto. Le risate, si dice, ora le fa uno solo.',
            'Dall’altra parte pesa come un macigno la giornata horror di Mattia Freddezza: autogol, espulsione e un 3,5 che costa a Giulia almeno un gol. Senza quel disastro sarebbe stato pari. Ma il fantacalcio, come la vita, non conosce il condizionale.',
            'In classifica il Real Mandrogna sale a 28, Inter Nos resta a 25. Dietro, il vuoto: la terza è a 17. Il campionato rischia di diventare una corsa a due, e qualcuno al bar parla già di «fuga per la vittoria».',
          ],
          quote: { text: 'Tarantini l’ho preso perché aveva un bel nome. Il calcio è anche estetica.', by: 'Marco, presidente Real Mandrogna' },
        },
        {
          id: 'g12-editoriale',
          kind: 'editoriale',
          kicker: 'Il punto',
          title: 'Fermate quel Mandrogna (se ci riuscite)',
          author: 'Il Direttore',
          body: [
            'Dodici giornate, otto vittorie, quattro pareggi, zero sconfitte. Il Real Mandrogna è la squadra da battere e lo sa. Il problema è che lo sanno anche tutti gli altri, e nessuno sembra avere un piano.',
            'La verità è che il campionato si decide adesso, a gennaio, al mercato di riparazione. Chi avrà il coraggio di svenarsi per un attaccante vero? Ciro ha già detto di sì. Ciro dice sempre di sì.',
          ],
        },
        {
          id: 'g12-cronaca-atl',
          kind: 'cronaca',
          kicker: 'Terzo posto',
          title: 'Sara non sbaglia più: l’Atletico ingrana e aggancia il treno',
          subtitle: 'Vittoria 1-0 sulla Dinamo Spritz, ora è a pari punti con PSG e Borussia.',
          author: 'Red. Sport',
          teams: ['atl', 'din'],
          body: [
            'Il nome dice «ma non troppo», ma l’Atletico di Sara sta correndo eccome. Settanta e mezzo, un gol, porta inviolata: la Dinamo Spritz si ferma a 65,5, mezzo punto sotto la soglia.',
            'Con questa vittoria l’Atletico entra nella zona calda: terzo posto a pari merito, a quota 17. «Non guardo la classifica», dice Sara. Ha lo screenshot come sfondo del telefono.',
          ],
        },
        {
          id: 'g12-cronaca-spo',
          kind: 'cronaca',
          kicker: 'Sorpresa',
          title: 'Lo Sporting si alza dal divano e ferma il Borussia',
          author: 'Red. Sport',
          teams: ['spo', 'bor'],
          body: [
            'Uno a uno, 69,5 contro 67: lo Sporting Divano strappa un punto al Borussia Birrmund e soprattutto supera il Borussia nei fantapunti di giornata. Fede ha schierato la formazione all’ultimo secondo «per non dare vantaggi agli avversari». Il server ha confermato: 14:59:58.',
          ],
        },
        {
          id: 'g12-cronaca-vod',
          kind: 'cronaca',
          kicker: 'Mezzo punto',
          title: 'Vodka-PSG, l’1-1 più sofferto della storia',
          author: 'Red. Sport',
          teams: ['vod', 'psg'],
          body: [
            '70,5 contro 71,5. Un gol a testa, ma per un attimo Paolo ci ha creduto: il bonus del portiere è arrivato con quattro ore di ritardo. Ciro, scaramantico, ha passato il lunedì a toccare ferro. Basta un punto per restare sul podio.',
          ],
        },
        {
          id: 'g12-gossip',
          kind: 'gossip',
          kicker: 'Dalla chat',
          title: 'Giulia contro il VAR, il VAR contro Giulia',
          subtitle: 'Quarantatré messaggi vocali tra domenica sera e lunedì mattina. Li abbiamo ascoltati tutti (non era necessario).',
          author: 'La Talpa',
          teams: ['int'],
          body: [
            'Fonti vicine alla presidenza dell’Inter Nos parlano di un ricorso già scritto, firmato e mai inviato. Destinatario: «chi di dovere».',
            'Nel frattempo Marco ha cambiato l’immagine del gruppo con una foto della classifica. Nessuno ha avuto il coraggio di toglierla.',
          ],
        },
        {
          id: 'g12-mercato',
          kind: 'mercato',
          kicker: 'Voci di mercato',
          title: 'Ciro vuole un top player: «Ho già venduto la macchina»',
          author: 'Red. Mercato',
          teams: ['psg'],
          body: [
            'A gennaio si riapre il mercato di riparazione e il Paris Saint-Gennaro promette fuochi d’artificio. Il budget ufficiale è di 12 crediti, quello ufficioso è «tutto quello che serve».',
            'Occhio anche al Vodka Juniors: Paolo ha chiesto informazioni su tre portieri. Tre.',
          ],
        },
        {
          id: 'g12-breve-1',
          kind: 'breve',
          title: 'Dinamo, l’aperitivo non basta più',
          author: 'Red.',
          teams: ['din'],
          body: ['Seconda sconfitta in tre giornate per Andrea, che dopo la festa per il successo sull’Inter Nos è sceso al sesto posto.'],
        },
        {
          id: 'g12-breve-2',
          kind: 'breve',
          title: 'Giornata ricca: 566,5 fantapunti totali',
          author: 'Red.',
          body: ['Secondo miglior bottino stagionale dopo la giornata precedente: media di 70,8 a squadra e dieci gol complessivi. Merito degli attaccanti, che per una volta si sono ricordati di esserlo.'],
        },
      ],
    },
    // Giornata 13: calendario già noto, risultati ancora da giocare
    { number: 13, date: '2026-11-29', results: [] },
  ],
}

/** Accoppiamenti del prossimo turno (se noti). */
export const nextFixtures: Record<number, [string, string][]> = {
  13: [
    ['rma', 'spo'],
    ['bor', 'vod'],
    ['din', 'psg'],
    ['int', 'atl'],
  ],
}
