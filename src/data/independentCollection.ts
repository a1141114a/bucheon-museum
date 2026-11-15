import records from '../../museum-assets/batches/candidates-2026-11-15.json'
import type {Artifact} from '../types'
/** Approved standalone assets. Deliberately not part of the gameplay collection
 * or placed in any level until the user decides how to use them. */
export const independentCollection=records as Artifact[]
