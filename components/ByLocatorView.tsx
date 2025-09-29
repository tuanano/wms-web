import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Item, ValidationResult, AggregatedProductLine } from '../types';
import { wmsService } from '../services/wmsService';
import { ICONS } from '../constants';
import { SerialDetailModal } from './SerialDetailModal';

interface ByLocatorViewProps {
  onConfirm: (items: Item[]) => void;
  updateCount: number;
}

const renderValidationChip = (validation?: ValidationResult) => {
    if (!validation) return null;

    const type = validation.type || 'info';

    const config = {
        info: {
            icon: React.cloneElement(ICONS.CHECK_VALID, { className: "h-4 w-4" }),
            style: "text-green-700 bg-green-100",
        },
        warning: {
            icon: React.cloneElement(ICONS.WARNING, { className: "h-4 w-4" }),
            style: "text-yellow-700 bg-yellow-100",
        },
        error: {
            icon: React.cloneElement(ICONS.ERROR, { className: "h-4 w-4" }),
            style: "text-red-700 bg-red-100",
        }
    }[type];

    return (
        <div className={`flex items-center space-x-1 ${config.style} px-2 py-0.5 rounded-full text-xs font-medium`} title={validation.message}>
            {config.icon}
            <span>{validation.shortMessage}</span>
        </div>
    );
};

