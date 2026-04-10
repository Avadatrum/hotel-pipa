import { useEffect } from 'react';
import { useOS } from '../../contexts/OSContext';
import { OSNotificationToast } from './OSNotificationToast';
import { generateOSWhatsAppLink } from '../../utils/osHelpers';

export function OSNotificationContainer() {
  const { lastCreatedOrder, showNotification, setShowNotification } = useOS();
  
  useEffect(() => {
    if (lastCreatedOrder) {
      setShowNotification(true);
    }
  }, [lastCreatedOrder]);
  
  if (!showNotification || !lastCreatedOrder) return null;
  
  const handleShareWhatsApp = () => {
    const link = generateOSWhatsAppLink(lastCreatedOrder);
    window.open(link, '_blank');
  };
  
  return (
    <OSNotificationToast
      order={lastCreatedOrder}
      onClose={() => {
        setShowNotification(false);
      }}
      onShareWhatsApp={handleShareWhatsApp}
    />
  );
}