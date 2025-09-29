import React from 'react';
import { AggregatedProductLine, Item } from '../types';
import { ICONS } from '../constants';

interface SerialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: AggregatedProductLine;
  onRemoveItem?: (productCode: string, itemIdToRemove: string) => void;
}

export const SerialDetailModal: React.FC<SerialDetailModalProps> = ({ isOpen, onClose, line, onRemoveItem }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b">
            <h3 className="text-lg font-medium text-slate-900">Chi tiết Lô/IMEI</h3>
             <p className="text-sm text-slate-500 mt-1">
                Sản phẩm: <span className="font-semibold">{line.productName} ({line.productCode})</span>
             </p>
        </div>
        <div className="p-5 flex-grow overflow-y-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50">
                    <tr className="text-left">
                        <th className="p-2 font-semibold">Lô/IMEI</th>
                        <th className="p-2 font-semibold">Vị trí nguồn</th>
                        <th className="p-2 font-semibold">Pallet</th>
                        <th className="p-2 font-semibold text-center">SL</th>
                        {onRemoveItem && <th className="p-2 w-16"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {line.individualItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-xs">{item.expiryOrImei}</td>
                            <td className="p-2">{item.currentLocator}</td>
                            <td className="p-2">
                                {item.palletId ? (
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                        {item.palletId}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </td>
                            <td className="p-2 text-center font-semibold">{item.quantity}</td>
                            {onRemoveItem && (
                                <td className="p-2 text-center">
                                    <button
                                      onClick={() => onRemoveItem(line.productCode, item.id)}
                                      className="text-red-500 hover:text-red-700"
                                      title="Xóa Serial/dòng này"
                                    >
                                      {ICONS.X_CIRCLE}
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="bg-slate-50 px-4 py-3 sm:px-6 flex justify-end rounded-b-lg">
            <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={onClose}
            >
                Đóng
            </button>
        </div>
      </div>
    </div>
  );
};