export const ByLocatorView: React.FC<ByLocatorViewProps> = ({ onConfirm, updateCount }) => {
    const [sourceLocator, setSourceLocator] = useState('A1-01');
    const [productLines, setProductLines] = useState<AggregatedProductLine[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [targetLocator, setTargetLocator] = useState('');
    const sourceLocatorInputRef = useRef<HTMLInputElement>(null);
    const [serialDetail, setSerialDetail] = useState<{ isOpen: boolean; line: AggregatedProductLine | null }>({ isOpen: false, line: null });

    const aggregateInventory = (items: Item[]): AggregatedProductLine[] => {
        const lineMap = new Map<string, AggregatedProductLine>();
        items.forEach(item => {
            let line = lineMap.get(item.code);
            if (line) {
                line.individualItems.push(item);
                line.totalQuantity += item.quantity;
            } else {
                lineMap.set(item.code, {
                    productCode: item.code,
                    productName: item.name,
                    totalQuantity: item.quantity,
                    sourceLocators: [item.currentLocator],
                    individualItems: [item],
                    isSelected: false,
                    newLocator: '',
                    validation: undefined,
                });
            }
        });
        return Array.from(lineMap.values());
    };

    const fetchInventory = useCallback(async () => {
        if (!sourceLocator) {
            setProductLines([]);
            return;
        };
        setIsLoading(true);
        const data = await wmsService.fetchInventoryByLocator(sourceLocator);
        setProductLines(aggregateInventory(data));
        setIsLoading(false);
    }, [sourceLocator]);
    
    useEffect(() => {
        fetchInventory();
    }, [fetchInventory, updateCount]);

    useEffect(() => {
        if (updateCount > 0) {
            sourceLocatorInputRef.current?.focus();
            sourceLocatorInputRef.current?.select();
        }
    }, [updateCount]);


    const handleSelectionChange = (productCode: string) => {
        setProductLines(prev => prev.map(line => line.productCode === productCode ? { ...line, isSelected: !line.isSelected } : line));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isSelected = e.target.checked;
        setProductLines(prev => prev.map(item => ({ ...item, isSelected })));
    };

    const handleNewLocatorChange = (productCode: string, newLocator: string) => {
        setProductLines(prev => prev.map(line => {
            if (line.productCode === productCode) {
                if (!newLocator) {
                    return { ...line, newLocator: '', validation: undefined };
                }
                const validation = wmsService.validateMove({quantity: line.totalQuantity, code: line.productCode}, newLocator);
                return { ...line, newLocator, validation };
            }
            return line;
        }));
    };
    
    const handleApplyTargetLocator = useCallback(() => {
        if (!targetLocator) return;
        const upperCaseLocator = targetLocator.toUpperCase();
        setProductLines(prev => prev.map(line => {
            if (line.isSelected) {
                const validation = wmsService.validateMove({quantity: line.totalQuantity, code: line.productCode}, upperCaseLocator);
                return { ...line, newLocator: upperCaseLocator, validation };
            }
            return line;
        }));
    }, [targetLocator]);
    
    const isAllSelected = useMemo(() => productLines.length > 0 && productLines.every(item => item.isSelected), [productLines]);
    const selectedLinesCount = useMemo(() => productLines.filter(line => line.isSelected).length, [productLines]);

    const handleLocalConfirm = useCallback(() => {
        const allItemsToUpdate: Item[] = [];
        productLines.forEach(line => {
            if (line.newLocator && line.validation?.isValid) {
                line.individualItems.forEach(item => {
                    allItemsToUpdate.push({
                        ...item,
                        newLocator: line.newLocator,
                        validation: line.validation
                    });
                });
            }
        });
        onConfirm(allItemsToUpdate);
    }, [productLines, onConfirm]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                handleLocalConfirm();
            }
             if (event.altKey && event.key === 's') {
                event.preventDefault();
                handleApplyTargetLocator();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleLocalConfirm, handleApplyTargetLocator]);


    return (
        <>
            {serialDetail.line && (
                <SerialDetailModal
                    isOpen={serialDetail.isOpen}
                    onClose={() => setSerialDetail({ isOpen: false, line: null })}
                    line={serialDetail.line}
                />
            )}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col h-full">
                {/* Top section for source locator input */}
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b">
                     <label htmlFor="source-locator" className="font-semibold text-slate-700">Vị trí nguồn:</label>
                     <input 
                        ref={sourceLocatorInputRef}
                        id="source-locator"
                        type="text" 
                        value={sourceLocator}
                        onChange={(e) => setSourceLocator(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                        placeholder="Tìm Vị trí (VD: A1-01)"
                        className="p-2 border rounded-md w-1/3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={fetchInventory} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 flex items-center space-x-2">
                        {ICONS.SEARCH}
                        <span>Tìm</span>
                    </button>
                </div>

                {/* Main grid for inventory details */}
                <div className="flex-grow overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="p-2 w-12"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                <th className="p-2">Mã sản phẩm</th>
                                <th className="p-2">Tên sản phẩm</th>
                                <th className="p-2">Tổng SL</th>
                                <th className="p-2">Vị trí hiện tại</th>
                                <th className="p-2">Chi tiết Lô/IMEI</th>
                                <th className="p-2">Vị trí mới</th>
                                <th className="p-2">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                             {productLines.map(line => (
                                <tr key={line.productCode} className={`${line.isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-2 text-center"><input type="checkbox" checked={line.isSelected} onChange={() => handleSelectionChange(line.productCode)} /></td>
                                    <td className="p-2 font-medium">{line.productCode}</td>
                                    <td className="p-2">{line.productName}</td>
                                    <td className="p-2 text-center font-bold">{line.totalQuantity}</td>
                                    <td className="p-2"><span className="bg-slate-200 px-2 py-1 rounded">{line.sourceLocators[0]}</span></td>
                                     <td className="p-2">
                                        <button onClick={() => setSerialDetail({ isOpen: true, line })} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">
                                            Xem chi tiết ({line.individualItems.length})
                                        </button>
                                     </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={line.newLocator || ''}
                                            onChange={(e) => handleNewLocatorChange(line.productCode, e.target.value.toUpperCase())}
                                            className={`w-24 p-1 border rounded-md text-sm ${line.validation?.type === 'error' ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                        />
                                    </td>
                                    <td className="p-2">{renderValidationChip(line.validation)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {productLines.length === 0 && !isLoading && <p className="text-center text-slate-500 py-8">Vị trí trống hoặc không tồn tại.</p>}
                     {isLoading && <p className="text-center text-slate-500 py-8">Đang tải...</p>}
                </div>
                
                {/* Bottom action bar */}
                <div className="pt-4 border-t mt-4 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <input
                            id="target-locator"
                            type="text"
                            value={targetLocator}
                            onChange={(e) => setTargetLocator(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyTargetLocator()}
                            placeholder="Nhập vị trí mới..."
                            className="p-2 border rounded-md"
                        />
                         <button 
                            onClick={handleApplyTargetLocator} 
                            disabled={selectedLinesCount === 0 || !targetLocator}
                            className="bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-md hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                            title="Áp dụng vị trí đích cho các dòng đã chọn"
                        >
                            Áp dụng cho mục đã chọn
                        </button>
                    </div>
                    <button onClick={handleLocalConfirm} className="w-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                        Xác nhận cập nhật
                    </button>
                </div>
            </div>
        </>
    );
};