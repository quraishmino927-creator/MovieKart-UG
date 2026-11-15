import React from 'react';

interface WhatsAppSupportButtonProps {
  phoneNumber?: string;
  prefilledText?: string;
}

export const WhatsAppSupportButton: React.FC<WhatsAppSupportButtonProps> = ({
  phoneNumber = '256700000000',
  prefilledText = 'Hello MovieKart UG Support, I need assistance with streaming.',
}) => {
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(prefilledText)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with MovieKart UG Support on WhatsApp"
      title="WhatsApp Support"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-black font-extrabold text-xs px-3.5 py-2.5 shadow-xl shadow-black/60 border border-emerald-300/40 transition-all hover:scale-105 active:scale-95"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 shrink-0"
        aria-hidden="true"
      >
        <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-1.016-.328-1.734-.641-3.047-1.312-5.031-4.391-5.188-4.594-.156-.203-1.234-1.641-1.234-3.125s.781-2.219 1.063-2.516c.281-.297.609-.375.813-.375.203 0 .406 0 .578.016.188.016.438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.109.203-.156.328-.313.5-.156.172-.328.391-.469.516-.156.156-.328.328-.141.641.188.313.844 1.391 1.813 2.25 1.25 1.109 2.297 1.453 2.609 1.609.313.156.5.125.688-.078.188-.203.797-.922 1.016-1.234.219-.313.422-.266.719-.156.297.109 1.875.891 2.203 1.047.328.156.547.234.625.375.078.141.078.813-.172 1.516z" />
      </svg>
      <span className="text-[11px] sm:text-xs">WhatsApp</span>
      <span className="hidden sm:inline text-xs">Support</span>
    </a>
  );
};
