'use client'

import { useState } from 'react'

const RAW_MSK_OPTIONS = {
  Shoulder: [
    'Both shoulders', 'Both shoulders + GALS', 'Both shoulders + Cervical spine',
    'Both shoulders + Thoracic spine', 'Both shoulders + Lumbar spine',
    'Both shoulders + L or R hip', 'Both shoulders + L or R knee',
  ],
  Hip: [
    'Both hips', 'Both hips + GALS', 'Both hips + Cervical spine',
    'Both hips + Thoracic spine', 'Both hips + Lumbar spine',
    'Both hips + L or R knee', 'Both hips + L or R shoulder',
  ],
  Knee: [
    'Both knees', 'Both knees + GALS', 'Both knees + Cervical spine',
    'Both knees + Thoracic spine', 'Both knees + Lumbar spine',
    'Both knees + L or R hip', 'Both knees + L or R shoulder',
  ],
  Hand: ['Examination of the Hand'],
} as const

const MSK_OPTIONS = Object.values(RAW_MSK_OPTIONS).flat().flatMap(item =>
  item.includes('L or R') ? [item.replace('L or R', 'L'), item.replace('L or R', 'R')] : [item]
)

const cranialNervePairs = Array.from({ length: 10 }, (_, index) => index + 2)
  .flatMap(first => Array.from({ length: 13 - first }, (_, offset) => `Cranial Nerves ${first}+${first + offset}`))

const NEURO_OPTIONS = [
  ...cranialNervePairs.map(pair => `Upper Neurological Examination + ${pair}`),
  'Upper neurological Examination',
  ...cranialNervePairs.map(pair => `Lower Neurological Examination + ${pair}`),
  'Lower neurological Examination',
  'Cerebellar Examination',
]

const VASCULAR_OPTIONS = [
  'Varicose vein and chronic venous insufficiency examination',
  'Examination of the Upper limb vascular system',
  'Examination of the Lower limb vascular system',
  'Examination of the Full peripheral vascular system',
]

const OTHER_OPTIONS = [
  'Examination of the Gastrointestinal system',
  'Respiratory Examination',
  'Cardiovascular Examination',
  'Thyroid Examination',
  'Diabetic foot Examination',
]

function choice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function sample<T>(items: T[], count: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

function generateExaminations(): string[] {
  return sample([
    choice(MSK_OPTIONS),
    choice(NEURO_OPTIONS),
    choice(VASCULAR_OPTIONS),
    ...sample(OTHER_OPTIONS, 2),
  ], 5)
}

export default function ExaminationGenerator() {
  const [examinations, setExaminations] = useState(generateExaminations)

  return (
    <div className="examination-generator">
      <div className="generator-header">
        <span className="pixel-label" style={{ fontSize: '7px' }}>RANDOM OSCE EXAMINATION</span>
        <button className="reroll-button" onClick={() => setExaminations(generateExaminations)}>
          ↻ REROLL 5
        </button>
      </div>
      <ol className="examination-list">
        {examinations.map((examination, index) => <li key={`${examination}-${index}`}>{examination}</li>)}
      </ol>
      <style jsx>{`
        .examination-generator { padding: 14px 32px; background: white; border-top: 1.5px dashed var(--border-px); }
        .generator-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .reroll-button { padding: 6px 9px; border: 1.5px solid var(--pink-mid); background: var(--pink-light); color: var(--pink-dark); cursor: pointer; font-family: var(--font-pixel); font-size: 7px; }
        .reroll-button:hover { background: var(--pink-mid); color: white; }
        .examination-list { margin: 12px 0 0; padding-left: 22px; font-family: var(--font-body); font-size: 13px; line-height: 1.8; color: #555; }
      `}</style>
    </div>
  )
}
