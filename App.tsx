import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ByLocatorView } from './components/ByLocatorView';
import { ByItemView } from './components/ByItemView';
import { ConfirmationDrawer } from './components/ConfirmationDrawer';
import { Toast } from './components/Toast';
import { View, ToastState, UpdatePayload, Item } from './types';
import { wmsService } from './services/wmsService';
import { ConfirmationModal } from './components/ConfirmationModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.BY_LOCATOR);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<'confirming' | 'success'>('confirming');
  const [pendingUpdates, setPendingUpdates] = useState<Item[]>([]);
  const [completedUpdates, setCompletedUpdates] = useState<Item[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastUpdates, setLastUpdates] = useState<UpdatePayload[]>([]);
  const [updateCount, setUpdateCount] = useState(0);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    message: React.ReactNode;
    onConfirm?: () => void;
  }>({ isOpen: false, message: '' });

  const handleConfirmUpdate = useCallback((itemsToUpdate: Item[]) => {
    const validUpdates = itemsToUpdate.filter(item => item.newLocator && item.validation?.isValid);
    if (validUpdates.length === 0) {
      setToast({
        type: 'error',
        message: 'Không có cập nhật hợp lệ nào để xác nhận.',
      });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const proceedWithUpdates = () => {
      setPendingUpdates(validUpdates);
      setDrawerContent('confirming');
      setDrawerOpen(true);
    };

    const nonEmptyLocationUpdates = validUpdates.filter(item => 
      item.validation?.type === 'warning' && item.validation.message?.includes('đã có hàng')
    );

    if (nonEmptyLocationUpdates.length > 0) {
      const uniqueLocators = [...new Set(nonEmptyLocationUpdates.map(item => item.newLocator!))];
      const locatorsString = uniqueLocators.join(', ');
      setConfirmationState({
        isOpen: true,
        message: (
          <>
            <p>Các vị trí sau đang có hàng: <strong className="font-semibold text-indigo-600">{locatorsString}</strong>.</p>
            <p className="mt-2">Bạn có chắc chắn muốn tiếp tục?</p>
          </>
        ),
        onConfirm: () => proceedWithUpdates(),
      });
    } else {
      proceedWithUpdates();
    }
  }, []);
  
  const handleCloseConfirmationModal = () => {
    setConfirmationState({ isOpen: false, message: '' });
  };

  const handleExecuteUpdates = useCallback(async () => {
    const updatePayloads: UpdatePayload[] = pendingUpdates.map(item => ({
      itemId: item.id,
      oldLocator: item.currentLocator,
      newLocator: item.newLocator!,
    }));
    
    const completedItems = [...pendingUpdates];
    setCompletedUpdates(completedItems);

    setLastUpdates(updatePayloads);
    await wmsService.applyUpdates(updatePayloads);
    setDrawerContent('success'); // Switch drawer to success view instead of closing
    
    const totalItems = completedItems.reduce((sum, item) => sum + item.quantity, 0);
    setToast({
      type: 'success',
      message: `Đã cập nhật ${completedItems.length} dòng (${totalItems} đơn vị).`,
      onUndo: () => handleUndo(),
    });

    const timer = setTimeout(() => {
      setToast(currentToast => (currentToast?.onUndo ? { ...currentToast, onUndo: undefined } : currentToast));
    }, 30000);
    
    setPendingUpdates([]);
    setUpdateCount(count => count + 1);

    return () => clearTimeout(timer);
  }, [pendingUpdates]);

  const handleUndo = useCallback(async () => {
    if (lastUpdates.length > 0) {
      const undoPayloads = lastUpdates.map(update => ({
        itemId: update.itemId,
        oldLocator: update.newLocator,
        newLocator: update.oldLocator,
      }));
      await wmsService.applyUpdates(undoPayloads);
      
      setToast({
        type: 'info',
        message: 'Thao tác cuối đã được hoàn tác.',
      });
      setLastUpdates([]);
       setTimeout(() => setToast(null), 4000);
       setUpdateCount(count => count + 1);
    }
  }, [lastUpdates]);

  const handleCloseToast = useCallback(() => {
    setToast(null);
  }, []);
  
   useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'z') {
                event.preventDefault();
                handleUndo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleUndo]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    // Reset to confirming view after a short delay to allow closing animation
    setTimeout(() => {
        setDrawerContent('confirming');
        setCompletedUpdates([]);
    }, 300);
  }

  return (
    <div className="flex flex-col h-screen font-sans text-slate-800">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <main className="flex-grow p-4 bg-slate-100 overflow-y-auto">
        {currentView === View.BY_LOCATOR && <ByLocatorView onConfirm={handleConfirmUpdate} updateCount={updateCount} />}
        {currentView === View.BY_ITEM && <ByItemView onConfirm={handleConfirmUpdate} updateCount={updateCount} />}
      </main>
      <ConfirmationDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onConfirm={handleExecuteUpdates}
        items={drawerContent === 'confirming' ? pendingUpdates : completedUpdates}
        view={drawerContent}
      />
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={handleCloseToast}
          onUndo={toast.onUndo}
        />
      )}
       <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => {
          confirmationState.onConfirm?.();
          handleCloseConfirmationModal();
        }}
        title="Xác nhận di chuyển"
      >
        {confirmationState.message}
      </ConfirmationModal>
      <footer className="bg-white border-t border-slate-200 px-4 py-1 text-xs text-slate-500 flex justify-center items-center space-x-6">
          <span><kbd className="font-sans font-semibold">Ctrl+Enter</kbd>: Xác nhận</span>
          <span><kbd className="font-sans font-semibold">Ctrl+Z</kbd>: Hoàn tác</span>
          <span><kbd className="font-sans font-semibold">Alt+S</kbd>: Áp dụng vị trí</span>
          <span><kbd className="font-sans font-semibold">Tab</kbd>: Di chuyển</span>
      </footer>
    </div>
  );
};

export default App;