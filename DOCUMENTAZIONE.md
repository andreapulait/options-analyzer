# Options Analyzer - Documentazione Completa

## Panoramica

**Options Analyzer** è un'applicazione web interattiva sviluppata per analizzare il valore delle opzioni finanziarie utilizzando il modello **Black-Scholes**. L'applicazione permette di visualizzare dinamicamente il valore intrinseco, estrinseco e totale di opzioni Call e Put, insieme alle relative **Greche** (Delta, Gamma, Theta, Vega, Rho), attraverso un'interfaccia intuitiva con slider e controlli interattivi.

Il modello Black-Scholes, sviluppato da Fischer Black, Myron Scholes e Robert Merton negli anni '70, è uno dei modelli più utilizzati nella finanza per il pricing delle opzioni europee. Questo strumento fornisce una rappresentazione visiva immediata di come i diversi parametri influenzano il valore delle opzioni, rendendolo ideale per scopi didattici, di analisi e di trading.

---

## Caratteristiche Principali

L'applicazione offre le seguenti funzionalità avanzate per l'analisi delle opzioni:

### Visualizzazione Dinamica del Valore

L'interfaccia presenta **barre a riempimento graduale** che mostrano in tempo reale la composizione del valore delle opzioni. Per ogni tipo di opzione (Call e Put), vengono visualizzate tre barre distinte che rappresentano il **valore intrinseco**, il **valore estrinseco** (o time value) e il **valore totale** (premio). Il valore intrinseco rappresenta il profitto immediato che si otterrebbe esercitando l'opzione, mentre il valore estrinseco riflette il valore temporale e la probabilità che l'opzione diventi profittevole prima della scadenza.

Le barre utilizzano una scala percentuale rispetto al valore massimo tra Call e Put, permettendo un confronto visivo immediato tra le due tipologie di opzioni. I colori distintivi (verde per le Call, rosso per le Put) facilitano l'identificazione rapida dei dati.

### Controlli Interattivi

L'applicazione fornisce tre **slider principali** che permettono di modificare i parametri fondamentali del modello:

Il primo slider controlla il **prezzo del sottostante**, che può variare da zero fino al 500% del prezzo iniziale (impostato a 100€). Questo permette di simulare scenari estremi di mercato e osservare come il valore delle opzioni reagisce a movimenti significativi del prezzo.

Il secondo slider gestisce il **tempo rimanente alla scadenza**, espresso in giorni. L'utente può simulare il passaggio del tempo da oggi (giorno zero) fino a un anno (365 giorni), con incrementi settimanali. Questo controllo è fondamentale per osservare l'effetto del **time decay** (Theta) sul valore delle opzioni.

Il terzo slider permette di regolare la **volatilità implicita** in modo relativo, con variazioni dal -100% al +100% rispetto a un valore base del 25%. La volatilità effettiva viene calcolata dinamicamente e visualizzata sotto lo slider, permettendo di comprendere immediatamente l'impatto delle variazioni di volatilità sul premio delle opzioni.

### Parametri Configurabili

Oltre agli slider, l'applicazione offre campi di input numerici per modificare con precisione:

- **Strike Price**: il prezzo di esercizio dell'opzione, modificabile con incrementi di 1€
- **Giorni alla Scadenza**: alternativa numerica allo slider temporale, con incrementi settimanali
- **Tasso Risk-Free**: il tasso di interesse privo di rischio, espresso in percentuale, con valore predefinito del 3%

Questi controlli permettono di configurare scenari specifici e di analizzare situazioni di mercato particolari con grande precisione.

### Pannello delle Greche

Il pannello laterale dedicato alle **Greche** fornisce una visione completa della sensibilità delle opzioni ai vari parametri di mercato. Per ogni Greca vengono mostrati:

- Il **simbolo greco** tradizionale (Δ, Γ, Θ, ν, ρ)
- Il **nome** della Greca
- Una **descrizione** del suo significato finanziario
- I **valori numerici** per Call e Put
- **Barre comparative** che visualizzano graficamente la magnitudine relativa

