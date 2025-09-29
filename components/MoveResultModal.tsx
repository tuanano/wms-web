import React from 'react';
import { Item } from '../types';
import { ICONS } from '../constants';

interface MoveResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  moveDetails: Item[];
}

export const MoveResultModal: React.FC<MoveResultModalProps> = ({ isOpen, onClose, moveDetails }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalItems = moveDetails.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center print:bg-white" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh] print:shadow-none print:m-0 print:max-h-full print:h-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex justify-between items-center print:hidden">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Kết quả di chuyển vị trí</h3>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleString('vi-VN')} - User: tuan.le
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">{ICONS.X_CIRCLE}</button>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto print:overflow-visible print:p-4">
            <div className="hidden print:block mb-6 text-center">
                <h1 className="text-2xl font-bold">Biên bản di chuyển vị trí</h1>
                <p className="text-sm">Ngày giờ: {new Date().toLocaleString('vi-VN')}</p>
                <p className="text-sm">Người thực hiện: tuan.le</p>
            </div>
            
            <div className="bg-slate-100 p-3 rounded-md mb-4 text-sm print:bg-white print:border print:border-slate-300">
                <p><span className="font-semibold">Tổng cộng:</span> {moveDetails.length} dòng sản phẩm, {totalItems} đơn vị đã được di chuyển.</p>
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
                    {moveDetails.map((item) => (
                        <tr key={item.id} className="print:break-inside-avoid">
                            <td className="p-2 font-medium">{item.code}</td>
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 font-mono text-xs">{item.expiryOrImei}</td>
                            <td className="p-2 text-center font-bold">{item.quantity}</td>
                            <td className="p-2"><span className="bg-slate-200 px-2 py-1 rounded print:bg-transparent print:p-0">{item.currentLocator}</span></td>
                            <td className="p-2 font-semibold"><span className="bg-green-100 text-green-800 px-2 py-1 rounded print:bg-transparent print:p-0 print:text-black">{item.newLocator}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="bg-slate-50 px-4 py-3 sm:px-6 flex justify-end space-x-3 rounded-b-lg print:hidden">
            <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={onClose}
            >
                Đóng
            </button>
            <button
                type="button"
                className="rounded-md border border-transparent px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 flex items-center space-x-2"
                onClick={handlePrint}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span>In kết quả</span>
            </button>
        </div>
      </div>
    </div>
  );
};