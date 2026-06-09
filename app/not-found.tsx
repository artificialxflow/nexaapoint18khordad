import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-neutral-300">۴۰۴</p>
      <h1 className="text-xl font-semibold text-neutral-800">صفحه پیدا نشد</h1>
      <p className="max-w-md text-sm text-neutral-500">
        آدرسی که وارد کردید وجود ندارد یا منتقل شده است.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
      >
        بازگشت به خانه
      </Link>
    </div>
  );
}
