
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPE DEFINITIONS ---
interface SerialDetail {
  id: string;
}

interface Product {
  id: string;
  type: 'PRODUCT';
  name: string;
  quantity: number; // Total available quantity
  serials?: SerialDetail[];
  selected: boolean;
  destinationLocation?: string;
  destinationPallet?: string;
}

interface TransferProduct extends Product {
    transferQuantity: number;
    transferSerials?: SerialDetail[];
    sourceDetail: string;
}

interface Pallet {
  id: string;
  type: 'PALLET';
  name: string;
  details: string;
  contents: Product[];
  selected: boolean;
  destinationLocation?: string;
  destinationPallet?: string;
}

interface TransferPallet extends Pallet {
    sourceDetail: string;
}

interface LotDistribution {
    location: string; // e.g. Pallet ID or 'Loose Stock'
    quantity: number;
}

interface Lot {
  id: string; // This will be the Lot ID, e.g. LOT_ABC_XYZ
  type: 'LOT';
  name: string; // Product name
  quantity: number; // Total quantity available in this lot
  distribution: LotDistribution[];
  selected: boolean;
  destinationLocation?: string;
  destinationPallet?: string;
}

interface LotAllocation extends LotDistribution {}

interface TransferLot extends Lot {
    transferQuantity: number;
    sourceDetail: string;
    allocations: LotAllocation[];
}

interface LocationOption {
    value: string;
    label: string;
    secondaryLabel?: string;
}

type TransferItem = TransferPallet | TransferProduct | TransferLot;
type SourceDataItem = Pallet | Product | Lot;


// --- MOCK DATA ---
const WAREHOUSE_DATA: Record<string, SourceDataItem[]> = {
  'A1-01-01': [
    { 
      id: 'PAL-20250811-001', type: 'PALLET', name: 'Pallet 001', details: '(2 SP, 51 đơn vị)', selected: false,
      contents: [
        { id: 'PROD-APACER-DDR4', type: 'PRODUCT', name: 'Apacer DDR4 DIMM 2666-19', quantity: 2, selected: false, serials: [{id: 'SN70071891'}, {id: 'SN70071892'}]},
        { id: 'PROD-ANKER-CHARGE-A13', type: 'PRODUCT', name: 'Sạc Anker 20W', quantity: 49, selected: false }
      ] 
    },
    { 
      id: 'PL112233', type: 'PALLET', name: 'Pallet 002', details: '(2 SP, 28 đơn vị)', selected: false,
      contents: [
        { id: 'PROD-KEYCHRON-K8', type: 'PRODUCT', name: 'Bàn phím cơ Keychron K8', quantity: 10, selected: false, serials: Array.from({length: 10}, (_, i) => ({id: `KC8-SN-00${i+1}`})) },
        { id: 'PROD-LOGI-MX3', type: 'PRODUCT', name: 'Chuột không dây Logitech MX Master 3', quantity: 18, selected: false }
      ]
    },
    { id: 'PROD-DELL-U2723QE', type: 'PRODUCT', name: 'Màn hình Dell U2723QE', quantity: 5, selected: false, serials: Array.from({length: 5}, (_, i) => ({id: `DELL-U27-SN-00${i+1}`})) },
    { 
      id: 'LOT_ABC_XYZ', type: 'LOT', name: 'Sạc Anker 20W', quantity: 150, selected: false, 
      distribution: [
        { location: 'PAL-20250811-001', quantity: 49 },
        { location: 'Hàng lẻ', quantity: 101 }
      ]
    },
  ],
  'A1-01-02': [
    { id: 'PROD-LOGI-M330', type: 'PRODUCT', name: 'Logitech Mouse M330', quantity: 20, selected: false, serials: Array.from({length: 20}, (_, i) => ({id: `M330-SN-00${i+1}`})) },
    { id: 'PROD-PIN-AA', type: 'PRODUCT', name: 'Pin tiểu AA (Hộp 100)', quantity: 10, selected: false },
  ],
  'C3-02-05': [
      { 
        id: 'PAL-20250812-003', type: 'PALLET', name: 'Pallet 003', details: '(1 SP, 200 đơn vị)', selected: false,
        contents: [
            { id: 'PROD-KINGSTON-FURY', type: 'PRODUCT', name: 'RAM Kingston Fury Beast 16GB', quantity: 200, selected: false }
        ]
      },
      { id: 'PROD-SSD-SAMSUNG-980', type: 'PRODUCT', name: 'Ổ cứng SSD Samsung 980 Pro 1TB', quantity: 30, selected: false, serials: Array.from({length: 30}, (_, i) => ({id: `SS980-SN-00${i+1}`})) },
      { id: 'PROD-IPHONE-15', type: 'PRODUCT', name: 'iPhone 15 Pro', quantity: 1, selected: false, serials: [{id: 'SN88776655'}] }
  ]
};

