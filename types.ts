export enum View {
  BY_LOCATOR = 'BY_LOCATOR',
  BY_ITEM = 'BY_ITEM',
}

export enum ItemType {
  SKU = 'SKU',
  BATCH = 'Batch',
  SERIAL = 'SN',
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  shortMessage?: string;
  type?: 'warning' | 'error' | 'info';
}

export interface Item {
  id: string;
  type: ItemType;
  code: string;
  name: string;
  quantity: number;
  expiryOrImei?: string;
  currentLocator: string;
  newLocator?: string;
  isSelected: boolean;
  validation?: ValidationResult;
  sourceItemId?: string; // To trace back to the original item when splitting quantities
  palletId?: string;
}

export interface AggregatedProductLine {
  productCode: string;
  productName: string;
  totalQuantity: number;
  sourceLocators: string[];
  individualItems: Item[];
  isSelected: boolean;
  newLocator?: string;
  validation?: ValidationResult;
}

export type ProcessIdentifierResult =
  | { type: 'items'; items: Item[] }
  | { type: 'prompt_quantity'; items: Item[] }
  | { type: 'not_found' };


export interface Locator {
  id: string;
  zone: string;
  capacity: number;
  currentLoad: number;
  allowsMix: boolean;
  isColdStorage: boolean;
}

export interface LocatorSuggestion {
  locatorId: string;
  reason: string;
}

export interface ToastState {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onUndo?: () => void;
}

export interface UpdatePayload {
    itemId: string;
    oldLocator: string;
    newLocator: string;
}