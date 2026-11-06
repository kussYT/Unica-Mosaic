import * as migration_20261106_102400_initial from './20261106_102400_initial'
import * as migration_20261106_102417_ateliers_sessions from './20261106_102417_ateliers_sessions'

export const migrations = [
  {
    up: migration_20261106_102400_initial.up,
    down: migration_20261106_102400_initial.down,
    name: '20261106_102400_initial',
  },
  {
    up: migration_20261106_102417_ateliers_sessions.up,
    down: migration_20261106_102417_ateliers_sessions.down,
    name: '20261106_102417_ateliers_sessions',
  },
]