const MOCK_LOCATIONS = ['A1-01-01', 'A1-01-02', 'B2-03-04', 'PL445566', 'C3-02-05'];

const generateLocationOptions = (): LocationOption[] => {
    const options = new Map<string, LocationOption>();

    Object.keys(WAREHOUSE_DATA).forEach(location => {
        options.set(location, { value: location, label: location });
    });
    
    MOCK_LOCATIONS.forEach(location => {
        if (!options.has(location)) {
            options.set(location, { value: location, label: location });
        }
    });

    for (const location in WAREHOUSE_DATA) {
        for (const item of WAREHOUSE_DATA[location]) {
            if (item.type === 'PALLET') {
                options.set(item.id, { 
                    value: item.id, 
                    label: item.id, 
                    secondaryLabel: `(Tại: ${location})`
                });
            }
        }
    }

    return Array.from(options.values()).sort((a,b) => a.label.localeCompare(b.label));
};

const ALL_POSSIBLE_LOCATION_OPTIONS = generateLocationOptions();
const LOCATION_ONLY_OPTIONS: LocationOption[] = ALL_POSSIBLE_LOCATION_OPTIONS.filter(opt => !opt.value.startsWith('PAL-') && !opt.value.startsWith('PL'));
const PALLET_ONLY_OPTIONS: LocationOption[] = ALL_POSSIBLE_LOCATION_OPTIONS.filter(opt => opt.value.startsWith('PAL-') || opt.value.startsWith('PL'));


// --- HELPER & REUSABLE COMPONENTS ---

const Toast = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`toast toast-${type}`}>
            {message}
            <button onClick={onDismiss} className="toast-close-btn">&times;</button>
        </div>
    );
};

const SearchableCombobox = ({ options, value, onChange, placeholder, disabled = false }: { options: LocationOption[], value: string, onChange: (v: string) => void, placeholder: string, disabled?: boolean }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const selectedOption = options.find(opt => opt.value === value);
        setQuery(selectedOption ? selectedOption.label : value || '');
    }, [value, options]);

    const filteredOptions = useMemo(() => {
        if (!query) return options;
        const lowerCaseQuery = query.toLowerCase();
        return options.filter(opt => 
            opt.label.toLowerCase().includes(lowerCaseQuery) || 
            opt.secondaryLabel?.toLowerCase().includes(lowerCaseQuery)
        );
    }, [query, options]);
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                const selectedOption = options.find(opt => opt.value === value);
                const currentLabel = selectedOption ? selectedOption.label : value || '';
                if(query !== currentLabel) {
                    setQuery(currentLabel);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value, query, options]);
    
    const selectOption = (option: LocationOption) => {
        onChange(option.value);
        setQuery(option.label);
        setIsOpen(false);
    };

    return (
        <div className="combobox-wrapper" ref={wrapperRef}>
            <div className="input-group">
                 <span className='icon'>🔍</span>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        if(e.target.value === '') onChange('');
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setIsOpen(false); e.preventDefault(); } }}
                    disabled={disabled}
                />
            </div>
            {isOpen && !disabled && (
                <ul className="combobox-options">
                    {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                        <li key={opt.value} onClick={() => selectOption(opt)}>
                            <span>{opt.label}</span>
                            {opt.secondaryLabel && <small className="secondary-label">{opt.secondaryLabel}</small>}
                        </li>
                    )) : <li className="no-options">Không có kết quả</li>}
                </ul>
            )}
        </div>
    );
};

// --- MODAL COMPONENTS ---

const ItemActionModal = ({ item, onClose, onConfirm }) => {
    if (!item || item.type === 'LOT') return null; // Handled by LotAllocationModal

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Xác nhận thêm Pallet</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p><strong>Mã:</strong> {item.data.id}</p>
                    <p><strong>Tên:</strong> {item.data.name}</p>
                    <p>Bạn có chắc muốn thêm toàn bộ Pallet này vào danh sách chuyển không?</p>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Hủy</button>
                    <button onClick={() => onConfirm()} className="btn-primary">Xác nhận</button>
                </div>
            </div>
        </div>
    );
};

