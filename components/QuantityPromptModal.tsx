import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../types';

interface QuantityPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pickedItems: Item[]) => void;
  items: Item[];
}

export const QuantityPromptModal: React.FC<QuantityPromptModalProps> = ({ isOpen, onClose, onConfirm, items }) => {
  const [quantities, setQuantities] = useState<Record<string, number | ''>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
        setQuantities({});
        setErrors({});
        setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || items.length === 0) return null;

  const handleQuantityChange = (itemId: string, value: string) => {
      setQuantities(prev => ({...prev, [itemId]: value === '' ? '' : Number(value) }));
  }

  const handleConfirm = () => {
    let hasError = false;
    const newErrors: Record<string, string> = {};
    const pickedItems: Item[] = [];

    items.forEach(item => {
        const inputQty = quantities[item.id];
        if (!inputQty || inputQty === 0) return; // Skip if no quantity entered

        const numQuantity = Number(inputQty);
        if (isNaN(numQuantity) || numQuantity < 0) {
            newErrors[item.id] = 'Số lượng không hợp lệ.';
            hasError = true;
        } else if (numQuantity > item.quantity) {
            newErrors[item.id] = `Không vượt quá tồn kho (${item.quantity}).`;
            hasError = true;
        } else {
            pickedItems.push({
                ...item,
                id: `${item.id}-picked-${numQuantity}`, // Unique ID for the pick
                quantity: numQuantity,
                sourceItemId: item.id, // Reference to original stock item
            });
        }
    });

    setErrors(newErrors);
    if (!hasError && pickedItems.length > 0) {
        onConfirm(pickedItems);
    } else if (!hasError && pickedItems.length === 0) {
        onClose(); // Close if nothing was entered
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          handleConfirm();
      }
      if (e.key === 'Escape') {
          onClose();
      }
  };

  const productInfo = items[0];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-5 border-b">
            <h3 className="text-lg font-medium text-slate-900">Nhập số lượng cho Lô/Sản phẩm</h3>
             <p className="text-sm text-slate-500 mt-1">
                <span className="font-semibold">{productInfo.name} ({productInfo.code})</span> được tìm thấy ở nhiều vị trí.
             </p>
        </div>
        <div className="p-5 flex-grow overflow-y-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left bg-slate-50">
                        <th className="p-2 font-semibold">Vị trí nguồn</th>
                        <th className="p-2 font-semibold">Lô/Batch</th>
                        <th className="p-2 font-semibold text-center">Tồn kho</th>
                        <th className="p-2 font-semibold">Số lượng cần chuyển</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                        <tr key={item.id}>
                            <td className="p-2 font-medium">{item.currentLocator}</td>
                            <td className="p-2 text-xs">{item.expiryOrImei}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2">
                                <input
                                    ref={index === 0 ? firstInputRef : null}
                                    type="number"
                                    value={quantities[item.id] || ''}
                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                    placeholder="0"
                                    className={`p-1 border rounded-md w-24 ${errors[item.id] ? 'border-red-500' : 'border-slate-300'}`}
                                    min="0"
                                    max={item.quantity}
                                />
                                {errors[item.id] && <p className="text-xs text-red-600 mt-1">{errors[item.id]}</p>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 flex justify-between items-center rounded-b-lg">
            <span className="text-xs text-slate-500">Mẹo: Nhấn <kbd className="font-sans font-semibold">Ctrl+Enter</kbd> để xác nhận</span>
            <div className="flex space-x-3">
                <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={onClose}
                >
                    Hủy
                </button>
                <button
                    type="button"
                    className="rounded-md border border-transparent px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
                    onClick={handleConfirm}
                >
                    Xác nhận
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};