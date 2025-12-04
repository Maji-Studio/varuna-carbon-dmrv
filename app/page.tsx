export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col items-center gap-8 px-8 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Varuna Carbon DMRV
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Digital Measurement, Reporting, and Verification for Carbon Projects
          </p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
              Measurement
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Accurate carbon sequestration tracking using satellite imagery and ground-truth data.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
              Reporting
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Automated reports for stakeholders, registries, and verification bodies.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
              Verification
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Transparent audit trails and third-party verification support.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Real-time insights into project performance and carbon credits.
            </p>
          </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Powered by Dark Earth Carbon
        </p>
      </main>
    </div>
  );
}
