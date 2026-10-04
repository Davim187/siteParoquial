import { logActivity } from '../../../lib/activity.js'
import type { SettingsInput } from './settings.schema.js'
import * as settingsRepository from './settings.repository.js'

export async function getSettings() {
  return settingsRepository.findSettings()
}

export async function updateSettings(data: SettingsInput, userId: string) {
  const settings = await settingsRepository.updateSettings(data)
  await logActivity({ userId, action: 'update', entity: 'settings', entityId: 'default' })
  return settings
}
