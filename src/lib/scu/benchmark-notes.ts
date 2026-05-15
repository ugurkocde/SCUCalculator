// Editorial takeaways shown under each /benchmark stat block.
//
// Keys follow `cohortKey()` below:
//   "overall"
//   "band:1000_4999"
//   "tier:e5_security"
//   "band:1000_4999|tier:e5_security"
//
// Add a one-or-two-sentence interpretation only when you have something to say.
// Missing or empty entries = no editorial line rendered for that cohort.

export const BENCHMARK_NOTES: Record<string, string> = {
  // Example (uncomment + edit when you have enough data to interpret):
  // "band:1000_4999":
  //   "Tenants this size pay ~19% more than the calculator predicts — agent runs are the main miss in the default estimate.",
};

export const cohortKey = (
  paidUserBand: string | null,
  licenseTier: string | null,
): string => {
  if (!paidUserBand && !licenseTier) return "overall";
  if (paidUserBand && !licenseTier) return `band:${paidUserBand}`;
  if (!paidUserBand && licenseTier) return `tier:${licenseTier}`;
  return `band:${paidUserBand}|tier:${licenseTier}`;
};
