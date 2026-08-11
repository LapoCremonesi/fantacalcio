/** Stato dell'asta, persistito in localStorage. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_PROJECTION, type ProjectionParams } from './model/projection'
import {
  DEFAULT_SCORING,
  DEFAULT_SETTINGS,
  type FantaTeam,
  type LeagueSettings,
  type Purchase,
  type Role,
  type ScoringRules,
} from './model/types'

export interface AppState {
  teams: FantaTeam[]
  purchases: Purchase[]
  settings: LeagueSettings
  rules: ScoringRules
  projection: ProjectionParams
  avversioneRischio: number
  concentration: number
}

const KEY = 'fantasta.v1'

export const INITIAL_STATE: AppState = {
  teams: [],
  purchases: [],
  settings: DEFAULT_SETTINGS,
  rules: DEFAULT_SCORING,
  projection: DEFAULT_PROJECTION,
  avversioneRischio: 0,
  concentration: 8,
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return INITIAL_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return {
      ...INITIAL_STATE,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      rules: { ...DEFAULT_SCORING, ...(parsed.rules ?? {}) },
      projection: { ...DEFAULT_PROJECTION, ...(parsed.projection ?? {}) },
    }
  } catch {
    return INITIAL_STATE
  }
}

let seq = 0
export function newId(prefix: string): string {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`
}

export function useStore() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota piena: l'app continua a funzionare in memoria */
    }
  }, [state])

  const addTeam = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      teams: [
        ...s.teams,
        { id: newId('team'), name: name.trim() || `Squadra ${s.teams.length + 1}`, isMine: s.teams.length === 0 },
      ],
    }))
  }, [])

  const renameTeam = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => (t.id === id ? { ...t, name } : t)),
    }))
  }, [])

  const removeTeam = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      teams: s.teams.filter((t) => t.id !== id),
      purchases: s.purchases.filter((p) => p.teamId !== id),
    }))
  }, [])

  const setMine = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => ({ ...t, isMine: t.id === id })),
    }))
  }, [])

  const addPurchase = useCallback((playerId: string, teamId: string, price: number) => {
    setState((s) => ({
      ...s,
      purchases: [
        ...s.purchases.filter((p) => p.playerId !== playerId),
        { playerId, teamId, price: Math.max(1, Math.round(price)) },
      ],
    }))
  }, [])

  const removePurchase = useCallback((playerId: string) => {
    setState((s) => ({ ...s, purchases: s.purchases.filter((p) => p.playerId !== playerId) }))
  }, [])

  const setTitolari = useCallback((role: Role, n: number) => {
    setState((s) => ({
      ...s,
      settings: {
        ...s.settings,
        titolari: { ...s.settings.titolari, [role]: Math.max(0, Math.round(n)) },
      },
    }))
  }, [])

  const setSlots = useCallback((role: Role, n: number) => {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, slots: { ...s.settings.slots, [role]: Math.max(0, Math.round(n)) } },
    }))
  }, [])

  const setBudget = useCallback((budget: number) => {
    setState((s) => ({ ...s, settings: { ...s.settings, budget: Math.max(1, Math.round(budget)) } }))
  }, [])

  const setRules = useCallback((rules: Partial<ScoringRules>) => {
    setState((s) => ({ ...s, rules: { ...s.rules, ...rules } }))
  }, [])

  const setRisk = useCallback((v: number) => {
    setState((s) => ({ ...s, avversioneRischio: v }))
  }, [])

  const setConcentration = useCallback((v: number) => {
    setState((s) => ({ ...s, concentration: v }))
  }, [])

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  const importState = useCallback((raw: string) => {
    const parsed = JSON.parse(raw) as Partial<AppState>
    setState({
      ...INITIAL_STATE,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      rules: { ...DEFAULT_SCORING, ...(parsed.rules ?? {}) },
      projection: { ...DEFAULT_PROJECTION, ...(parsed.projection ?? {}) },
    })
  }, [])

  const actions = useMemo(
    () => ({
      addTeam,
      renameTeam,
      removeTeam,
      setMine,
      addPurchase,
      removePurchase,
      setSlots,
      setTitolari,
      setBudget,
      setRules,
      setRisk,
      setConcentration,
      reset,
      importState,
    }),
    [
      addTeam,
      renameTeam,
      removeTeam,
      setMine,
      addPurchase,
      removePurchase,
      setSlots,
      setTitolari,
      setBudget,
      setRules,
      setRisk,
      setConcentration,
      reset,
      importState,
    ],
  )

  return { state, actions }
}

export type Actions = ReturnType<typeof useStore>['actions']
