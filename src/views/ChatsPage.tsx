'use client';

import MeizitoChatEmbed from '@/src/views/meizito/components/MeizitoChatEmbed';

export default function ChatsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">گفتگوها</h1>
        <p className="text-sm text-gray-500 mt-1">
          گفتگوی شخصی، گروه و کانال — یک جام برای همه مکالمات تیمی
        </p>
      </div>
      <MeizitoChatEmbed variant="full" />
    </div>
  );
}
