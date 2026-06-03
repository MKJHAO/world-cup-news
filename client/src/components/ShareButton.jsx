import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ title, text, url }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    const shareText = text || title || '';

    if (navigator.share) {
      try {
        await navigator.share({ title: title || '世界杯足球资讯', text: shareText, url: shareUrl });
        return;
      } catch (e) { /* user cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* ignore */ }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all"
      title="分享"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? '已复制' : '分享'}
    </button>
  );
}
