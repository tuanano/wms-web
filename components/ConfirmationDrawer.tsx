import React from 'react';
import { Item } from '../types';
import { ICONS } from '../constants';
import { wmsService } from '../services/wmsService';

interface ConfirmationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: Item[];
  view: 'confirming' | 'success';
}

const renderNewLocatorDisplay = (newLocator?: string) => {
    if (!newLocator) return 'N/A';
    if (newLocator.toUpperCase().startsWith('PAL-')) {
        const location = wmsService.getPalletLocationSync(newLocator);
        return (
        <>
            {newLocator}
            <span className="text-slate-500 font-normal ml-1">({location || 'Vị trí không rõ'})</span>
        </>
        );
    }
    return newLocator;
};


const ConfirmationView: React.FC<Pick<ConfirmationDrawerProps, 'onClose' | 'onConfirm' | 'items'>> = ({ onClose, onConfirm, items }) => {
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    return (
        <>
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-semibold">Xác nhận cập nhật</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800">{ICONS.X_CIRCLE}</button>
            </div>
            <div className="p-4 flex-grow overflow-y-auto">
                <div className="bg-slate-100 p-3 rounded-md mb-4">
                    <p className="font-bold">Tổng: {items.length} dòng | {totalItems} đơn vị</p>
                </div>
                <h3 className="font-semibold mb-2">Tóm tắt thay đổi:</h3>
                <ul className="space-y-2">
                    {items.map(item => (
                    <li key={item.id} className="text-sm border p-2 rounded-md">
                        <p className="font-bold">{item.code} ({item.quantity}u) - {item.name}</p>
                        <p className="text-slate-600">{item.expiryOrImei || 'N/A'}</p>
                        <div className="flex items-center justify-center mt-1">
                        <span className="bg-slate-200 px-2 py-1 rounded-l-md">{item.currentLocator}</span>
                        <span className="font-bold text-indigo-600 mx-2">→</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-r-md font-semibold">
                            {renderNewLocatorDisplay(item.newLocator)}
                        </span>
                        </div>
                    </li>
                    ))}
                </ul>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end space-x-3">
                <button onClick={onClose} className="bg-white border border-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-md hover:bg-slate-50">
                    Hủy
                </button>
                <button onClick={onConfirm} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700">
                    Thực hiện
                </button>
            </div>
        </>
    );
};

const SuccessView: React.FC<Pick<ConfirmationDrawerProps, 'onClose' | 'items'>> = ({ onClose, items }) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const handlePrint = () => window.print();

    return (
        <>
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                    }
                }
            `}</style>
            <div className="flex justify-between items-center p-4 border-b print:hidden">
                <h2 className="text-xl font-semibold text-green-600">Thực hiện thành công</h2>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-800">{ICONS.X_CIRCLE}</button>
            </div>
            <div className="p-6 flex-grow overflow-y-auto print:overflow-visible print:p-4 print-section">
                <div className="hidden print:block mb-6 text-center">
                    <h1 className="text-2xl font-bold">Biên bản di chuyển vị trí</h1>
                    <p className="text-sm">Ngày giờ: {new Date().toLocaleString('vi-VN')}</p>
                    <p className="text-sm">Người thực hiện: tuan.le</p>
                </div>
                
                <div className="bg-slate-100 p-3 rounded-md mb-4 text-sm print:bg-white print:border print:border-slate-300">
                    <p><span className="font-semibold">Tổng cộng:</span> {items.length} dòng sản phẩm, {totalItems} đơn vị đã được di chuyển.</p>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-slate-100 print:bg-slate-200">
                        <tr className="text-left">
                            <th className="p-2 font-semibold">Mã sản phẩm</th>
                            <th className="p-2 font-semibold">Tên sản phẩm</th>
                            <th className="p-2 font-semibold">Lô/IMEI</th>
                            <th className="p-2 font-semibold text-center">SL</th>
                            <th className="p-2 font-semibold">Vị trí cũ</th>
                            <th className="p-2 font-semibold">Vị trí mới</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {items.map((item) => (
                            <tr key={item.id} className="print:break-inside-avoid">
                                <td className="p-2 font-medium">{item.code}</td>
                                <td className="p-2">{item.name}</td>
                                <td className="p-2 font-mono text-xs">{item.expiryOrImei}</td>
                                <td className="p-2 text-center font-bold">{item.quantity}</td>
                                <td className="p-2"><span className="bg-slate-200 px-2 py-1 rounded print:bg-transparent print:p-0">{item.currentLocator}</span></td>
                                <td className="p-2 font-semibold"><span className="bg-green-100 text-green-800 px-2 py-1 rounded print:bg-transparent print:p-0 print:text-black">{renderNewLocatorDisplay(item.newLocator)}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t bg-slate-50 flex justify-end space-x-3 print:hidden">
                <button onClick={handlePrint} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 flex items-center space-x-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span>In kết quả</span>
                </button>
                <button onClick={onClose} className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700">
                    Đóng
                </button>
            </div>
        </>
    );
}

export const ConfirmationDrawer: React.FC<ConfirmationDrawerProps> = ({ isOpen, onClose, onConfirm, items, view }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose}>
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} ease-in-out duration-300 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'confirming' && <ConfirmationView items={items} onConfirm={onConfirm} onClose={onClose} />}
        {view === 'success' && <SuccessView items={items} onClose={onClose} />}
      </div>
    </div>
  );
};