Le Greche implementate sono:

**Delta (Δ)** misura la variazione del prezzo dell'opzione per ogni euro di movimento del sottostante. Per le Call, il Delta varia tra 0 e 1, mentre per le Put varia tra -1 e 0. Un Delta di 0.5 indica che per ogni euro di aumento del sottostante, il valore dell'opzione aumenta di 0.50€.

**Gamma (Γ)** rappresenta la variazione del Delta per ogni euro di movimento del sottostante. È particolarmente importante per le opzioni at-the-money e diminuisce man mano che ci si avvicina alla scadenza. Un Gamma elevato indica che il Delta cambia rapidamente.

**Theta (Θ)** quantifica il decadimento temporale giornaliero dell'opzione. È generalmente negativo per le opzioni long, indicando che il valore diminuisce con il passare del tempo, a parità di altri fattori. Il Theta è massimo per le opzioni at-the-money.

**Vega (ν)** misura la sensibilità del prezzo dell'opzione a variazioni dell'1% nella volatilità implicita. Un Vega elevato indica che l'opzione è molto sensibile ai cambiamenti di volatilità, caratteristica tipica delle opzioni at-the-money con scadenze più lunghe.

**Rho (ρ)** indica la variazione del prezzo dell'opzione per ogni 1% di variazione del tasso di interesse risk-free. È generalmente meno rilevante delle altre Greche per opzioni a breve termine, ma diventa significativo per scadenze più lunghe.

---

## Implementazione Tecnica

### Architettura dell'Applicazione

L'applicazione è stata sviluppata utilizzando tecnologie web moderne per garantire prestazioni elevate e un'esperienza utente fluida:

- **React 19**: framework JavaScript per la costruzione dell'interfaccia utente reattiva
- **TypeScript**: linguaggio tipizzato che garantisce robustezza e manutenibilità del codice
- **Tailwind CSS 4**: framework CSS utility-first per uno styling rapido e consistente
- **shadcn/ui**: libreria di componenti UI accessibili e personalizzabili
- **Vite**: build tool moderno per sviluppo rapido e ottimizzazione della produzione

### Modello Matematico

Il cuore dell'applicazione è l'implementazione del **modello Black-Scholes** per il pricing delle opzioni europee. Il modello si basa sulle seguenti assunzioni:

1. Il prezzo del sottostante segue un moto browniano geometrico
2. Non ci sono costi di transazione o tasse
3. Il tasso risk-free è costante
4. La volatilità è costante nel tempo
5. Le opzioni possono essere esercitate solo alla scadenza (stile europeo)

#### Formula di Black-Scholes per Call

Il prezzo di una Call europea è dato da:

```
C = S₀ · N(d₁) - K · e^(-rT) · N(d₂)
```

dove:
- `S₀` = prezzo corrente del sottostante
- `K` = strike price
- `r` = tasso risk-free
- `T` = tempo alla scadenza (in anni)
- `N(x)` = funzione di distribuzione cumulativa normale standard
- `d₁ = [ln(S₀/K) + (r + σ²/2)T] / (σ√T)`
- `d₂ = d₁ - σ√T`
- `σ` = volatilità implicita

#### Formula di Black-Scholes per Put

Il prezzo di una Put europea è dato da:

```
P = K · e^(-rT) · N(-d₂) - S₀ · N(-d₁)
```

#### Calcolo delle Greche

Le Greche sono derivate parziali del prezzo dell'opzione rispetto ai vari parametri:

**Delta**:
- Call: `Δ_call = N(d₁)`
- Put: `Δ_put = N(d₁) - 1 = -N(-d₁)`

**Gamma** (uguale per Call e Put):
```
Γ = n(d₁) / (S₀ · σ · √T)
```
dove `n(x)` è la funzione di densità di probabilità normale standard.

**Theta**:
- Call: `Θ_call = -[S₀ · n(d₁) · σ / (2√T)] - r · K · e^(-rT) · N(d₂)`
- Put: `Θ_put = -[S₀ · n(d₁) · σ / (2√T)] + r · K · e^(-rT) · N(-d₂)`

