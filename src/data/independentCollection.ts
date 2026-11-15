import records from '../../museum-assets/batches/candidates-2026-11-15.json'
import type {Artifact} from '../types'
/** Approved standalone assets. Deliberately not part of the gameplay collection
 * state. Selected approved assets are now displayed in the modern museum. */
export const independentCollection=records as Artifact[]