const LotAllocationModal = ({ lot, onClose, onConfirm }) => {
    const [totalToTransfer, setTotalToTransfer] = useState(lot.transferQuantity || 1);
    const [allocations, setAllocations] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        lot.allocations?.forEach(alloc => {
            initial[alloc.location] = alloc.quantity;
        });
        return initial;
    });
    const [error, setError] = useState('');

    const totalAllocated = useMemo(() => Object.values(allocations).reduce((sum, qty) => sum + (qty || 0), 0), [allocations]);
    const remainingToAllocate = totalToTransfer - totalAllocated;

    const handleAllocationChange = (location: string, value: number) => {
        const max = lot.distribution.find(d => d.location === location)?.quantity || 0;
        const newQty = Math.max(0, Math.min(max, value));
        setAllocations(prev => ({...prev, [location]: newQty}));
    };
    
    const handleConfirm = () => {
        if (totalToTransfer <= 0) {
            setError('Tổng số lượng chuyển phải lớn hơn 0.');
            return;
        }
        if (totalAllocated !== totalToTransfer) {
            setError(`Số lượng đã phân bổ (${totalAllocated}) không khớp với tổng số lượng cần chuyển (${totalToTransfer}).`);
            return;
        }
        const finalAllocations = Object.entries(allocations)
            .filter(([, qty]) => qty > 0)
            .map(([location, quantity]) => ({ location, quantity }));

        onConfirm(totalToTransfer, finalAllocations);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-lg">
                <div className="modal-header">
                    <h2>Phân bổ số lượng Lot: {lot.name} ({lot.id})</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group-column">
                        <label><strong>Tổng số lượng cần chuyển (Tồn kho: {lot.quantity})</strong></label>
                        <input type="number" value={totalToTransfer} onChange={e => setTotalToTransfer(Number(e.target.value))} min="1" max={lot.quantity} />
                    </div>
                    <div className="allocation-summary">
                        <span>Đã phân bổ: <strong>{totalAllocated}</strong></span>
                        <div className="progress-bar-container">
                             <div className="progress-bar" style={{width: `${(totalAllocated/totalToTransfer)*100}%`}}></div>
                        </div>
                        <span>Cần phân bổ: <strong>{remainingToAllocate}</strong></span>
                    </div>

                    <h3 className="modal-subtitle">Chi tiết tồn kho:</h3>
                    <div className="table-wrapper allocation-list">
                        <table>
                            <thead><tr><th>Vị trí chứa</th><th>Tồn kho</th><th>Số lượng lấy</th></tr></thead>
                            <tbody>
                                {lot.distribution.map(dist => (
                                    <tr key={dist.location}>
                                        <td>{dist.location}</td>
                                        <td>{dist.quantity}</td>
                                        <td><input type="number" value={allocations[dist.location] || ''} onChange={e => handleAllocationChange(dist.location, Number(e.target.value))} min="0" max={dist.quantity} placeholder="0"/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {error && <p className="error-text">{error}</p>}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Hủy</button>
                    <button onClick={handleConfirm} className="btn-primary" disabled={remainingToAllocate !== 0 || totalToTransfer <= 0}>Xác nhận phân bổ</button>
                </div>
            </div>
        </div>
    );
}

const SerialDetailModal = ({ product, onClose, onRemoveSerial }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredSerials = useMemo(() => {
        if (!searchTerm) return product.transferSerials || [];
        return product.transferSerials?.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase())) || [];
    }, [searchTerm, product.transferSerials]);
    
    return (
    <div className="modal-overlay">
        <div className="modal-content">
            <div className="modal-header">
                <h2>Chi tiết Serial: {product.name}</h2>
                <button onClick={onClose} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                <p><strong>Mã sản phẩm:</strong> {product.id}</p>
                <p><strong>Tổng số lượng chuyển:</strong> {product.transferQuantity}</p>
                 
                <div className="modal-toolbar">
                    <input type="text" placeholder="Tìm kiếm Serial..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                 
                <h3 className="modal-subtitle">Danh sách Serial Number đã thêm:</h3>
                <div className="table-wrapper serial-list">
                     <table>
                        <thead>
                            <tr><th>No.</th><th>Serial Number</th><th>Tác vụ</th></tr>
                        </thead>
                        <tbody>
                            {filteredSerials.length > 0 ? filteredSerials.map((serial, index) => (
                                <tr key={serial.id}>
                                    <td>{index + 1}</td>
                                    <td>{serial.id}</td>
                                    <td className='actions-cell'>
                                        <button className="trash-btn" onClick={() => onRemoveSerial(product.id, serial.id)} title="Xóa Serial">🗑️</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="empty-table-message">
                                    {product.transferSerials?.length === 0 ? "Chưa có serial nào." : "Không tìm thấy serial."}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="modal-footer">
                <button onClick={onClose} className="btn-primary">Đóng</button>
            </div>
        </div>
    </div>
)};


const PalletDetailModal = ({ pallet, onClose }) => {
    const [productForSerials, setProductForSerials] = useState<Product | null>(null);

    return (
    <>
    <div className="modal-overlay">
        <div className="modal-content modal-lg">
            <div className="modal-header">
                <h2>Chi tiết Pallet: {pallet.id}</h2>
                <button onClick={onClose} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
                <p><strong>Tên Pallet:</strong> {pallet.name}</p>
                <p><strong>Chi tiết:</strong> {pallet.details}</p>
                <h3 className="modal-subtitle">Hàng hóa bên trong:</h3>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã SP</th>
                                <th>Tên Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pallet.contents?.length > 0 ? pallet.contents.map(content => (
                                <tr key={content.id}>
                                    <td>{content.id}</td>
                                    <td>{content.name}</td>
                                    <td>{content.quantity}</td>
                                    <td>
                                        {content.serials && content.serials.length > 0 && (
                                             <button className="btn-link" onClick={() => setProductForSerials(content)}>
                                                (Xem Serial Numbers)
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="empty-table-message">Pallet rỗng.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="modal-footer">
                <button onClick={onClose} className="btn-primary">Đóng</button>
            </div>
        </div>
    </div>
    {productForSerials && (
        <SerialDetailModal product={{...productForSerials, transferQuantity: productForSerials.quantity, transferSerials: productForSerials.serials}} onClose={() => setProductForSerials(null)} onRemoveSerial={() => {}} />
    )}
    </>
    );
}

const TransferSummary = ({ summaryData, sourceLocation, onNewTransfer }) => (
    <div className="app-container summary-view">
        <header className="summary-header">
            <div className="summary-title">
                <span className="success-icon">✅</span>
                <h1>Chuyển vị trí thành công!</h1>
            </div>
            <div className="summary-actions no-print">
                <button className="btn-secondary" onClick={() => window.print()}>🖨️ In Phiếu</button>
                <button className="btn-primary" onClick={onNewTransfer}>Thực hiện chuyển kho khác</button>
            </div>
        </header>
        <main className="card">
            <div className="summary-details">
                <p><strong>Ngày thực hiện:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Từ vị trí nguồn:</strong> <span className="location-tag">{sourceLocation}</span></p>
            </div>
            <table>
                <thead>
                    <tr><th>No</th><th>Mã Pallet/Sản phẩm</th><th>Tên / Chi tiết</th><th>SL Đã Chuyển</th><th>Từ Nguồn Chi Tiết</th><th>Đến Vị Trí Đích</th></tr>
                </thead>
                <tbody>
                    {summaryData.map((item, index) => (
                        <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.id}</td>
                            <td>{item.name}<br/><small style={{color: 'var(--text-muted)'}}>{item.type === 'PALLET' ? (item as TransferPallet).details : `SL: ${(item as TransferProduct | TransferLot).transferQuantity}`}</small></td>
                            <td>{item.type === 'PALLET' ? 'Toàn bộ' : (item.type === 'LOT' ? (item as TransferLot).transferQuantity : (item as TransferProduct).transferQuantity)}</td>
                            <td>{item.sourceDetail}</td>
                            <td><span className="location-tag">{item.destinationLocation || item.destinationPallet}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    </div>
);


const App = () => {
  const [view, setView] = useState<'form' | 'summary'>('form');
  const [sourceLocation, setSourceLocation] = useState('');
  const [itemsToTransfer, setItemsToTransfer] = useState<TransferItem[]>([]);
  const [individualItemCode, setIndividualItemCode] = useState('');
  const [bulkDestination, setBulkDestination] = useState('');
    
  const [palletDetailModalItem, setPalletDetailModalItem] = useState<TransferPallet | null>(null);
  const [serialDetailModalItem, setSerialDetailModalItem] = useState<TransferProduct | null>(null);
  const [lotAllocationModalItem, setLotAllocationModalItem] = useState<TransferLot | null>(null);

  const [itemAction, setItemAction] = useState<{type: 'PALLET' | 'LOT', data: Pallet | Lot, existingItem?: TransferLot} | null>(null);


  const [transferSummary, setTransferSummary] = useState<TransferItem[] | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const selectedItemsCount = itemsToTransfer.filter(item => item.selected).length;
  const isConfirmDisabled = itemsToTransfer.length === 0 || itemsToTransfer.some(item => !item.destinationLocation && !item.destinationPallet);

  const resetForm = () => {
    setSourceLocation('');
    setItemsToTransfer([]);
    setIndividualItemCode('');
    setBulkDestination('');
    setPalletDetailModalItem(null);
    setSerialDetailModalItem(null);
    setLotAllocationModalItem(null);
    setTransferSummary(null);
  };

  useEffect(() => {
    setItemsToTransfer([]); 
  }, [sourceLocation]);

  const handleAddAllItems = () => {
    if (!sourceLocation) return;
    const itemsFromSource = WAREHOUSE_DATA[sourceLocation] || [];
    const currentIds = new Set(itemsToTransfer.map(i => i.id));
    
    const newItems: TransferItem[] = itemsFromSource
        .filter(item => !currentIds.has(item.id))
        .map(item => {
            if (item.type === 'PALLET') {
                return { ...item, selected: false, destinationLocation: '', destinationPallet: '', sourceDetail: sourceLocation };
            }
            if (item.type === 'PRODUCT') {
                 return { ...item, selected: false, destinationLocation: '', destinationPallet: '', sourceDetail: sourceLocation, transferQuantity: item.quantity, transferSerials: item.serials };
            }
            // LOT
            return { ...item, selected: false, destinationLocation: '', destinationPallet: '', sourceDetail: sourceLocation, transferQuantity: item.quantity, allocations: [] };
        });

    if (newItems.length > 0) {
        setItemsToTransfer(prev => [...prev, ...newItems]);
        setToast({ message: `Đã thêm ${newItems.length} mục mới từ vị trí ${sourceLocation}.`, type: 'success'});
    } else {
        setToast({ message: `Tất cả các mục từ ${sourceLocation} đã có trong danh sách.`, type: 'error'});
    }
  };

  const findItemByCodeInSource = (code: string, source: string): {type: 'PALLET' | 'LOT' | 'SERIAL' | 'PRODUCT', data: Pallet | Product | Lot, serialId?: string} | null => {
        const sourceItems = WAREHOUSE_DATA[source] || [];
        
        const directMatch = sourceItems.find(item => item.id.toLowerCase() === code.toLowerCase());
        if (directMatch) {
            return { type: directMatch.type as 'PALLET' | 'LOT' | 'PRODUCT', data: directMatch };
        }

        for (const item of sourceItems) {
            const productsToCheck: Product[] = [];
            if (item.type === 'PRODUCT') {
                productsToCheck.push(item as Product);
            } else if (item.type === 'PALLET') {
                productsToCheck.push(...(item as Pallet).contents);
            }

            for(const product of productsToCheck) {
                if (product.serials?.some(s => s.id.toLowerCase() === code.toLowerCase())) {
                    return { type: 'SERIAL', data: product, serialId: code };
                }
            }
        }
        return null;
    };

    const isSerialAlreadyInTransfer = (serialId: string): boolean => {
        for (const item of itemsToTransfer) {
            if (item.type === 'PALLET') {
                for (const prod of (item as TransferPallet).contents) {
                    if (prod.serials?.some(s => s.id.toLowerCase() === serialId.toLowerCase())) return true;
                }
            } else if (item.type === 'PRODUCT' && (item as TransferProduct).transferSerials) {
                if ((item as TransferProduct).transferSerials?.some(s => s.id.toLowerCase() === serialId.toLowerCase())) return true;
            }
        }
        return false;
    };

  const handleAddIndividualItem = () => {
    if (!individualItemCode || !sourceLocation) return;
    
    const result = findItemByCodeInSource(individualItemCode, sourceLocation);

    if (!result) {
        setToast({ message: `Không tìm thấy mã "${individualItemCode}" tại vị trí nguồn.`, type: 'error' });
        return;
    }

    const existingItem = itemsToTransfer.find(i => i.id.toLowerCase() === result.data.id.toLowerCase());

    if (result.type === 'PALLET') {
        if (existingItem) {
            setToast({ message: `Pallet ${result.data.id} đã có trong danh sách.`, type: 'error' });
            return;
        }
        setItemAction({ type: result.type, data: result.data as Pallet });
    } else if (result.type === 'LOT') {
        setLotAllocationModalItem({
            ...(result.data as Lot),
            ...(existingItem as TransferLot), // Pre-fill existing data if any
            transferQuantity: (existingItem as TransferLot)?.transferQuantity || 1,
            allocations: (existingItem as TransferLot)?.allocations || [],
            sourceDetail: sourceLocation,
            selected: false,
            destinationLocation: '',
            destinationPallet: '',
        });
    } else if (result.type === 'SERIAL') {
        if (isSerialAlreadyInTransfer(result.serialId!)) {
            setToast({ message: `Serial ${result.serialId} đã được thêm.`, type: 'error' });
            return;
        }

        const parentProduct = result.data as Product;
        const existingProductInTransfer = itemsToTransfer.find(i => i.id === parentProduct.id) as TransferProduct | undefined;

        if (existingProductInTransfer) {
            updateItem(parentProduct.id, {
                transferQuantity: existingProductInTransfer.transferQuantity + 1,
                transferSerials: [...(existingProductInTransfer.transferSerials || []), { id: result.serialId! }]
            });
        } else {
            const newProduct: TransferProduct = {
                ...parentProduct,
                transferQuantity: 1,
                transferSerials: [{ id: result.serialId! }],
                sourceDetail: sourceLocation,
                selected: false,
                destinationLocation: '',
                destinationPallet: '',
            };
            setItemsToTransfer(prev => [...prev, newProduct]);
        }
        setToast({ message: `Đã thêm Serial: ${result.serialId}`, type: 'success' });
        setIndividualItemCode('');

    } else if (result.type === 'PRODUCT') {
        setToast({ message: `Vui lòng quét Serial Number để thêm sản phẩm lẻ.`, type: 'error' });
    }
  };

  const handleConfirmItemAction = () => {
    if (!itemAction) return;

    const { type, data } = itemAction;

    if (type === 'PALLET') {
      const newItem: TransferPallet = { ...(data as Pallet), selected: false, destinationLocation: '', destinationPallet: '', sourceDetail: sourceLocation };
      setItemsToTransfer(prev => [...prev, newItem]);
      setToast({ message: `Đã thêm Pallet: ${newItem.id}`, type: 'success' });
    }
    
    setIndividualItemCode('');
    setItemAction(null);
  };

  const handleConfirmLotAllocation = (totalQuantity: number, allocations: LotAllocation[]) => {
      if(!lotAllocationModalItem) return;

      const existingItem = itemsToTransfer.find(i => i.id === lotAllocationModalItem.id);

      if(existingItem) {
          updateItem(lotAllocationModalItem.id, { transferQuantity: totalQuantity, allocations });
          setToast({ message: `Đã cập nhật SL Lot: ${lotAllocationModalItem.id}`, type: 'success' });
      } else {
          const newItem: TransferLot = { 
              ...lotAllocationModalItem, 
              transferQuantity: totalQuantity, 
              allocations: allocations, 
              selected: false, 
              destinationLocation: '',
              destinationPallet: '', 
              sourceDetail: sourceLocation 
          };
          setItemsToTransfer(prev => [...prev, newItem]);
          setToast({ message: `Đã thêm Lot: ${newItem.id}`, type: 'success' });
      }

      setLotAllocationModalItem(null);
      setIndividualItemCode('');
  };

  const handleRemoveSerial = (productId: string, serialId: string) => {
      setItemsToTransfer(prev => {
          const newItems = [...prev];
          const productIndex = newItems.findIndex(item => item.id === productId);
          
          if(productIndex > -1) {
              const product = newItems[productIndex] as TransferProduct;
              const newQuantity = product.transferQuantity - 1;
              
              if(newQuantity === 0) {
                  // Remove the product entirely
                  newItems.splice(productIndex, 1);
                  setSerialDetailModalItem(null); // Close modal
              } else {
                  // FIX: Explicitly type updatedProduct to avoid type inference issues with spread syntax on discriminated unions.
                  // Update the product
                  const updatedProduct: TransferProduct = {
                      ...product,
                      transferQuantity: newQuantity,
                      transferSerials: product.transferSerials?.filter(s => s.id !== serialId)
                  };
                  newItems[productIndex] = updatedProduct;
                  setSerialDetailModalItem(updatedProduct); // Update modal view
              }
          }
          return newItems;
      });
  };

  const updateItem = (id: string, updates: Partial<TransferItem>) => {
    // FIX: Add type assertion to prevent TypeScript from widening the type of the spread object,
    // which causes issues with discriminated unions.
    setItemsToTransfer(prev => prev.map(item => (item.id === id ? { ...item, ...updates } as TransferItem : item)));
  };
  
  const handleRemoveItem = (id: string) => {
    setItemsToTransfer(prev => prev.filter(item => item.id !== id));
  };
  
  const handleApplyBulkDestination = () => {
    if (!bulkDestination) return;
    const isPallet = PALLET_ONLY_OPTIONS.some(p => p.value === bulkDestination);
    const updates = isPallet 
        ? { destinationPallet: bulkDestination, destinationLocation: '' }
        : { destinationLocation: bulkDestination, destinationPallet: '' };

    // FIX: Add type assertion to prevent TypeScript from widening the type of the spread object.
    setItemsToTransfer(prev => 
        prev.map(item => item.selected ? { ...item, ...updates } as TransferItem : item)
    );
    setBulkDestination('');
  };

  const handleSelectAllInList = (isChecked: boolean) => {
      // FIX: Add type assertion to prevent TypeScript from widening the type of the spread object.
      setItemsToTransfer(prev => prev.map(item => ({...item, selected: isChecked} as TransferItem)));
  };

  const handleConfirmTransfer = () => {
      if (isConfirmDisabled) return;
      setTransferSummary(itemsToTransfer.filter(item => item.destinationLocation || item.destinationPallet));
      setView('summary');
  };
  
  const handleStartNewTransfer = () => {
      resetForm();
      setView('form');
  };

  if (view === 'summary' && transferSummary) {
      return <TransferSummary summaryData={transferSummary} sourceLocation={sourceLocation} onNewTransfer={handleStartNewTransfer} />;
  }

  return (
    <div className="app-container">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        
        <ItemActionModal item={itemAction} onClose={() => setItemAction(null)} onConfirm={handleConfirmItemAction} />

        {palletDetailModalItem && (
            <PalletDetailModal pallet={palletDetailModalItem} onClose={() => setPalletDetailModalItem(null)} />
        )}
        {serialDetailModalItem && (
            <SerialDetailModal product={serialDetailModalItem} onClose={() => setSerialDetailModalItem(null)} onRemoveSerial={handleRemoveSerial}/>
        )}
        {lotAllocationModalItem && (
            <LotAllocationModal lot={lotAllocationModalItem} onClose={() => setLotAllocationModalItem(null)} onConfirm={handleConfirmLotAllocation} />
        )}

        <header>
            <h1>CHUYỂN VỊ TRÍ HÀNG HÓA</h1>
            <button className="btn-primary" disabled={isConfirmDisabled} onClick={handleConfirmTransfer}>
                XÁC NHẬN CHUYỂN VỊ TRÍ ({itemsToTransfer.filter(i => i.destinationLocation || i.destinationPallet).length})
            </button>
        </header>

        <div className="wms-container">
            <aside className="left-panel card">
                <div className="form-section">
                    <h2 className="card-title">1. Chọn Vị trí Nguồn</h2>
                    <SearchableCombobox 
                        options={Object.keys(WAREHOUSE_DATA).map(loc => ({value: loc, label: loc}))}
                        value={sourceLocation}
                        onChange={setSourceLocation}
                        placeholder="Chọn hoặc tìm vị trí nguồn..."
                    />
                </div>
                
                {sourceLocation && (
                  <div className="form-section-dynamic">
                    <h2 className="card-title">2. Thao tác tại <span className="source-location-highlight">{sourceLocation}</span></h2>
                     <button className="btn-secondary btn-full-width" onClick={handleAddAllItems}>
                        Thêm tất cả hàng hóa từ nguồn
                    </button>
                    <div className="form-group-column">
                        <label>Thêm Pallet/SN/Lot (chọn lẻ):</label>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddIndividualItem(); }} className="form-group">
                            <input type="text" value={individualItemCode} onChange={e => setIndividualItemCode(e.target.value)} placeholder="Quét hoặc nhập mã..." />
                            <button type="submit" className="btn-secondary">Thêm</button>
                        </form>
                    </div>
                  </div>
                )}
            </aside>
            <main className="right-panel card">
                <h2 className="card-title">3. Danh sách Hàng hóa cần chuyển</h2>
                {itemsToTransfer.some(i => i.selected) && (
                    <div className="bulk-actions">
                        <span>Đã chọn: <strong>{selectedItemsCount}</strong></span>
                        <div className="bulk-dest-group">
                            <label>Áp dụng đích hàng loạt:</label>
                            <SearchableCombobox options={ALL_POSSIBLE_LOCATION_OPTIONS} value={bulkDestination} onChange={setBulkDestination} placeholder="Nhập/chọn đích..." />
                            <button className="btn-primary" onClick={handleApplyBulkDestination}>Áp dụng</button>
                        </div>
                    </div>
                )}
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th><input type="checkbox" onChange={e => handleSelectAllInList(e.target.checked)} checked={itemsToTransfer.length > 0 && itemsToTransfer.every(i => i.selected)} /></th>
                                <th>Trạng thái</th>
                                <th>Mã Pallet/SP/Lot</th>
                                <th>Tên / Chi tiết</th>
                                <th>Số lượng</th>
                                <th>Nguồn Chi tiết</th>
                                <th><strong>Vị trí đích</strong></th>
                                <th><strong>Pallet đích</strong></th>
                                <th>Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsToTransfer.length > 0 ? itemsToTransfer.map((item) => {
                                const transferQty = item.type === 'PALLET' ? 'Toàn bộ' : (item as TransferProduct | TransferLot).transferQuantity;
                                const hasDestination = !!(item.destinationLocation || item.destinationPallet);
                                return (
                                <tr key={item.id}>
                                    <td><input type="checkbox" checked={item.selected} onChange={e => updateItem(item.id, { selected: e.target.checked })} /></td>
                                    <td><span className={`status-indicator ${hasDestination ? 'status-ready' : 'status-pending'}`} title={hasDestination ? 'Sẵn sàng' : 'Chưa có đích'}></span></td>
                                    <td>{item.id}</td>
                                    <td>
                                        {item.name}
                                        {item.type === 'PALLET' && (
                                            <button className="btn-link" onClick={() => setPalletDetailModalItem(item as TransferPallet)}>(Xem chi tiết)</button>
                                        )}
                                        {item.type === 'PRODUCT' && (
                                            <button className="btn-link" onClick={() => setSerialDetailModalItem(item as TransferProduct)}>(Xem Serials)</button>
                                        )}
                                        <br/><small className="description-text">
                                            {item.type === 'PALLET' ? (item as TransferPallet).details : 
                                             item.type === 'LOT' ? `Lot ID: ${item.id}` : 
                                             `SL Tồn Kho: ${item.quantity}`}
                                        </small>
                                    </td>
                                    <td className="quantity-cell">
                                        {item.type === 'LOT' ? (
                                             <button className="btn-link" onClick={() => setLotAllocationModalItem(item as TransferLot)}>
                                                {transferQty}
                                            </button>
                                        ) : (
                                            transferQty
                                        )}
                                    </td>
                                    <td>{item.sourceDetail}</td>
                                    <td>
                                        <SearchableCombobox 
                                            options={LOCATION_ONLY_OPTIONS} 
                                            value={item.destinationLocation || ''} 
                                            onChange={(val) => updateItem(item.id, { destinationLocation: val, destinationPallet: '' })} 
                                            placeholder="Chọn vị trí..."
                                            disabled={!!item.destinationPallet}
                                        />
                                    </td>
                                     <td>
                                        <SearchableCombobox 
                                            options={PALLET_ONLY_OPTIONS} 
                                            value={item.destinationPallet || ''} 
                                            onChange={(val) => updateItem(item.id, { destinationPallet: val, destinationLocation: '' })} 
                                            placeholder="Chọn pallet..."
                                            disabled={!!item.destinationLocation}
                                        />
                                    </td>
                                    <td className="actions-cell">
                                        <button className="trash-btn" onClick={() => handleRemoveItem(item.id)} title="Xóa">🗑️</button>
                                    </td>
                                </tr>
                                )}
                            ) : (
                                <tr><td colSpan={9} className="empty-table-message">Chọn một vị trí nguồn và thêm hàng hóa để bắt đầu.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);