I valori sono divisi per 365 per ottenere il decadimento giornaliero.

**Vega** (uguale per Call e Put):
```
ν = S₀ · n(d₁) · √T
```
Il risultato è diviso per 100 per rappresentare la variazione per 1% di volatilità.

**Rho**:
- Call: `ρ_call = K · T · e^(-rT) · N(d₂)`
- Put: `ρ_put = -K · T · e^(-rT) · N(-d₂)`

I valori sono divisi per 100 per rappresentare la variazione per 1% di tasso.

### Gestione dei Casi Limite

L'implementazione gestisce correttamente diversi casi limite che possono verificarsi durante l'utilizzo:

**Scadenza raggiunta (T = 0)**: quando il tempo alla scadenza è zero, il valore dell'opzione coincide con il suo valore intrinseco. Le Greche diventano zero (eccetto Delta che assume valore 1 o -1 a seconda che l'opzione sia ITM o OTM).

**Volatilità zero (σ = 0)**: in assenza di volatilità, il valore dell'opzione è determinato solo dal valore attualizzato del payoff atteso. Questo scenario, sebbene teorico, è gestito correttamente per evitare errori di calcolo.

**Valori negativi**: tutti i calcoli sono protetti per garantire che i prezzi delle opzioni non possano mai essere negativi, come richiesto dalla teoria finanziaria.

### Validazione del Modello

L'implementazione è stata validata attraverso una suite di test che verificano:

1. **Correttezza dei calcoli**: confronto con valori teorici noti
2. **Put-Call Parity**: verifica della relazione `C - P = S - K·e^(-rT)`
3. **Comportamento delle Greche**: verifica che le Greche si comportino come previsto dalla teoria
4. **Casi limite**: test di scenari estremi (scadenza, volatilità zero, ecc.)

I test eseguiti hanno confermato la correttezza dell'implementazione con precisione fino alla sesta cifra decimale.

---

## Guida all'Utilizzo

### Scenario Base: Opzione At-The-Money

All'avvio dell'applicazione, viene presentata una configurazione di default che rappresenta un'opzione **at-the-money** (ATM), ovvero con strike uguale al prezzo corrente del sottostante:

- Prezzo sottostante: 100€
- Strike: 100€
- Tempo alla scadenza: 180 giorni (circa 6 mesi)
- Volatilità base: 25%
- Tasso risk-free: 3%

In questa configurazione, si può osservare che:
- La Call vale circa 7.70€, completamente composta da valore estrinseco
- La Put vale circa 6.23€, anch'essa completamente estrinseca
- Il Delta della Call è circa 0.57, mentre quello della Put è -0.43
- Il Gamma è identico per Call e Put (circa 0.022)

### Simulazione del Movimento del Prezzo

Muovendo lo slider del **prezzo del sottostante**, è possibile osservare come cambiano i valori delle opzioni:

**Aumento del prezzo** (es. da 100€ a 120€):
- La Call diventa **in-the-money** (ITM): il valore intrinseco aumenta a 20€
- Il valore estrinseco diminuisce leggermente
- Il Delta della Call si avvicina a 1
- La Put diventa **out-of-the-money** (OTM): il valore intrinseco scende a zero
- Il valore totale della Put diminuisce significativamente

**Diminuzione del prezzo** (es. da 100€ a 80€):
- La Call diventa OTM: solo valore estrinseco rimane
- La Put diventa ITM: il valore intrinseco aumenta a 20€
- Il Delta della Put si avvicina a -1

### Effetto del Time Decay

Muovendo lo slider del **tempo**, è possibile simulare il passaggio dei giorni e osservare l'effetto del **time decay**:

**Avvicinandosi alla scadenza** (riducendo i giorni):
- Il valore estrinseco di entrambe le opzioni diminuisce progressivamente
- Il Theta (decadimento giornaliero) aumenta in valore assoluto
- Il Gamma aumenta per le opzioni ATM
- Il Vega diminuisce

