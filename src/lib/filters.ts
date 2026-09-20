/**
 * Builds a stable key from a set of filter values.
 *
 * React only applies `defaultValue` on an uncontrolled input's initial mount,
 * so navigating between filtered states (e.g. via a "Clear filters" link)
 * does not reset inputs whose DOM nodes are reused across the navigation.
 * Using this key on the filter form forces React to remount the form -
 * and reset every input - whenever the underlying filter values change.
 */
export function buildFilterKey(values: Array<string | undefined>): string {
  return values.map((value) => value ?? "").join("|");
}
