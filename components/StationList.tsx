'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { buildHistoryStationPrompt } from '@/lib/stationPrompt'
import type { HistoryStation, SeenMode } from '@/types'

const STATION_COLUMNS = [
  'id', 'specialty', 'presentation', 'patient_name', 'patient_age', 'patient_sex',
  'patient_dob', 'candidate_info', 'setting', 'presenting_complaint',
  'diagnosis_common',
  'opening_statement', 'patient_script', 'patient_follow_up_question',
  'examiner_questions', 'history_marks', 'question_marks',
].join(', ')

function getCommonLabel(value: boolean | null | undefined): 'Common' | 'Rare' | null {
  if (value === null || value === undefined) return null
  return value ? 'Common' : 'Rare'
}

function parseJson<T>(value: T | string | null, fallback: T): T {
  if (typeof value !== 'string') return value ?? fallback
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Unable to parse station JSON:', error)
    return fallback
  }
}

function normaliseStation(row: Record<string, unknown>): HistoryStation {
  return {
    ...row,
    id: String(row.id ?? ''),
    patient_name: String(row.patient_name ?? 'Unnamed patient'),
    examiner_questions: parseJson(row.examiner_questions as HistoryStation['examiner_questions'], []),
    history_marks: parseJson(row.history_marks as HistoryStation['history_marks'], []),
    question_marks: parseJson(row.question_marks as HistoryStation['question_marks'], []),
  } as HistoryStation
}

interface Props {
  expanded: boolean
  stationPool: SeenMode
}

export default function StationList({ expanded, stationPool }: Props) {
  const [stations, setStations] = useState<HistoryStation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!expanded) return

    let cancelled = false
    const fetchStations = async () => {
      setLoading(true)
      setError('')
      const { data, error: fetchError } = await supabase
        .from('2b_histories')
        .select(STATION_COLUMNS)
        .order('id')

      if (cancelled) return
      if (fetchError) {
        setError('Unable to load history stations.')
        setStations([])
      } else {
        setStations((data ?? []).map(row => normaliseStation(row as unknown as Record<string, unknown>)))
      }
      setLoading(false)
    }

    fetchStations()
    return () => { cancelled = true }
  }, [expanded])

  const copyPrompt = async (station: HistoryStation) => {
    const prompt = buildHistoryStationPrompt(station)
    try {
      await navigator.clipboard.writeText(prompt)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopiedId(station.id)
    window.setTimeout(() => setCopiedId(current => current === station.id ? null : current), 1800)
  }

  if (!expanded) return null

  return (
    <div className="station-list">
      {loading && <p className="station-status">LOADING STATIONS...</p>}
      {error && <p className="station-status station-error">✗ {error}</p>}
      {!loading && !error && stations.length === 0 && (
        <p className="station-status">No stations yet</p>
      )}
      {!loading && !error && stations.map(station => (
        <button key={station.id} className="station-row" onClick={() => copyPrompt(station)}>
          <span className="station-details">
            <strong>{station.patient_name}, {station.patient_age ?? 'age unavailable'}</strong>
            <span>{station.candidate_info || 'No candidate instructions yet.'}</span>
            {getCommonLabel(station.diagnosis_common) && (
              <span className="station-diagnosis-label">
                {getCommonLabel(station.diagnosis_common)}
              </span>
            )}
          </span>
          <span className="station-action">{copiedId === station.id ? 'COPIED!' : 'COPY PROMPT'}</span>
        </button>
      ))}

      <style jsx>{`
        .station-list { background: white; border-top: 1.5px dashed var(--border-px); }
        .station-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; width: 100%; padding: 12px 14px 12px 32px; border: 0; border-bottom: 1px solid var(--border-px); background: white; color: #222; text-align: left; cursor: pointer; transition: background 0.1s; }
        .station-row:last-child { border-bottom: none; }
        .station-row:hover { background: var(--pink-light); }
        .station-details { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
        .station-details strong { font-family: var(--font-body); font-size: 13px; }
        .station-details span { white-space: pre-wrap; font-family: var(--font-body); font-size: 12px; line-height: 1.5; color: #555; }
        .station-details .station-diagnosis-label { font-size: 10px; color: #999; }
        .station-action { flex-shrink: 0; font-family: var(--font-pixel); font-size: 6px; color: var(--pink-dark); }
        .station-status { margin: 0; padding: 14px 32px; font-family: var(--font-pixel); font-size: 7px; color: #999; }
        .station-error { color: #c62828; }
      `}</style>
    </div>
  )
}