**Alla scadenza** (0 giorni):
- Rimane solo il valore intrinseco
- Tutte le Greche diventano zero (eccetto Delta)
- Il valore delle opzioni OTM diventa zero

### Impatto della Volatilità

Lo slider della **volatilità** permette di osservare come le aspettative di movimento del mercato influenzano il valore delle opzioni:

**Aumento della volatilità** (es. +50%):
- Il valore di entrambe le opzioni aumenta significativamente
- Il Vega mostra quanto aumenta il premio per ogni 1% di volatilità
- L'effetto è massimo per le opzioni ATM

**Diminuzione della volatilità** (es. -50%):
- Il valore delle opzioni diminuisce
- Le opzioni OTM perdono più valore in percentuale
- Il Vega rimane positivo (più volatilità = più valore)

### Analisi delle Strategie

L'applicazione può essere utilizzata per analizzare diverse strategie di opzioni:

**Long Call**: acquisto di una Call per speculare su un rialzo del sottostante. Osservare come il Delta positivo e il Theta negativo influenzano la posizione.

**Long Put**: acquisto di una Put per protezione o speculazione su un ribasso. Il Delta negativo indica che la posizione guadagna quando il sottostante scende.

**Confronto Call vs Put**: a parità di strike e scadenza, confrontare come le due opzioni reagiscono diversamente ai movimenti del mercato.

---

## Interpretazione delle Greche

### Delta: Direzionalità

Il **Delta** è la Greca più importante per comprendere la direzionalità di una posizione in opzioni. Rappresenta l'equivalente in azioni del sottostante che si possiede attraverso l'opzione.

Un Delta di 0.5 per una Call significa che l'opzione si comporta come se si possedessero 50 azioni del sottostante (su 100). Se il sottostante sale di 1€, la Call guadagna circa 0.50€.

Per le strategie di hedging, il Delta viene utilizzato per creare posizioni **delta-neutral**, ovvero insensibili a piccoli movimenti del sottostante.

### Gamma: Convessità

Il **Gamma** misura quanto rapidamente cambia il Delta. È particolarmente importante per i market maker e per chi gestisce portafogli di opzioni complessi.

Un Gamma elevato indica che la posizione è molto sensibile ai movimenti del sottostante e richiede frequenti aggiustamenti del hedge. Il Gamma è massimo per le opzioni ATM e diminuisce man mano che ci si allontana dallo strike o ci si avvicina alla scadenza.

### Theta: Il Costo del Tempo

Il **Theta** rappresenta il costo giornaliero del possesso di un'opzione. Per chi acquista opzioni (long), il Theta è negativo: ogni giorno che passa, l'opzione perde valore, a parità di altri fattori.

Il Theta è massimo per le opzioni ATM e accelera man mano che ci si avvicina alla scadenza. Questo fenomeno è noto come **time decay** ed è uno dei fattori più importanti nel trading di opzioni.

### Vega: Sensibilità alla Volatilità

Il **Vega** misura quanto cambia il valore dell'opzione per ogni 1% di variazione della volatilità implicita. È sempre positivo per le opzioni long: un aumento della volatilità aumenta il valore di tutte le opzioni.

Il Vega è particolarmente importante durante periodi di incertezza di mercato o prima di eventi significativi (earnings, decisioni di politica monetaria, ecc.).

### Rho: Sensibilità ai Tassi

Il **Rho** è generalmente la Greca meno rilevante per le opzioni a breve termine, ma diventa significativo per scadenze lunghe (LEAPS). Misura la sensibilità del prezzo dell'opzione alle variazioni dei tassi di interesse.

Un Rho positivo (tipico delle Call) indica che l'opzione guadagna valore quando i tassi aumentano, mentre un Rho negativo (tipico delle Put) indica il contrario.

---

## Limitazioni e Considerazioni

### Assunzioni del Modello

Il modello Black-Scholes si basa su diverse assunzioni che nella realtà potrebbero non essere completamente rispettate:

**Volatilità costante**: nella realtà, la volatilità cambia nel tempo e dipende dal livello del prezzo del sottostante (volatility smile/skew).

