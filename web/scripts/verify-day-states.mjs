import assert from 'node:assert/strict'

import { dayAvailability, dayStatusLabel } from '../src/lib/calendar.ts'

assert.equal(dayAvailability([]), 'none')
assert.equal(dayAvailability([{ state: 'cancelled' }]), 'none')
assert.equal(dayAvailability([{ state: 'scheduled' }]), 'open')
assert.equal(dayAvailability([{ state: 'full' }, { state: 'scheduled' }]), 'open')
assert.equal(dayAvailability([{ state: 'full' }]), 'full')
assert.equal(dayAvailability([{ state: 'full' }, { state: 'full' }]), 'full')
assert.equal(dayAvailability([{ state: 'cancelled' }, { state: 'full' }]), 'full')

assert.equal(dayStatusLabel('none', 0), 'aucun atelier')
assert.equal(dayStatusLabel('open', 1), '1 atelier disponible')
assert.equal(dayStatusLabel('open', 2), '2 ateliers disponibles')
assert.equal(dayStatusLabel('full', 1), 'atelier complet')
assert.equal(dayStatusLabel('full', 3), '3 ateliers complets')

console.log('PASS: états de jour du calendrier')
