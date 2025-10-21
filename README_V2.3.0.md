# 📊 Options Analyzer v2.3.0

## Dashboard Interattivo per Analisi Opzioni con Modello Black-Scholes

![Version](https://img.shields.io/badge/version-2.3.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Descrizione

**Options Analyzer** è un'applicazione web professionale per l'analisi di opzioni finanziarie che utilizza il modello **Black-Scholes** per il pricing e il calcolo delle Greeks. L'applicazione offre due modalità operative:

### 1. 🎯 Single Option Analyzer (v1.6.1)
Analisi dettagliata di singole opzioni Call e Put con:
- Calcolo prezzo teorico Black-Scholes
- Visualizzazione intrinseco/estrinseco con barre animate
- Pannello Greeks completo (Delta, Gamma, Theta, Vega, Rho)
- Simulazione interattiva con sliders (Prezzo, Tempo, Volatilità)
- Calcolo P&L per posizioni Long e Short

### 2. 🚀 Strategy Builder (v2.3.0) - NUOVO
Costruzione e analisi di strategie multi-leg con:
- **10 strategie predefinite** (Spreads, Straddles, Iron Condor, Butterfly)
- **Selezione data di scadenza individuale** per ogni leg
- **Greeks aggregati** per l'intera strategia
- **Grafico payoff interattivo** (scenario corrente vs scadenza)
- **Simulazione real-time** con 3 sliders indipendenti
- **Supporto completo** per Calendar e Diagonal Spreads
- **Ticker fetch** per prezzi real-time

---

## ✨ Novità v2.3.0

### 🗓️ Selezione Data di Scadenza Individuale

Ogni leg può ora avere una **data di scadenza indipendente**, abilitando:
- **Calendar Spreads** (stesso strike, scadenze diverse)
- **Diagonal Spreads** (strike diversi, scadenze diverse)
- Strategie complesse multi-scadenza

**Caratteristiche:**
- Input date picker nativo del browser
- Calcolo automatico DTE (Days To Expiration)
- Validazione data minima
- Aggiornamento real-time

### ⚡ Greeks Aggregati per Strategia

Nuovo pannello che mostra i Greeks totali della strategia:
- **Delta (Δ)**: Sensibilità al prezzo del sottostante
- **Gamma (Γ)**: Variazione del Delta
- **Theta (Θ)**: Decadimento temporale giornaliero
- **Vega (ν)**: Sensibilità alla volatilità
- **Rho (ρ)**: Sensibilità al tasso risk-free

**Caratteristiche:**
- Calcolo automatico con moltiplicatori (long/short, quantità)
- Aggiornamento real-time con sliders
- Colori intuitivi per interpretazione rapida
- Design professionale con gradiente viola

---

## 🚀 Quick Start

### Prerequisiti
```bash
Node.js >= 18.0.0
pnpm >= 8.0.0
```

### Installazione
```bash
# Clone repository
git clone [repository-url]
cd options_analyzer

# Installa dipendenze
pnpm install

# Avvia dev server
pnpm dev

# Apri browser
http://localhost:3000
```

### Build Produzione
```bash
pnpm build
pnpm preview
```

---

## 📚 Strategie Supportate

### Single Leg
- ✅ Long Call
- ✅ Short Call
- ✅ Long Put
- ✅ Short Put

### Vertical Spreads
- ✅ Bull Call Spread
- ✅ Bear Put Spread

### Volatility Strategies
- ✅ Long Straddle
- ✅ Short Straddle
- ✅ Long Strangle
- ✅ Short Strangle

### Complex Strategies
- ✅ Iron Condor
- ✅ Butterfly Spread

### Multi-Expiration Strategies (NUOVO v2.3.0)
- ✅ **Calendar Spread** (stesso strike, scadenze diverse)
- ✅ **Diagonal Spread** (strike diversi, scadenze diverse)

---

## 🎨 Features Principali

### Single Option Analyzer

#### Parametri Configurabili
- Prezzo sottostante
- Strike price
- Date inizio trade e scadenza
- Tasso risk-free
- Premi iniziali Call/Put
- Volatilità implicita (IV)

#### Visualizzazioni
- **Barre Valore**: Intrinseco vs Estrinseco con animazioni smooth
- **P&L Cards**: Calcolo profitto/perdita per Long e Short
- **Pannello Greeks**: Tutti i 5 Greeks con descrizioni
- **Sliders Simulazione**: Prezzo, Tempo (DTE), Volatilità

### Strategy Builder

#### Gestione Legs
- Aggiunta/rimozione legs illimitati
- Configurazione completa per ogni leg:
  - Tipo (Call/Put)
  - Posizione (Long/Short)
  - Strike price
  - Premio
  - Volatilità implicita
  - **Data di scadenza** (NUOVO)
  - Quantità

#### Analisi Strategia
- **P&L Totale**: Calcolo aggregato con percentuale
- **P&L per Leg**: Dettaglio per ogni posizione
- **Greeks Aggregati** (NUOVO): Delta, Gamma, Theta, Vega, Rho
- **Analisi Rischio**: Max Profit, Max Loss, Break-Even

#### Grafico Payoff
- Linea verde solida: Scenario corrente
- Linea grigia tratteggiata: Scenario a scadenza
- Range dinamico basato su strike prices
- Aggiornamento real-time con sliders

#### Ticker Fetch
- Integrazione con API prezzi real-time
- Aggiornamento automatico strike prices
- Timestamp ultimo fetch
- Gestione errori

---

## 🔧 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript 5.0** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Radix UI** - UI components

### Modelli Matematici
- **Black-Scholes** - Options pricing
- **Newton-Raphson** - Implied volatility calculation
- **Greeks** - Delta, Gamma, Theta, Vega, Rho

### Algoritmi
- Smoothing algorithm per animazioni barre
- Calcolo P&L multi-leg
- Aggregazione Greeks con moltiplicatori
- Calcolo DTE dinamico per scadenze multiple

---

## 📖 Guida Utilizzo

### Creare un Calendar Spread

Un **Calendar Spread** (o Time Spread) sfrutta il diverso decadimento temporale di opzioni con scadenze diverse.

**Esempio: Long Calendar Spread**
1. Vai su Strategy Builder
2. Clicca "Aggiungi Leg"
3. Configura primo leg:
   - Posizione: **Long**
   - Tipo: **Call**
   - Strike: **$100**
   - Scadenza: **60 giorni** (data futura)
   - Premio: $5.00
   - IV: 25%
4. Clicca "Aggiungi Leg" di nuovo
5. Configura secondo leg:
   - Posizione: **Short**
   - Tipo: **Call**
   - Strike: **$100** (stesso strike)
   - Scadenza: **30 giorni** (scadenza più vicina)
   - Premio: $3.00
   - IV: 25%

**Risultato:**
- Costo netto: $2.00 (5.00 - 3.00)
- Max Profit: Quando il sottostante è vicino allo strike alla scadenza vicina
- Max Loss: Limitato al costo netto ($2.00)

**Greeks Attesi:**
- **Theta**: Positivo (beneficia dal time decay della short leg)
- **Vega**: Positivo (beneficia da aumento volatilità sulla long leg)
- **Delta**: Vicino a zero (neutrale al prezzo)

### Interpretare i Greeks Aggregati

Il pannello "⚡ Greeks Strategia" mostra i Greeks totali:

#### Delta (Δ)
- **+1.0**: Strategia si comporta come 100 azioni long
- **-1.0**: Strategia si comporta come 100 azioni short
- **0.0**: Strategia neutrale al prezzo (delta-neutral)

#### Gamma (Γ)
- **Positivo**: Delta aumenta quando prezzo sale
- **Negativo**: Delta diminuisce quando prezzo sale
- **Alto**: Strategia sensibile a movimenti di prezzo

#### Theta (Θ)
- **Negativo**: Strategia perde valore col tempo (es. long options)
- **Positivo**: Strategia guadagna valore col tempo (es. short options)
- Espresso in $/giorno

#### Vega (ν)
- **Positivo**: Strategia beneficia da aumento volatilità
- **Negativo**: Strategia beneficia da diminuzione volatilità
- Per 1% di variazione di IV

#### Rho (ρ)
- **Positivo**: Strategia beneficia da aumento tassi
- **Negativo**: Strategia beneficia da diminuzione tassi
- Generalmente meno rilevante per strategie a breve termine

---

## 📊 Esempi Strategie

### Bull Call Spread
```
Leg 1: Long Call  @ $95  (scadenza: 60 gg)
Leg 2: Short Call @ $105 (scadenza: 60 gg)

Greeks Attesi:
- Delta: +0.3 a +0.5 (bullish)
- Theta: Negativo (time decay)
- Vega: Positivo ma limitato
```

### Iron Condor
```
Leg 1: Short Put  @ $95  (scadenza: 60 gg)
Leg 2: Long Put   @ $90  (scadenza: 60 gg)
Leg 3: Short Call @ $105 (scadenza: 60 gg)
Leg 4: Long Call  @ $110 (scadenza: 60 gg)

Greeks Attesi:
- Delta: ~0 (neutrale)
- Theta: Positivo (beneficia da time decay)
- Vega: Negativo (beneficia da bassa volatilità)
```

### Diagonal Spread
```
Leg 1: Long Call  @ $95  (scadenza: 90 gg)
Leg 2: Short Call @ $105 (scadenza: 30 gg)

Greeks Attesi:
- Delta: Positivo (bullish bias)
- Theta: Positivo (short leg decade più velocemente)
- Vega: Positivo (long leg più sensibile)
```

---

## 🎯 Roadmap

### v2.4.0 (Q4 2025)
- [ ] Calcolo automatico Max Profit/Loss preciso
- [ ] Break-Even Points multipli
- [ ] Export strategia in PDF
- [ ] Salvataggio strategie custom

### v2.5.0 (Q1 2026)
- [ ] Heatmap 3D (Prezzo vs Tempo vs Volatilità)
- [ ] Confronto tra strategie
- [ ] Backtesting con dati storici
- [ ] Alert su Greeks threshold

### v3.0.0 (Q2 2026)
- [ ] Integrazione dati real-time
- [ ] Calcolo IV da prezzi di mercato
- [ ] Portfolio multi-strategia
- [ ] Mobile app (React Native)

---

## 📝 Documentazione

- **RELEASE_NOTES_V2.3.0.md** - Note di rilascio complete
- **COMPLETAMENTO_V2.3.0.md** - Dettagli implementazione
- **TESTING_V2.3.0.md** - Report testing

---

## 🤝 Contributi

Contributi, issues e feature requests sono benvenuti!

### Come Contribuire
1. Fork il progetto
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📄 License

Questo progetto è rilasciato sotto licenza MIT. Vedi `LICENSE` per dettagli.

---

## 👨‍💻 Autore

**Options Analyzer Dev Team**
- Email: dev@optionsanalyzer.com
- GitHub: [repository]

---

## 🙏 Ringraziamenti

- Modello Black-Scholes per options pricing
- Recharts per visualizzazioni
- Radix UI per componenti accessibili
- Tailwind CSS per styling rapido

---

## ⚠️ Disclaimer

Questo software è fornito solo a scopo educativo e informativo. Non costituisce consulenza finanziaria. Il trading di opzioni comporta rischi significativi e può non essere adatto a tutti gli investitori. Consulta sempre un consulente finanziario qualificato prima di prendere decisioni di investimento.

---

**Buon trading! 📈🚀**

*Ultima modifica: 21 Ottobre 2025*
*Versione: 2.3.0*

