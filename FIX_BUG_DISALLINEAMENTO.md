# Fix Bug Disallineamento P&L

## 🐛 Problema Identificato

Quando l'utente modificava manualmente il **Prezzo del Sottostante** o lo **Strike** nei campi di input, il sistema ricalcolava i premi delle opzioni ma **non aggiornava i "premi iniziali"** di riferimento. Questo causava un disallineamento nel calcolo del P&L, che mostrava valori errati come se ci fosse stata una variazione tramite slider.

### Esempio del Bug

**Scenario**: Modifica manuale del Sottostante da 100 a 110

**Comportamento Errato** (prima della fix):
- Premio Call: 11.39€
- Premio iniziale Call: 4.28€ (non aggiornato!)
- P&L Long: **+7.11 (+166.0%)** ❌
- Slider Prezzo: 110.00 (+10.0%)

**Comportamento Atteso**:
- Premio Call: 11.39€
- Premio iniziale Call: 11.39€ (aggiornato!)
- P&L Long: **+0.00 (+0.0%)** ✅
- Slider Prezzo: 110.00 (+0.0% rispetto al nuovo setup)

---

## ✅ Soluzione Implementata

### 1. Creata Funzione `handleManualSetupChange`

Questa funzione gestisce le modifiche manuali di Sottostante o Strike e garantisce il reset completo del sistema:

```typescript
const handleManualSetupChange = (newSpotPrice: number, newStrike: number) => {
  // Aggiorna i valori di setup
  setSetupSpotPrice(newSpotPrice);
  setCurrentSpotPrice(newSpotPrice);
  setStrike(newStrike);
  
  // Ricalcola i premi usando Black-Scholes con i nuovi valori
  const timeToExpiry = tradeDuration / 365;
  const callInputs: OptionInputs = {
    S: newSpotPrice,
    K: newStrike,
    T: timeToExpiry,
    r: riskFreeRate / 100,
    sigma: callIVBase, // Usa la IV base corrente
  };
  const putInputs: OptionInputs = {
    S: newSpotPrice,
    K: newStrike,
    T: timeToExpiry,
    r: riskFreeRate / 100,
    sigma: putIVBase, // Usa la IV base corrente
  };
  
  const callResult = calculateCall(callInputs);
  const putResult = calculatePut(putInputs);
  
  // Aggiorna i premi iniziali (NON arrotondare per evitare discrepanze)
  setCallPremium(callResult.price);
  setPutPremium(putResult.price);
  
  // Reset slider a valori iniziali
  setCurrentDayIndex(0);
  setVolatilityAdjustment(0);
};
```

### 2. Modificato `onChange` del Campo Sottostante

**Prima**:
```typescript
onChange={(e) => {
  const val = Number(e.target.value);
  setSetupSpotPrice(val);
  setCurrentSpotPrice(val);
}}
```

**Dopo**:
```typescript
onChange={(e) => {
  const newSpotPrice = Number(e.target.value);
  handleManualSetupChange(newSpotPrice, strike);
}}
```

### 3. Modificato `onChange` del Campo Strike

**Prima**:
```typescript
onChange={(e) => setStrike(Number(e.target.value))}
```

**Dopo**:
```typescript
onChange={(e) => {
  const newStrike = Number(e.target.value);
  handleManualSetupChange(setupSpotPrice, newStrike);
}}
```

---

## 🧪 Test Eseguiti

### Test 1: Modifica Sottostante

**Input**: Sottostante da 100 a 110

**Risultati**:
- ✅ Premio Call: 11.39€
- ✅ Premio iniziale Call: 11.39€ (aggiornato)
- ✅ P&L Long Call: +0.00 (+0.0%)
- ✅ Premio Put: 0.90€
- ✅ Premio iniziale Put: 0.90€ (aggiornato)
- ✅ P&L Long Put: +0.00 (+0.0%)
- ✅ Slider Prezzo: 110.00 (+0.0%)
- ✅ Slider Tempo: 60 giorni (resettato)
- ✅ Slider Volatilità: 0% (resettato)

### Test 2: Modifica Strike

**Setup Iniziale**: Sottostante 110, Strike 100

**Input**: Strike da 100 a 120

**Risultati**:
- ✅ Premio Call: 1.37€ (OTM)
- ✅ Premio iniziale Call: 1.37€ (aggiornato)
- ✅ P&L Long Call: +0.00 (+0.0%)
- ✅ Premio Put: 10.78€ (ITM)
- ✅ Premio iniziale Put: 10.78€ (aggiornato)
- ✅ P&L Long Put: +0.00 (+0.0%)
- ✅ Intrinseco Call: 0.00€ (corretto, 110 < 120)
- ✅ Intrinseco Put: 10.00€ (corretto, 120 - 110)
- ✅ Slider resettati correttamente

---

## 📊 Impatto della Fix

### Comportamento Corretto Garantito

1. **Premi Iniziali Aggiornati**: Quando l'utente modifica Sottostante o Strike, i premi iniziali vengono ricalcolati e aggiornati
2. **P&L a Zero**: Il P&L parte sempre da 0.00% dopo una modifica manuale
3. **Slider Resettati**: Gli slider di Prezzo, Tempo e Volatilità vengono resettati ai valori iniziali
4. **Coerenza Calcoli**: Tutti i valori (intrinseco, estrinseco, greche) sono coerenti con i nuovi parametri

### File Modificati

- `client/src/pages/Home.tsx` (linee 207-242, 474-477, 487-490)

### Commit Git

- **Hash**: `77712174124d304b4e4d3e866c4942e8e2229ebe`
- **Messaggio**: "fix: risolto disallineamento P&L quando si modificano manualmente Sottostante o Strike"

---

## 🎯 Conclusione

Il bug è stato completamente risolto. Gli utenti possono ora modificare liberamente i parametri Sottostante e Strike senza incorrere in disallineamenti del P&L. Il sistema gestisce correttamente il reset completo e garantisce la coerenza di tutti i calcoli.

**Status**: ✅ **RISOLTO E TESTATO**

**Data Fix**: 19 Ottobre 2025

