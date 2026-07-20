export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="font-display text-[1.75rem] font-semibold">You&apos;re offline</h1>
      <p className="text-text-muted">
        Tournament OS needs a connection for live data. Reconnect and try again.
      </p>
    </main>
  );
}
