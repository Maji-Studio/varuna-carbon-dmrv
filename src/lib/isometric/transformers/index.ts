/**
 * Isometric Transformers
 *
 * Data transformation functions for converting local DMRV data
 * to Isometric API formats.
 */

export {
  transformFacilityToIsometric,
  validateFacilityForSync,
  type CreateFacilityRequest,
} from './facility';

export {
  transformFeedstockTypeToIsometric,
  validateFeedstockTypeForSync,
} from './feedstock';

export {
  transformProductionRunToIsometric,
  validateProductionRunForSync,
} from './production';

export {
  transformApplicationToStorageLocation,
  transformApplicationToBiocharApplication,
  validateApplicationForSync,
} from './application';

export {
  transformCreditBatchToRemoval,
  transformCreditBatchToGHGStatement,
  validateCreditBatchForSync,
  mapGHGStatementStatusToLocal,
} from './credit-batch';

export {
  // Single-source removal (legacy, backward compatible)
  mapRemovalTemplateComponents,
  mapComponentInputs,
  validateLocalDataForRemoval,
  getRemovalDataSummary,
  type RemovalLocalData,
  // Multi-source aggregated removal
  mapAggregatedRemovalTemplateComponents,
  mapAggregatedComponentInputs,
  validateAggregatedDataForRemoval,
  getAggregatedRemovalDataSummary,
  type AggregatedRemovalLocalData,
} from './removal';
