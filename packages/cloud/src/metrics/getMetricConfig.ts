import { firestoreGet, firestoreSet, firestoreUpdate } from '../actions'
import { MetricConfig } from './types'

export const getMetricConfig = firestoreGet<MetricConfig>('metrics')
export const setMetricConfig = firestoreSet<MetricConfig>('metrics')
export const updateMetricConfig = firestoreUpdate<MetricConfig>('metrics')
