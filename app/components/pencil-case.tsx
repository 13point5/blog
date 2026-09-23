/**
 * Wrap a markdown list in MDX to print each item on a construction pencil:
 *
 *   <PencilCase>
 *
 *   - Sample efficiency
 *   - Continual learning
 *
 *   </PencilCase>
 */
export function PencilCase({ children }: { children: React.ReactNode }) {
  return <div className="pencil-case">{children}</div>;
}
