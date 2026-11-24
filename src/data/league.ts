import type { League, MatchResult } from '../types'

/** Scorciatoia per scrivere i risultati: [casa, trasferta, fantapunti casa, fantapunti trasferta] */
type Row = [string, string, number, number]
const r = (rows: Row[]): MatchResult[] =>
  rows.map(([home, away, homePoints, awayPoints]) => ({ home, away, homePoints, awayPoints }))

export const league: League = {
  newspaper: "L'Eco del Fantacalcio",
  tagline: 'Quotidiano indipendente di fantapolitica sportiva · Fondato al bar',
  season: '2026/27',
  pointsFor: { win: 3, draw: 1, loss: 0 },
  // In questa lega: 1 gol a 66 punti, poi +1 gol ogni 4 punti (70 = 2, 74 = 3, 82 = 5…)
  goals: { threshold: 66, step: 4 },

  // Colori presi dalle maglie negli screenshot
  teams: [
    { id: 'den', name: 'AC denti alla madonna', short: 'DEN', colors: ['#161616', '#c8102e'] },
    { id: 'sbu', name: 'As Sburrao', short: 'SBU', colors: ['#272152', '#8f7ad6'] },
    { id: 'fag', name: 'fagioli united', short: 'FAG', colors: ['#6b2fa0', '#e8388a'] },
    { id: 'tur', name: 'F C Turbo Bamba', short: 'TUR', colors: ['#f2c230', '#1a1a1a'] },
    { id: 'mun', name: 'FC MUNDO', short: 'MUN', colors: ['#4b2382', '#2e9e5b'] },
    { id: 'foc', name: 'Fo-Caccia', short: 'FOC', colors: ['#f4a9c0', '#2b3a8c'] },
  ],

  matchdays: [
    {
      number: 1,
      results: [
        { home: 'den', away: 'foc', homePoints: 83, awayPoints: 0, note: 'Fo-Caccia non schierata' },
        ...r([
          ['tur', 'fag', 70, 72],
          ['sbu', 'mun', 74.5, 72],
        ]),
      ],
      ticker: [
        'Fo-Caccia non schiera la formazione: 0 fantapunti e 5-0 per i Denti',
        'Krstovic da 16: doppietta e assist, l’AC denti alla madonna vola in vetta',
        'Malen capitano dei Denti: 4,5 in pagella e cartellino rosso',
        'De Bruyne da 14,5 (gol e rigore) non basta: fagioli united fermata sul 2-2',
        'As Sburrao di misura sul FC MUNDO: decidono Thuram e il difensore Tavares',
        'Panchine d’oro: Sucic (11) e Maldini (10) restano a guardare',
      ],
      top: {
        player: 'Krstovic',
        team: 'den',
        score: 16,
        note: 'Doppietta, assist e un altro bonus per gradire. Il primo fantavoto di stagione da incorniciare.',
      },
      flop: {
        player: 'Malen',
        team: 'den',
        score: 3.5,
        note: 'Capitano, 4,5 in pagella ed espulso. Per sua fortuna dall’altra parte non c’era nessuno.',
      },
      quote: { text: 'Abbiamo vinto 5-0 contro nessuno. È il calcio moderno.', by: 'Un tifoso dei Denti, al bancone' },
      grades: [
        { team: 'den', grade: 8.5, comment: '83 punti e primo posto. Unico neo: la fascia data a Malen.' },
        { team: 'sbu', grade: 7, comment: 'Vittoria di misura con Thuram e Tavares. Maldini da 10 lasciato in panchina, ma va bene lo stesso.' },
        { team: 'fag', grade: 6.5, comment: 'Si regge tutta su De Bruyne. Sucic da 11 a scaldare la panchina pesa.' },
        { team: 'tur', grade: 6, comment: 'Rabiot e poco altro, ma il punto arriva. Capitano Davis da 6 politico.' },
        { team: 'mun', grade: 5.5, comment: 'Fa 72 come i fagioli, solo che loro pareggiano e il MUNDO perde. Sfortuna.' },
        { team: 'foc', grade: 1, comment: 'Non pervenuta. L’1 è per la maglia rosa, che è carina.' },
      ],
      articles: [
        {
          id: 'g1-apertura',
          kind: 'apertura',
          kicker: 'Il caso',
          title: 'Fo-Caccia resta nel forno, i Denti mordono: 5-0',
          subtitle:
            'Prima giornata e già il primo scandalo: il Fo-Caccia non schiera la formazione e chiude a zero. L’AC denti alla madonna ne fa 83 e prende la vetta. Krstovic show da 16.',
          author: 'Il Direttore',
          teams: ['den', 'foc'],
          body: [
            'C’è chi la prima giornata la prepara per settimane e chi si dimentica di aprire l’app. Il Fo-Caccia appartiene alla seconda categoria: formazione non schierata, zero fantapunti, zero alibi. Dall’altra parte l’AC denti alla madonna non si fa pregare e ne mette 83, il punteggio più alto della giornata, per un 5-0 che sa di allenamento a porte chiuse.',
            'Il mattatore è Krstovic: doppietta, assist e un ulteriore bonus, voto 8 e fantavoto 16. In mezzo al campo Calhanoglu trasforma un rigore (10 di fantavoto), Alajbegovic aggiunge un assist e dalla panchina entra Ekkelenkamp, al posto dell’assente Barella, e segna pure: 10 anche per lui.',
            'Butez chiude con la porta inviolata e il bonus annesso. Che, va detto, contro una squadra che non si è presentata non era l’impresa del secolo.',
            'L’unica macchia è la fascia di capitano: affidata a Malen, che rimedia 4,5 in pagella e un cartellino rosso per un desolante 3,5. Con un capitano così, è andata bene che l’avversario fosse immaginario.',
          ],
          quote: { text: 'Era lievitazione naturale. Ci vogliono ventiquattro ore.', by: 'Fonti vicine al Fo-Caccia' },
        },
        {
          id: 'g1-editoriale',
          kind: 'editoriale',
          kicker: 'Il punto',
          title: 'Si parte. Più o meno tutti',
          author: 'Il Direttore',
          body: [
            'Benvenuti al primo numero dell’Eco. Ogni lunedì racconteremo la giornata con la serietà che merita, cioè poca.',
            'La prima lezione della stagione è semplice: la formazione va schierata. Sembra banale, ma qualcuno ha deciso di ricordarcelo nel modo più didattico possibile. Per il resto, cinque squadre su sei si sono presentate: è un inizio incoraggiante.',
          ],
        },
        {
          id: 'g1-sbu-mun',
          kind: 'cronaca',
          kicker: 'Di misura',
          title: 'Sburrao, basta un difensore: il MUNDO cade 3-2',
          subtitle: 'Gol di Thuram e di Tavares, 74,5 a 72. Al MUNDO non basta Orsolini.',
          author: 'Red. Sport',
          teams: ['sbu', 'mun'],
          body: [
            'Partita vera tra As Sburrao e FC MUNDO, decisa da due gol: quello di Thuram, che si prende un 10, e quello che nessuno si aspettava, del difensore Tavares (10 anche lui). Meret porta a casa il bonus della porta inviolata, Hojlund si accontenta di un 6,5.',
            'Il MUNDO risponde con Orsolini, in gol e a 10,5, e con un solido Esposito F.P. da 7, ma Maignan ne subisce uno e scende a 5,5. Il capitano Martinez L. si ferma a un 6 senza bonus, il vice Ramos G. si fa ammonire: 5,5.',
            'Curiosità di giornata: in panchina lo Sburrao aveva Maldini, autore di un gol e da 10 di fantavoto. È rimasto lì. Sarà per la prossima.',
          ],
        },
        {
          id: 'g1-tur-fag',
          kind: 'cronaca',
          kicker: 'Pareggio',
          title: 'De Bruyne fa 14,5 ma non basta: Turbo Bamba-fagioli 2-2',
          subtitle: 'Il belga segna anche su rigore, Rabiot risponde. Finisce 70 a 72, un gol a testa di fantacalcio.',
          author: 'Red. Sport',
          teams: ['tur', 'fag'],
          body: [
            'Per la fagioli united la giornata ha un nome solo: De Bruyne. Gol, rigore trasformato e un ulteriore bonus, 14,5 di fantavoto. Il resto della squadra viaggia sul 6, con il capitano Berardi ammonito e fermo a 5. Akanji e il vicecapitano Scamacca non giocano: dentro De Winter (ammonito anche lui) e De Ketelaere.',
            'Il F C Turbo Bamba risponde con Rabiot, in gol per un 10, e con una squadra ordinata fatta di tanti 6. Provedel non scende in campo e dalla panchina entra Martinez Jo., che prende il bonus della porta inviolata.',
            'Il dettaglio che farà discutere: in fondo alla panchina della fagioli united c’era Sucic, gol e 11 di fantavoto. Non è mai entrato.',
          ],
        },
        {
          id: 'g1-gossip',
          kind: 'gossip',
          kicker: 'Il mistero',
          title: 'Dov’era la formazione del Fo-Caccia?',
          subtitle: 'Le ipotesi della redazione, in ordine di plausibilità.',
          author: 'La Talpa',
          teams: ['foc'],
          body: [
            'Ipotesi numero uno: il Wi-Fi. Ipotesi numero due: la formazione era pronta, ma è rimasta in bozza. Ipotesi numero tre: strategia psicologica, far credere agli avversari di essere innocui. Se così fosse, ha funzionato fin troppo bene.',
            'Dalla sede del Fo-Caccia per ora nessun commento. Solo un vago profumo di rosmarino.',
          ],
        },
        {
          id: 'g1-capitani',
          kind: 'breve',
          title: 'Capitani, che delusione',
          author: 'Red.',
          body: [
            'Nessun capitano sopra il 6: Davis K., Frattesi e Martinez L. a 6, Berardi a 5, Malen a 3,5 con espulsione. La fascia, per ora, pesa più del previsto.',
          ],
        },
        {
          id: 'g1-panchine',
          kind: 'breve',
          title: 'Panchine d’oro',
          author: 'Red.',
          body: [
            'Sucic (11) e Maldini (10) hanno segnato restando in panchina. Ai Denti è invece andata bene: Palmisani, il portiere di riserva, ne ha presi tre ed è rimasto seduto.',
          ],
        },
      ],
    },
    {
      number: 2,
      results: r([
        ['foc', 'tur', 62, 77],
        ['fag', 'sbu', 77, 87.5],
        ['mun', 'den', 80.5, 67.5],
      ]),
      ticker: [
        'Raimondo tripletta da 18,5: l’As Sburrao travolge i fagioli 6-3 ed è primo da solo',
        'Il Fo-Caccia si presenta! Ma in dieci, e perde 0-3 col Turbo Bamba',
        'Caprile ne prende quattro (1,5), Mandas in panchina tiene la porta inviolata',
        'De Bruyne sbaglia un rigore: dal 14,5 della prima giornata al 2',
        'Varela da 16,5, il FC MUNDO batte 4-1 l’AC denti alla madonna',
        'Maldini: da 10 in panchina a 5 con la fascia da capitano',
      ],
      top: {
        player: 'Raimondo',
        team: 'sbu',
        score: 18.5,
        note: 'Tripletta e un bonus in più: voto 8,5, fantavoto 18,5. Il vicecapitano che fa il lavoro del capitano.',
      },
      flop: {
        player: 'Caprile',
        team: 'foc',
        score: 1.5,
        note: 'Quattro gol subiti. In panchina intanto Mandas teneva la porta inviolata.',
      },
      quote: { text: 'Abbiamo fatto 77 e ne abbiamo presi sei. Il fantacalcio è un gioco crudele.', by: 'Fonti vicine ai fagioli' },
      grades: [
        { team: 'sbu', grade: 9, comment: '87,5, miglior punteggio di giornata e primo posto da solo. Il capitano Maldini fa 5, ma nessuno se ne accorge.' },
        { team: 'mun', grade: 8, comment: '80,5 e prima vittoria, con Varela e Calò. Gila da 10 rimasto in panchina.' },
        { team: 'tur', grade: 7.5, comment: 'Attacco da applausi (Simeone, Rabiot, Douvikas), difesa da incubo (Mina 4). Secondo posto.' },
        { team: 'fag', grade: 5.5, comment: 'Fa 77 e perde 3-6: sfortuna. Ma quel rigore sbagliato da De Bruyne pesa.' },
        { team: 'den', grade: 5, comment: 'Senza Calhanoglu e Malen il morso è debole: 67,5 e giù al quarto posto.' },
        { team: 'foc', grade: 5, comment: 'Si presenta, ed è già un progresso. Peccato in dieci e con il portiere sbagliato.' },
      ],
      articles: [
        {
          id: 'g2-apertura',
          kind: 'apertura',
          kicker: 'Fuga in vetta',
          title: 'Raimondo show, lo Sburrao ne fa sei ai fagioli',
          subtitle:
            'Tripletta da 18,5 del vicecapitano: As Sburrao a 87,5, miglior punteggio di giornata, e primo posto da solo. La fagioli united fa 77 e perde lo stesso.',
          author: 'Il Direttore',
          teams: ['sbu', 'fag'],
          body: [
            'Sei gol, il punteggio più alto della giornata e il primo posto in solitaria: l’As Sburrao fa sul serio. L’uomo copertina è Raimondo, che segna tre volte e aggiunge un altro bonus per un fantavoto di 18,5. Alle sue spalle Paz N. (gol, assist e un altro bonus, 12) e Thuram, ammonito ma in gol (9,5).',
            'Sulla carta il capitano era Maldini, appena uscito da una prima giornata da 10 in panchina. Promosso titolare con la fascia, ha risposto con un 5 senza bonus. Il fantacalcio ha il senso dell’umorismo.',
            'Dall’altra parte la fagioli united avrebbe battuto chiunque altro: 77 fantapunti, con i gol di Berardi (stavolta capitano da 10), Castro S. e Carlos Augusto, che chiude a 12. Ma Okoye ne prende tre e scende a 3,5, e De Bruyne sbaglia un rigore: dal 14,5 della settimana scorsa a un 2 che fa male.',
            'Per la cronaca, in panchina dei fagioli c’era Bonny, in gol e da 10. La settimana scorsa era toccato a Sucic. Una tradizione sta nascendo.',
          ],
          quote: { text: 'Raimondo l’abbiamo scelto per il nome. Sembrava un tipo affidabile.', by: 'Un tifoso dello Sburrao' },
        },
        {
          id: 'g2-editoriale',
          kind: 'editoriale',
          kicker: 'Il punto',
          title: 'La panchina è il reparto migliore della lega',
          author: 'Il Direttore',
          body: [
            'Due giornate, e un dato è già chiaro: in questa lega i gol si fanno da seduti. Sucic e Maldini la prima settimana, Bonny e Gila la seconda, tutti in gol e tutti rimasti a guardare. Mandas ha addirittura tenuto la porta inviolata mentre il titolare ne prendeva quattro.',
            'Proponiamo una riforma: schierare la panchina e lasciare in tribuna i titolari. Lo Sburrao ci ha provato con Maldini, e non ha funzionato. Forse ci vuole metodo.',
          ],
        },
        {
          id: 'g2-mun-den',
          kind: 'cronaca',
          kicker: 'Prima vittoria',
          title: 'Varela trascina il MUNDO: Denti battuti 4-1',
          subtitle: 'Doppietta e assist per il vicecapitano, 16,5. Calò aggiunge gol e assist. I Denti, senza Calhanoglu e Malen, scivolano al quarto posto.',
          author: 'Red. Sport',
          teams: ['mun', 'den'],
          body: [
            'Il FC MUNDO si scrolla di dosso la beffa della prima giornata con 80,5 fantapunti. Varela G. segna due volte, serve un assist e prende un altro bonus: 16,5. Calò fa gol e assist (11,5), Moreira ne serve uno (8).',
            'Curiosa la giornata di Ramos G.: sbaglia un rigore, poi ne segna un altro. Saldo zero, voto 6,5, e una lezione di equilibrio. Il capitano Esposito F.P. invece si fa ammonire e chiude a 5. In panchina, come da tradizione della lega, Gila segna e prende 10 senza giocare.',
            'L’AC denti alla madonna, senza Calhanoglu e senza Malen dopo il rosso della prima giornata, consegna la fascia a Lobotka (6) e si aggrappa al gol di Krstovic (9,5) e all’assist di Barella. Troppo poco: 67,5 e un gol solo.',
          ],
        },
        {
          id: 'g2-foc-tur',
          kind: 'cronaca',
          kicker: 'Il ritorno',
          title: 'Il Fo-Caccia si presenta, ma in dieci: Turbo Bamba 3-0',
          subtitle: 'Simeone doppietta da 15, Rabiot 12. E Caprile ne prende quattro mentre Mandas, in panchina, non ne prende nessuno.',
          author: 'Red. Sport',
          teams: ['foc', 'tur'],
          body: [
            'La notizia è che il Fo-Caccia ha schierato la formazione. La cattiva notizia è che Chalobah non prende voto, Molina non gioca e dalla panchina entra solo Balerdi: si gioca in dieci, e finisce 62 a 77.',
            'Il dramma è tra i pali: Caprile subisce quattro gol e chiude a 1,5, mentre Mandas, rimasto in panchina, porta a casa la porta inviolata e un 7. Davanti si salvano Adams C. (gol, 10) e gli assist di Zielinski e Valle. Il capitano Modric fa 6,5.',
            'Il F C Turbo Bamba vince grazie all’attacco: Simeone, dalla panchina della prima giornata a una doppietta da 15, Rabiot da 12 (gol, assist e un altro bonus, nonostante il giallo) e Douvikas in gol. Meglio non guardare dietro: Mina 4, Bremer 4,5. E il capitano Davis K. delude ancora: 5.',
          ],
        },
        {
          id: 'g2-gossip',
          kind: 'gossip',
          kicker: 'Retroscena',
          title: 'Lo Sburrao legge l’Eco? Il caso Maldini',
          subtitle: 'Prima giornata: 10 in panchina. Seconda: titolare, capitano, 5.',
          author: 'La Talpa',
          teams: ['sbu'],
          body: [
            'Fonti di redazione sospettano che la presidenza dello Sburrao abbia letto le nostre «Panchine d’oro» e abbia deciso di rimediare. Maldini promosso titolare e capitano, risultato: 5 senza bonus. Ci scusiamo per l’influenza.',
            'Nel frattempo al Fo-Caccia è partita la caccia al colpevole per la scelta del portiere. Per ora l’unico indagato è il buon senso.',
          ],
        },
        {
          id: 'g2-rigori',
          kind: 'breve',
          title: 'Rigori, che dramma',
          author: 'Red.',
          body: [
            'De Bruyne sbaglia dal dischetto e passa da 14,5 a 2. Ramos G. ne sbaglia uno e ne segna un altro: il più equilibrato della giornata.',
          ],
        },
        {
          id: 'g2-capitani',
          kind: 'breve',
          title: 'Capitani: si riscatta solo Berardi',
          author: 'Red.',
          body: [
            'Berardi passa dal 5 della prima giornata a un gol da 10. Gli altri: Modric 6,5, Lobotka 6, Davis K., Maldini ed Esposito F.P. a 5.',
          ],
        },
        {
          id: 'g2-foc',
          kind: 'breve',
          title: 'Fo-Caccia, +62',
          author: 'Red.',
          body: [
            'Rispetto alla prima giornata il Fo-Caccia migliora di 62 fantapunti. In percentuale il dato non è calcolabile: la redazione ci ha provato e il foglio di calcolo ha dato errore.',
          ],
        },
      ],
    },
  ],
}
