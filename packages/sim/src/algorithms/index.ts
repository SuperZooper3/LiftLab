export { greedyAlgorithm } from './greedy.js';
export { scanAlgorithm } from './scan.js';
export { zonedParkingAlgorithm } from './zonedParking.js';
export { lobbyExpressAlgorithm } from './lobbyExpress.js';
export { destinationBatcherAlgorithm } from './destinationBatcher.js';

import type { ElevatorAlgorithm } from '../types.js';
import { destinationBatcherAlgorithm } from './destinationBatcher.js';
import { greedyAlgorithm } from './greedy.js';
import { lobbyExpressAlgorithm } from './lobbyExpress.js';
import { scanAlgorithm } from './scan.js';
import { zonedParkingAlgorithm } from './zonedParking.js';

export const algorithms: ElevatorAlgorithm[] = [
  greedyAlgorithm,
  scanAlgorithm,
  zonedParkingAlgorithm,
  lobbyExpressAlgorithm,
  destinationBatcherAlgorithm,
];

export function getAlgorithm(id: string): ElevatorAlgorithm {
  return algorithms.find((algorithm) => algorithm.id === id) ?? greedyAlgorithm;
}
