import { SCENARIOS } from '../data/mockData'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function runMockReconciliation(scenarioId, onStepComplete) {
  const scenario = SCENARIOS[scenarioId]
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`)

  const steps = scenario.result.decisionTrace

  for (let i = 0; i < steps.length; i++) {
    await delay(400 + Math.random() * 200)
    if (onStepComplete) onStepComplete(i + 1, steps[i])
  }

  await delay(300)
  return scenario.result
}