**Distribuzione lognormale**: il modello assume che i rendimenti del sottostante seguano una distribuzione lognormale, ma nella realtà i mercati presentano "fat tails" (code pesanti) con eventi estremi più frequenti di quanto previsto.

**Assenza di dividendi**: questa implementazione non considera i dividendi del sottostante. Per azioni che pagano dividendi, il modello dovrebbe essere adattato.

**Opzioni europee**: il modello è valido solo per opzioni esercitabili alla scadenza. Le opzioni americane (esercitabili in qualsiasi momento) richiedono modelli più complessi.

### Utilizzo Consigliato

L'applicazione è ideale per:

- **Scopi didattici**: comprendere come funzionano le opzioni e le Greche
- **Analisi preliminare**: valutare rapidamente l'effetto dei vari parametri
- **Confronto di scenari**: simulare diverse condizioni di mercato
- **Visualizzazione intuitiva**: comunicare concetti complessi in modo visivo

Tuttavia, per decisioni di trading reali, è necessario considerare:

- Dati di mercato in tempo reale
- Volatilità implicita effettiva (da smile/skew)
- Costi di transazione e bid-ask spread
- Liquidità del mercato
- Eventi specifici (dividendi, earnings, ecc.)

---

## Riferimenti Teorici

Il modello Black-Scholes è stato pubblicato originariamente nel 1973 nell'articolo "The Pricing of Options and Corporate Liabilities" da Fischer Black e Myron Scholes. Robert Merton ha esteso il modello nello stesso anno, e per questo lavoro Scholes e Merton hanno ricevuto il Premio Nobel per l'Economia nel 1997 (Black era deceduto nel 1995).

Il modello ha rivoluzionato la finanza moderna, fornendo per la prima volta un metodo teoricamente rigoroso per il pricing delle opzioni. Prima del Black-Scholes, il trading di opzioni era largamente basato su intuizione e regole empiriche.

Nonostante le sue limitazioni, il modello rimane uno strumento fondamentale nella finanza quantitativa e costituisce la base per modelli più avanzati che cercano di superarne le assunzioni restrittive.

---

## Sviluppi Futuri

Possibili estensioni dell'applicazione potrebbero includere:

- **Grafici interattivi**: visualizzazione del payoff diagram e del profit/loss a scadenza
- **Volatility smile**: implementazione di modelli con volatilità variabile per strike
- **Strategie complesse**: analisi di spread, straddle, strangle e altre combinazioni
- **Opzioni americane**: implementazione di modelli per opzioni esercitabili anticipatamente
- **Dati di mercato reali**: integrazione con API per prezzi e volatilità in tempo reale
- **Simulazione Monte Carlo**: calcolo del prezzo tramite simulazione stocastica
- **Analisi di sensibilità**: grafici 3D per visualizzare l'effetto combinato di più parametri

---

## Conclusioni

**Options Analyzer** rappresenta uno strumento completo e intuitivo per l'analisi delle opzioni finanziarie. L'implementazione rigorosa del modello Black-Scholes, combinata con un'interfaccia utente moderna e reattiva, permette sia a studenti che a professionisti della finanza di esplorare in modo interattivo il comportamento delle opzioni e delle loro Greche.

L'applicazione dimostra come tecnologie web moderne possano essere utilizzate efficacemente per creare strumenti finanziari sofisticati, accessibili direttamente dal browser senza necessità di installazione. La validazione matematica attraverso test rigorosi garantisce l'affidabilità dei calcoli, mentre l'interfaccia visuale facilita la comprensione di concetti complessi.

Che si tratti di apprendimento, analisi preliminare o visualizzazione didattica, Options Analyzer fornisce una base solida per comprendere il mondo delle opzioni finanziarie e delle loro dinamiche.

---

**Autore**: Manus AI  
**Tecnologie**: React 19, TypeScript, Tailwind CSS 4, shadcn/ui  
**Modello**: Black-Scholes per opzioni europee  
**Licenza**: Open source

