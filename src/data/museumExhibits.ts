import records from '../../museum-assets/batches/museum-real-exhibits-2026-11-15.json'
import {independentCollection} from './independentCollection'
import {artifacts} from './artifacts'
import type {Artifact} from '../types'
export const museumBatchIds=['bcm-985','bcm-994','bcm-995','bcm-993','bcm-992','bcm-996','bcm-957','bcm-1000']
export const museumExhibits:Artifact[]=[...(records as Artifact[]),...independentCollection.filter(a=>museumBatchIds.includes(a.id)),...artifacts.filter(a=>['bcm-997','bcm-991','bcm-986','bcm-990','bcm-988'].includes(a.id))]
