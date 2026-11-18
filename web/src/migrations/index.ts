import * as migration_20261106_102400_initial from './20261106_102400_initial'
import * as migration_20261106_102417_ateliers_sessions from './20261106_102417_ateliers_sessions'
import * as migration_20261108_160000_reservations from './20261108_160000_reservations'
import * as migration_20261108_161000_reservation_session_sync from './20261108_161000_reservation_session_sync'
import * as migration_20261108_161100_reservation_hold_expiry from './20261108_161100_reservation_hold_expiry'
import * as migration_20261108_220000_stripe_booking from './20261108_220000_stripe_booking'

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
  {
    up: migration_20261108_160000_reservations.up,
    down: migration_20261108_160000_reservations.down,
    name: '20261108_160000_reservations',
  },
  {
    up: migration_20261108_161000_reservation_session_sync.up,
    down: migration_20261108_161000_reservation_session_sync.down,
    name: '20261108_161000_reservation_session_sync',
  },
  {
    up: migration_20261108_161100_reservation_hold_expiry.up,
    down: migration_20261108_161100_reservation_hold_expiry.down,
    name: '20261108_161100_reservation_hold_expiry',
  },
  {
    up: migration_20261108_220000_stripe_booking.up,
    down: migration_20261108_220000_stripe_booking.down,
    name: '20261108_220000_stripe_booking',
  },
]
