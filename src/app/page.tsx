import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Survey Shark</h1>
          <p className="text-sm text-slate-500 mt-1">Field data collection platform</p>
        </div>
        <div className="space-y-3">
          <Link href="/collect" className="block rounded-md bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800">
            Start collecting data
          </Link>
          <Link href="/admin/login" className="block text-sm text-slate-500 hover:text-slate-900">
            Researcher admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
