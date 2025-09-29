import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Item, AggregatedProductLine, ValidationResult } from '../types';
import { wmsService } from '../services/wmsService';
import { ICONS } from '../constants';
import { QuantityPromptModal } from './QuantityPromptModal';
import { SerialDetailModal } from './SerialDetailModal';

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


export const ByItemView: React.FC<{ onConfirm: (items: Item[]) => void, updateCount: number }> = ({ onConfirm, updateCount }) => {
    const [identifier, setIdentifier] = useState('');
    const [productLines, setProductLines] = useState<AggregatedProductLine[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [targetLocator, setTargetLocator] = useState('');
    const [notFound, setNotFound] = useState(false);
    const [quantityPrompt, setQuantityPrompt] = useState<{ isOpen: boolean; items: Item[] }>({ isOpen: false, items: [] });
    const [serialDetail, setSerialDetail] = useState<{ isOpen: boolean; line: AggregatedProductLine | null }>({ isOpen: false, line: null });
    
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (updateCount > 0) {
           setProductLines([]);
           setTargetLocator('');
        }
        inputRef.current?.focus();
    }, [updateCount]);
    
     useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const addItemsToProductLines = useCallback((itemsToAdd: Item[]) => {
        setProductLines(currentLines => {
            const linesCopy = [...currentLines];

            itemsToAdd.forEach(item => {
                const isAlreadyAdded = linesCopy.some(line => line.individualItems.some(indItem => indItem.id === item.id));
                if (isAlreadyAdded) return;

                let line = linesCopy.find(l => l.productCode === item.code);
                if (line) {
                    line.individualItems.push(item);
                    line.totalQuantity += item.quantity;
                    if (!line.sourceLocators.includes(item.currentLocator)) {
                        line.sourceLocators.push(item.currentLocator);
                    }
                } else {
                    linesCopy.push({
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
            return linesCopy;
        });
    }, []);

    const handleIdentifierSubmit = useCallback(async () => {
        if (!identifier.trim()) return;
        setIsLoading(true);
        setNotFound(false);
        const result = await wmsService.findAndProcessIdentifier(identifier);
        
        if (result.type === 'items') {
            addItemsToProductLines(result.items);
        } else if (result.type === 'prompt_quantity') {
            setQuantityPrompt({ isOpen: true, items: result.items });
        } else if (result.type === 'not_found') {
            setNotFound(true);
            setTimeout(() => setNotFound(false), 2000);
        }

        setIdentifier('');
        setIsLoading(false);
    }, [identifier, addItemsToProductLines]);
    
    const handleQuantityConfirm = (pickedItems: Item[]) => {
        addItemsToProductLines(pickedItems);
        setQuantityPrompt({ isOpen: false, items: [] });
    };

    const handleRemoveIndividualItem = (productCode: string, itemIdToRemove: string) => {
        setProductLines(currentLines => {
            const newLines = currentLines.map(line => {
                if (line.productCode === productCode) {
                    const itemToRemove = line.individualItems.find(item => item.id === itemIdToRemove);
                    if (!itemToRemove) return line;

                    const updatedItems = line.individualItems.filter(item => item.id !== itemIdToRemove);
                    
                    if(updatedItems.length === 0) return null;

                    const newTotalQuantity = line.totalQuantity - itemToRemove.quantity;
                    const newSourceLocators = [...new Set(updatedItems.map(i => i.currentLocator))];
                    
                    return {
                        ...line,
                        individualItems: updatedItems,
                        totalQuantity: newTotalQuantity,
                        sourceLocators: newSourceLocators,
                    };
                }
                return line;
            }).filter((line): line is AggregatedProductLine => line !== null);
            
            if(!newLines.some(l => l.productCode === productCode)) {
                setSerialDetail({isOpen: false, line: null});
            } else {
                 setSerialDetail(current => ({...current, line: newLines.find(l => l.productCode === productCode) || null}));
            }
            
            return newLines;
        });
    };

    const handleRemoveLine = (productCodeToRemove: string) => {
        setProductLines(currentLines => 
            currentLines.filter(line => line.productCode !== productCodeToRemove)
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProductLines(prev => prev.map(line => ({ ...line, isSelected: e.target.checked })));
    };

    const handleSelectionChange = (productCode: string) => {
        setProductLines(prev => prev.map(line => line.productCode === productCode ? { ...line, isSelected: !line.isSelected } : line));
    };

    const handleNewLocatorChange = (productCode: string, newLocator: string) => {
        setProductLines(prev => prev.map(line => {
            if (line.productCode === productCode) {
                if (!newLocator) {
                    return { ...line, newLocator: '', validation: undefined };
                }
                let finalValidation: ValidationResult = { isValid: true, type: 'info', message: 'Hợp lệ.', shortMessage: 'Hợp lệ' };
                for (const item of line.individualItems) {
                    const itemValidation = wmsService.validateMove(item, newLocator);
                    if (!itemValidation.isValid) {
                        finalValidation = itemValidation;
                        break;
                    }
                    if (itemValidation.type === 'warning' && finalValidation.type !== 'error') {
                        finalValidation = itemValidation;
                    }
                }
                return { ...line, newLocator, validation: finalValidation };
            }
            return line;
        }));
    };
    
    const handleApplyTargetLocator = useCallback(() => {
        if (!targetLocator) return;
        const upperCaseLocator = targetLocator.toUpperCase();
        setProductLines(prev => prev.map(line => {
            if (line.isSelected) {
                let finalValidation: ValidationResult = { isValid: true, type: 'info', message: 'Hợp lệ.', shortMessage: 'Hợp lệ' };
                for (const item of line.individualItems) {
                    const itemValidation = wmsService.validateMove(item, upperCaseLocator);
                    if (!itemValidation.isValid) {
                        finalValidation = itemValidation;
                        break;
                    }
                    if (itemValidation.type === 'warning' && finalValidation.type !== 'error') {
                        finalValidation = itemValidation;
                    }
                }
                return { ...line, newLocator: upperCaseLocator, validation: finalValidation };
            }
            return line;
        }));
    }, [targetLocator]);

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

    const isAllSelected = useMemo(() => productLines.length > 0 && productLines.every(line => line.isSelected), [productLines]);
    const selectedLinesCount = useMemo(() => productLines.filter(line => line.isSelected).length, [productLines]);

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
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleLocalConfirm, handleApplyTargetLocator]);


    return (
        <>
            <QuantityPromptModal
                isOpen={quantityPrompt.isOpen}
                onClose={() => setQuantityPrompt({ isOpen: false, items: [] })}
                onConfirm={handleQuantityConfirm}
                items={quantityPrompt.items}
            />
            {serialDetail.line && (
                <SerialDetailModal
                    isOpen={serialDetail.isOpen}
                    onClose={() => setSerialDetail({ isOpen: false, line: null })}
                    line={serialDetail.line}
                    onRemoveItem={handleRemoveIndividualItem}
                />
            )}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col h-full">
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b">
                    <label htmlFor="identifier-input" className="font-semibold text-slate-700">Quét/Nhập mã:</label>
                    <div className="relative flex-grow">
                         <input
                            ref={inputRef}
                            id="identifier-input"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleIdentifierSubmit()}
                            placeholder="Quét Serial, Batch, Pallet hoặc Mã sản phẩm"
                            className={`p-2 border rounded-md w-full focus:outline-none focus:ring-2 ${notFound ? 'border-red-500 ring-red-200' : 'focus:ring-indigo-500'}`}
                        />
                        {notFound && <p className="absolute text-xs text-red-600 top-full mt-1">Không tìm thấy mã.</p>}
                    </div>
                   
                    <button onClick={handleIdentifierSubmit} disabled={isLoading} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-indigo-300">
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : ICONS.SEARCH}
                        <span>Thêm</span>
                    </button>
                </div>
                
                <p className="text-sm font-semibold mb-2 text-slate-700">Danh sách sản phẩm cần chuyển ({productLines.length} dòng):</p>
                <div className="flex-grow overflow-y-auto border rounded-lg bg-slate-50">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-200 sticky top-0">
                            <tr>
                                <th className="p-2 w-12"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                <th className="p-2">Mã sản phẩm</th>
                                <th className="p-2">Tên sản phẩm</th>
                                <th className="p-2">Tổng SL</th>
                                <th className="p-2">Vị trí nguồn</th>
                                <th className="p-2">Chi tiết Lô/IMEI</th>
                                <th className="p-2">Vị trí mới</th>
                                <th className="p-2">Trạng thái</th>
                                <th className="p-2 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {productLines.map(line => (
                                <tr key={line.productCode} className={`${line.isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-2 text-center">
                                         <input type="checkbox" checked={line.isSelected} onChange={() => handleSelectionChange(line.productCode)} />
                                    </td>
                                    <td className="p-2 font-medium">{line.productCode}</td>
                                    <td className="p-2">{line.productName}</td>
                                    <td className="p-2 text-center font-bold">{line.totalQuantity}</td>
                                    <td className="p-2 text-xs">
                                        <div className="flex flex-wrap gap-1">
                                            {line.sourceLocators.map(loc => <span key={loc} className="bg-slate-200 px-2 py-1 rounded">{loc}</span>)}
                                        </div>
                                    </td>
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
                                    <td className="p-2 text-center">
                                        <button 
                                            onClick={() => handleRemoveLine(line.productCode)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                            title="Xóa dòng"
                                        >
                                            {ICONS.X_CIRCLE}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {productLines.length === 0 && !isLoading && <p className="text-center text-slate-500 py-8">Quét mã để thêm hàng hóa vào danh sách.</p>}
                </div>

                <div className="pt-4 border-t mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                         <input
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
                    <button 
                        onClick={handleLocalConfirm} 
                        className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                        disabled={productLines.length === 0}
                    >
                        Xác nhận cập nhật
                    </button>
                </div>
            </div>
        </>
    );
};