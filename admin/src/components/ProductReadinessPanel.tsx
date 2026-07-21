import {
  getAdminProductReadinessIssues,
  getAdminProductReadinessScore,
  type AdminProductReadinessIssue,
  type AdminProductReadinessInput,
} from '@/lib/product-readiness';

type ProductReadinessPanelProps = {
  input: AdminProductReadinessInput;
};

export default function ProductReadinessPanel({
  input,
}: ProductReadinessPanelProps) {
  const issues: AdminProductReadinessIssue[] =
    getAdminProductReadinessIssues(input);
  const score = getAdminProductReadinessScore(input);
  const isReady = issues.length === 0;

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        isReady
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Storefront readiness
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Public products must pass this gate before they can look premium on
            odhvica.com.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isReady
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {score}%
        </span>
      </div>

      {isReady ? (
        <p className="mt-4 rounded-lg bg-white/70 px-3 py-2 text-xs font-medium text-emerald-800">
          Ready to publish.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {issues.map((issue) => (
            <li
              key={`${issue.field}-${issue.message}`}
              className="rounded-lg bg-white/70 px-3 py-2 text-xs leading-relaxed text-amber-900"
            >
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
