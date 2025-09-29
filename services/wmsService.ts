import { Item, ItemType, Locator, ValidationResult, UpdatePayload, ProcessIdentifierResult } from '../types';

// ===================================================================================
// == REALISTIC ICT MOCK DATA
// == Products are either tracked by SERIAL or BATCH, not both.
// == Pallets are containers, not items. Each pallet exists in only one location.
// == Warehouse zones are relevant to ICT (no cold storage).
// ===================================================================================

let mockItems: Item[] = [
    // === PHONES (SERIAL-TRACKED) ===
    // PAL-001 is entirely within locator A1-01
    { id: 'S001', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A11', currentLocator: 'A1-01', isSelected: false, palletId: 'PAL-001' },
    { id: 'S002', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A12', currentLocator: 'A1-01', isSelected: false, palletId: 'PAL-001' },
    { id: 'S003', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A13', currentLocator: 'A1-01', isSelected: false, palletId: 'PAL-001' },
    { id: 'S004', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A14', currentLocator: 'A1-01', isSelected: false, palletId: 'PAL-001' },
    { id: 'S005', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A15', currentLocator: 'A1-01', isSelected: false, palletId: 'PAL-001' },
    
    // Loose iPhones (no pallet) in A1-01
    { id: 'S006', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A16', currentLocator: 'A1-01', isSelected: false },
    { id: 'S007', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358A17', currentLocator: 'A1-01', isSelected: false },

    // PAL-002 is entirely within locator A1-02
    { id: 'S021', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B01', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S022', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B02', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S023', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B03', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S024', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B04', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S025', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B05', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S026', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B06', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S027', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B07', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },
    { id: 'S028', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356B08', currentLocator: 'A1-02', isSelected: false, palletId: 'PAL-002' },

    // === LAPTOPS (SERIAL-TRACKED) ===
    // PAL-003 is entirely within locator A1-03
    { id: 'S041', type: ItemType.SERIAL, code: 'DELL-XPS15', name: 'Dell XPS 15 Laptop', quantity: 1, expiryOrImei: 'SN-DXPS15-001', currentLocator: 'A1-03', isSelected: false, palletId: 'PAL-003' },
    { id: 'S042', type: ItemType.SERIAL, code: 'DELL-XPS15', name: 'Dell XPS 15 Laptop', quantity: 1, expiryOrImei: 'SN-DXPS15-002', currentLocator: 'A1-03', isSelected: false, palletId: 'PAL-003' },
    { id: 'S043', type: ItemType.SERIAL, code: 'DELL-XPS15', name: 'Dell XPS 15 Laptop', quantity: 1, expiryOrImei: 'SN-DXPS15-003', currentLocator: 'A1-03', isSelected: false, palletId: 'PAL-003' },
    
    // Loose laptops in B2-04
    { id: 'S051', type: ItemType.SERIAL, code: 'MS-SURF', name: 'Microsoft Surface Pro 9', quantity: 1, expiryOrImei: 'SN-MSSURF-0A1', currentLocator: 'B2-04', isSelected: false },
    { id: 'S052', type: ItemType.SERIAL, code: 'MS-SURF', name: 'Microsoft Surface Pro 9', quantity: 1, expiryOrImei: 'SN-MSSURF-0A2', currentLocator: 'B2-04', isSelected: false },

    // === ACCESSORIES (BATCH-TRACKED) ===
    // Airpods in bulk and picking face
    { id: 'B001', type: ItemType.BATCH, code: 'AIRPODSPRO', name: 'Apple Airpods Pro 2', quantity: 50, expiryOrImei: 'BATCH-AP2-24Q3', currentLocator: 'A1-01', isSelected: false },
    { id: 'B002', type: ItemType.BATCH, code: 'AIRPODSPRO', name: 'Apple Airpods Pro 2', quantity: 10, expiryOrImei: 'BATCH-AP2-24Q3', currentLocator: 'D2-PICK-01', isSelected: false },
    { id: 'B003', type: ItemType.BATCH, code: 'AIRPODSPRO', name: 'Apple Airpods Pro 2', quantity: 40, expiryOrImei: 'BATCH-AP2-24Q4', currentLocator: 'A1-02', isSelected: false },
    
    // Logitech Mouse
    { id: 'B011', type: ItemType.BATCH, code: 'LOGI-MX3', name: 'Logitech MX Master 3S', quantity: 30, expiryOrImei: 'BATCH-LMX-1123', currentLocator: 'C1-05', isSelected: false },
    { id: 'B012', type: ItemType.BATCH, code: 'LOGI-MX3', name: 'Logitech MX Master 3S', quantity: 8, expiryOrImei: 'BATCH-LMX-1123', currentLocator: 'D2-PICK-02', isSelected: false },

    // Samsung SSDs
    { id: 'B021', type: ItemType.BATCH, code: 'SS-EVO-1T', name: 'Samsung 970 EVO 1TB SSD', quantity: 25, expiryOrImei: 'BATCH-SSEVO-970A', currentLocator: 'C1-06', isSelected: false },
    { id: 'B022', type: ItemType.BATCH, code: 'SS-EVO-1T', name: 'Samsung 970 EVO 1TB SSD', quantity: 12, expiryOrImei: 'BATCH-SSEVO-970A', currentLocator: 'D2-PICK-03', isSelected: false },
    { id: 'B023', type: ItemType.BATCH, code: 'SS-EVO-1T', name: 'Samsung 970 EVO 1TB SSD', quantity: 25, expiryOrImei: 'BATCH-SSEVO-970B', currentLocator: 'C1-06', isSelected: false },
    
    // USB Cables
    { id: 'B031', type: ItemType.BATCH, code: 'ANKER-USBC', name: 'Anker USB-C Cable 2m', quantity: 100, expiryOrImei: 'BATCH-ANK-C2-001', currentLocator: 'B2-04', isSelected: false },

    // === SPECIAL ZONES ===
    // QC Zone
    { id: 'S098', type: ItemType.SERIAL, code: 'IP15PM', name: 'iPhone 15 Pro Max 256GB', quantity: 1, expiryOrImei: 'IMEI-358QC1', currentLocator: 'QC-01', isSelected: false },
    { id: 'B098', type: ItemType.BATCH, code: 'LOGI-MX3', name: 'Logitech MX Master 3S', quantity: 2, expiryOrImei: 'BATCH-LMX-QC', currentLocator: 'QC-01', isSelected: false },
    
    // RETURN Zone
    { id: 'S099', type: ItemType.SERIAL, code: 'GS24U', name: 'Galaxy S24 Ultra 512GB', quantity: 1, expiryOrImei: 'IMEI-356RET', currentLocator: 'RETURN-01', isSelected: false },
];

const mockLocators: Record<string, Locator> = {
    'A1-01': { id: 'A1-01', zone: 'A', capacity: 100, currentLoad: 57, allowsMix: true, isColdStorage: false },
    'A1-02': { id: 'A1-02', zone: 'A', capacity: 100, currentLoad: 48, allowsMix: true, isColdStorage: false },
    'A1-03': { id: 'A1-03', zone: 'A', capacity: 40, currentLoad: 3, allowsMix: false, isColdStorage: false },
    'B2-03': { id: 'B2-03', zone: 'B', capacity: 120, currentLoad: 0, allowsMix: false, isColdStorage: false },
    'B2-04': { id: 'B2-04', zone: 'B', capacity: 150, currentLoad: 102, allowsMix: true, isColdStorage: false },
    'C1-05': { id: 'C1-05', zone: 'C', capacity: 40, currentLoad: 30, allowsMix: true, isColdStorage: false },
    'C1-06': { id: 'C1-06', zone: 'C', capacity: 100, currentLoad: 50, allowsMix: true, isColdStorage: false },
    'C1-07': { id: 'C1-07', zone: 'C', capacity: 50, currentLoad: 0, allowsMix: true, isColdStorage: false },
    'C1-08': { id: 'C1-08', zone: 'C', capacity: 30, currentLoad: 0, allowsMix: true, isColdStorage: false },
    'D2-PICK-01': { id: 'D2-PICK-01', zone: 'PICK', capacity: 20, currentLoad: 10, allowsMix: false, isColdStorage: false },
    'D2-PICK-02': { id: 'D2-PICK-02', zone: 'PICK', capacity: 20, currentLoad: 8, allowsMix: false, isColdStorage: false },
    'D2-PICK-03': { id: 'D2-PICK-03', zone: 'PICK', capacity: 20, currentLoad: 12, allowsMix: false, isColdStorage: false },
    'QC-01': { id: 'QC-01', zone: 'QC', capacity: 100, currentLoad: 3, allowsMix: true, isColdStorage: false },
    'RETURN-01': { id: 'RETURN-01', zone: 'RETURN', capacity: 50, currentLoad: 1, allowsMix: true, isColdStorage: false },
    'E1-01': { id: 'E1-01', zone: 'E', capacity: 200, currentLoad: 0, allowsMix: true, isColdStorage: false },
    'E1-02': { id: 'E1-02', zone: 'E', capacity: 200, currentLoad: 0, allowsMix: true, isColdStorage: false },
};

// Internal helper function to find a pallet's location
const getPalletLocationSync = (palletId: string): string | null => {
    const itemOnPallet = mockItems.find(item => item.palletId?.toUpperCase() === palletId.toUpperCase());
    return itemOnPallet ? itemOnPallet.currentLocator : null;
};

export const wmsService = {
    fetchInventoryByLocator: async (locatorId: string): Promise<Item[]> => {
        console.log(`Fetching for ${locatorId}`);
        return new Promise(resolve =>
            setTimeout(() => {
                const results = mockItems.filter(item => item.currentLocator.toLowerCase() === locatorId.toLowerCase());
                resolve(JSON.parse(JSON.stringify(results)));
            }, 500)
        );
    },

    findAndProcessIdentifier: async (identifier: string): Promise<ProcessIdentifierResult> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const id = identifier.trim().toUpperCase();
                if (!id) {
                    resolve({ type: 'not_found' });
                    return;
                }

                // 1. Check for Pallet ID
                if (id.startsWith('PAL-')) {
                    const itemsOnPallet = mockItems.filter(item => item.palletId?.toUpperCase() === id);
                    if (itemsOnPallet.length > 0) {
                        resolve({ type: 'items', items: JSON.parse(JSON.stringify(itemsOnPallet)) });
                        return;
                    }
                }

                // 2. Check for Serial/IMEI
                const serialMatch = mockItems.find(item => item.type === ItemType.SERIAL && item.expiryOrImei?.toUpperCase() === id);
                if (serialMatch) {
                    resolve({ type: 'items', items: [JSON.parse(JSON.stringify(serialMatch))] });
                    return;
                }

                // 3. Check for Batch/Lot (requires quantity prompt)
                const batchMatches = mockItems.filter(item => item.type === ItemType.BATCH && item.expiryOrImei?.toUpperCase() === id);
                if (batchMatches.length > 0) {
                    resolve({ type: 'prompt_quantity', items: JSON.parse(JSON.stringify(batchMatches)) });
                    return;
                }

                // 4. Check for Product Code (get all of a certain type)
                const productMatches = mockItems.filter(item => item.code.toUpperCase() === id);
                if (productMatches.length > 0) {
                    // If all items of this product code are batches, prompt for quantity
                    const areAllBatches = productMatches.every(p => p.type === ItemType.BATCH);
                     if (areAllBatches) {
                         resolve({ type: 'prompt_quantity', items: JSON.parse(JSON.stringify(productMatches)) });
                         return;
                     }
                    // Otherwise, add all items (like serials) directly
                    resolve({ type: 'items', items: JSON.parse(JSON.stringify(productMatches)) });
                    return;
                }

                resolve({ type: 'not_found' });
            }, 300);
        });
    },
    
    getLocatorSuggestions: (item: Item): {locatorId: string, reason: string}[] => {
        // Simple suggestion logic for ICT items
        return [
            {locatorId: 'B2-03', reason: `Trống: ${mockLocators['B2-03'].capacity - mockLocators['B2-03'].currentLoad}u, Cấm trộn`},
            {locatorId: 'E1-01', reason: `Trống: ${mockLocators['E1-01'].capacity - mockLocators['E1-01'].currentLoad}u`},
            {locatorId: 'C1-07', reason: `Trống: ${mockLocators['C1-07'].capacity - mockLocators['C1-07'].currentLoad}u`},
        ];
    },

    validateMove: (item: { quantity: number, code: string }, destinationId: string): ValidationResult => {
        const upperDestinationId = destinationId.toUpperCase();
        const isPalletMove = upperDestinationId.startsWith('PAL-');
        
        let targetLocatorId: string | null = null;
        if (isPalletMove) {
            targetLocatorId = getPalletLocationSync(upperDestinationId);
            if (!targetLocatorId) {
                return { isValid: false, message: `Pallet '${upperDestinationId}' không tồn tại hoặc không có vị trí.`, shortMessage: 'Pallet lỗi', type: 'error' };
            }
        } else {
            targetLocatorId = upperDestinationId;
        }

        const locator = Object.values(mockLocators).find(l => l.id.toUpperCase() === targetLocatorId);

        if (!locator) {
            return { isValid: false, message: 'Vị trí không tồn tại.', shortMessage: 'Lỗi vị trí', type: 'error' };
        }
        if (locator.capacity - locator.currentLoad < item.quantity) {
            return { isValid: false, message: `Không đủ sức chứa. Cần ${item.quantity}, còn ${locator.capacity - locator.currentLoad}.`, shortMessage: 'Quá tải', type: 'error' };
        }
        
        if (!locator.allowsMix && locator.currentLoad > 0) {
            const existingItems = mockItems.filter(i => i.currentLocator === locator.id);
            if (existingItems.length > 0 && existingItems.some(i => i.code !== item.code)) {
                const message = `Cảnh báo: Vị trí cấm trộn đã có hàng khác loại.`;
                return { isValid: true, message: isPalletMove ? `Dồn vào Pallet ${upperDestinationId} (tại ${targetLocatorId}). ${message}` : message, shortMessage: 'Cấm trộn', type: 'warning' };
            }
        }
        
        if (locator.currentLoad > 0) {
            const message = 'Vị trí đích đã có hàng. Xác nhận để chuyển vào.';
            return { isValid: true, message: isPalletMove ? `Dồn vào Pallet ${upperDestinationId} (tại ${targetLocatorId}). ${message}` : message, shortMessage: 'Có hàng', type: 'warning' };
        }

        if(isPalletMove) {
            return { isValid: true, message: `Hợp lệ. Dồn vào Pallet ${upperDestinationId} (tại ${targetLocatorId}).`, shortMessage: 'Dồn Pallet', type: 'info' };
        }

        return { isValid: true, message: 'Hợp lệ.', shortMessage: 'Hợp lệ', type: 'info' };
    },

    applyUpdates: async (updates: UpdatePayload[]): Promise<void> => {
        return new Promise(resolve => {
            setTimeout(() => {
                
                // First, calculate load changes based on resolved locations
                updates.forEach(update => {
                    const oldLoc = Object.values(mockLocators).find(l => l.id.toLowerCase() === update.oldLocator.toLowerCase());
                    const item = mockItems.find(i => i.id === update.itemId);
                    if (!item) return;

                    const upperNewLocator = update.newLocator.toUpperCase();
                    const isPalletMove = upperNewLocator.startsWith('PAL-');
                    const destinationLocatorId = isPalletMove ? getPalletLocationSync(upperNewLocator) : upperNewLocator;
                    
                    if (!destinationLocatorId) {
                        console.error(`Destination not found for ${update.newLocator}`);
                        return;
                    }

                    const newLoc = Object.values(mockLocators).find(l => l.id.toUpperCase() === destinationLocatorId);

                    if (oldLoc && newLoc) {
                        oldLoc.currentLoad -= item.quantity;
                        newLoc.currentLoad += item.quantity;
                    }
                });

                // Then, update item properties
                const newMockItems = mockItems.map(item => {
                    const update = updates.find(u => u.itemId === item.id);
                    if (update) {
                        const upperNewLocator = update.newLocator.toUpperCase();
                        const isPalletMove = upperNewLocator.startsWith('PAL-');

                        const destinationLocatorId = isPalletMove ? getPalletLocationSync(upperNewLocator) : upperNewLocator;
                        const destinationPalletId = isPalletMove ? upperNewLocator : undefined;

                        if (!destinationLocatorId) {
                            return item; // Safeguard if location not found
                        }
                        
                        // This correctly assigns the new pallet ID or clears it if moving to a simple locator.
                        return { 
                            ...item, 
                            currentLocator: destinationLocatorId, 
                            palletId: destinationPalletId,
                            newLocator: '', 
                            isSelected: false, 
                            validation: undefined 
                        };
                    }
                    return item;
                });
                mockItems = newMockItems;
                console.log('DB Updated:', mockItems);
                console.log('Locators Updated:', mockLocators);
                resolve();
            }, 300);
        });
    },
    getPalletLocationSync,
};