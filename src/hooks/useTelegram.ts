import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showBackButton, hideBackButton, showMainButton, hideMainButton, setMainButtonLoading } from '@/lib/telegram';

/** Wires up the Telegram Back Button to navigate(-1) */
export const useTelegramBackButton = (enabled = true) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    const handler = () => navigate(-1);
    showBackButton(handler);
    return () => hideBackButton(handler);
  }, [enabled, navigate]);
};

interface MainButtonOptions {
  text: string;
  onClick: () => void;
  loading?: boolean;
  enabled?: boolean;
}

/** Wires up the Telegram Main Button */
export const useTelegramMainButton = ({
  text,
  onClick,
  loading = false,
  enabled = true,
}: MainButtonOptions) => {
  useEffect(() => {
    if (!enabled) return;
    showMainButton(text, onClick);
    return () => hideMainButton(onClick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  useEffect(() => {
    setMainButtonLoading(loading);
  }, [loading]);
};
